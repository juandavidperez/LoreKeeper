const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const MAX_RETRIES = 2;
const INITIAL_DELAY = 1000;

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
          const delay = INITIAL_DELAY * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      const errMsg = response.status === 429
        ? 'El Oráculo está abrumado por demasiadas consultas. Aguarda un momento y vuelve a invocar.'
        : response.status >= 500
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const proxyUrl = import.meta.env.VITE_API_PROXY_URL;

  if (!apiKey && !proxyUrl) {
    return mockAIResponse(prompt);
  }

  // In production, require proxy to avoid exposing the API key in the browser
  if (!proxyUrl && import.meta.env.PROD) {
    console.warn('Gemini API key is exposed client-side. Set VITE_API_PROXY_URL for production.');
  }

  const url = proxyUrl || `${GEMINI_API_URL}?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: schema ? {
      responseMimeType: "application/json",
      responseSchema: schema
    } : undefined
  };

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("El Oráculo no devolvió respuesta.");
  return text;
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
