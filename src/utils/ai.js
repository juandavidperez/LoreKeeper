const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-flash-latest";

const MAX_RETRIES = 2;
const INITIAL_DELAY = 2000;

let IS_AI_GLOBAL_BUSY = false;

// To avoid exposing the API key in the browser, set VITE_API_PROXY_URL
// to a server-side proxy (e.g. Cloudflare Worker, Vercel edge function).
// The proxy should forward requests to the Gemini API and inject the key server-side.

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry client errors (4xx) except 429 (rate limit)
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          // Double the delay for 429 to avoid hammering
          const factor = response.status === 429 ? 3 : 2;
          const delay = INITIAL_DELAY * Math.pow(factor, attempt);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      if (response.status === 429) {
        throw new Error('El Oráculo está abrumado por demasiadas consultas. Aguarda un momento y vuelve a invocar.');
      }
      const errMsg = response.status >= 500
          ? 'Las fuerzas del Éter están inestables. El Oráculo no puede responder ahora.'
          : `El Oráculo rechaza esta consulta (código ${response.status}).`;
      throw new Error(errMsg);
    } catch (error) {
      if (error.message.startsWith('El Oráculo') || error.message.startsWith('Las fuerzas')) throw error;
      // Network errors — retry
      if (attempt < retries) {
        const delay = INITIAL_DELAY * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw new Error('La conexión con el Éter se ha roto. Verifica tu red e intenta de nuevo.');
    }
  }
}

export const callGemini = async (prompt, systemInstruction = "", schema = null) => {
  if (IS_AI_GLOBAL_BUSY) {
    console.warn('AI request blocked by global lock.');
    throw new Error('El Oráculo ya está procesando una consulta. Aguarda un momento.');
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  // No key and no server proxy available — use mocks
  if (!apiKey && import.meta.env.DEV) {
    return mockAIResponse(prompt);
  }

  IS_AI_GLOBAL_BUSY = true;
  try {
    const model = import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL;

    const payload = {
      model,
      contents: [
        { role: 'user', parts: [{ text: `[SISTEMA: ${systemInstruction || 'Eres el Oráculo del Archivo.'}]` }] },
        { role: 'model', parts: [{ text: 'Entendido. Las sombras se aclaran ante mi vista. Procede.' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generation_config: schema ? {
        response_mime_type: "application/json",
        response_schema: schema
      } : undefined
    };

    // Dev with VITE_GEMINI_API_KEY → call Google directly (no Vercel runtime needed)
    // Production / vercel dev → proxy via /api/gemini (key stays server-side)
    let url, body;
    if (apiKey) {
      url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
      const { model: _m, ...directPayload } = payload;
      body = JSON.stringify(directPayload);
    } else {
      url = '/api/gemini';
      body = JSON.stringify(payload);
    }

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("El Oráculo no devolvió respuesta.");
    return text;
  } finally {
    IS_AI_GLOBAL_BUSY = false;
  }
};

const mockAIResponse = (prompt) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (prompt.includes("Oráculo") || prompt.includes("poética")) {
        resolve("Las sombras del pasado se entrelazan con el presente. En los registros del Archivo se lee un destino marcado por la valentía y el misterio, donde cada paso dado resuena en las Montañas Nubladas como un susurro de los antiguos dioses. La sabiduría no se encuentra en el acero, sino en el corazón de quien lo empuña.");
      } else if (prompt.includes("Analiza")) {
        resolve(JSON.stringify({
          characters: [{ name: "Guerrero Misterioso", tags: ["enigmático"], content: "Un viajero cuyo pasado permanece oculto." }],
          places: [{ name: "Montañas Nubladas", tags: ["peligroso"], content: "Cordillera envuelta en niebla perpetua." }],
          glossary: [{ name: "Mithril", tags: ["material"], content: "Metal precioso más resistente que el acero." }]
        }));
      } else {
        resolve("Una revelación poética del Oráculo sobre los hilos del destino...");
      }
    }, 1500);
  });
};
