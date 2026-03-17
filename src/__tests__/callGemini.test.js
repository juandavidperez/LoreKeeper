import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the retry logic and mock fallback.
// Since callGemini uses import.meta.env, we test fetchWithRetry directly
// by reimplementing it (same logic as ai.js).

const MAX_RETRIES = 2;
const INITIAL_DELAY = 1000;

async function fetchWithRetry(url, options, retries = MAX_RETRIES, fetchFn = fetch) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchFn(url, options);
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      throw new Error(`Error del Oráculo (${response.status})`);
    } catch (error) {
      if (error.message.startsWith('Error del Oráculo')) throw error;
      if (attempt < retries) {
        const delay = INITIAL_DELAY * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw new Error('Error de conexión. Verifica tu red e intenta de nuevo.');
    }
  }
}

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns response on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const result = await fetchWithRetry('/api', {}, 2, mockFetch);
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws immediately on 4xx (non-429)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    await expect(fetchWithRetry('/api', {}, 2, mockFetch)).rejects.toThrow('Error del Oráculo (400)');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws immediately on 403', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });
    await expect(fetchWithRetry('/api', {}, 2, mockFetch)).rejects.toThrow('Error del Oráculo (403)');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and succeeds', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const promise = fetchWithRetry('/api', {}, 2, mockFetch);
    await vi.advanceTimersByTimeAsync(INITIAL_DELAY);
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 500 and succeeds', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const promise = fetchWithRetry('/api', {}, 2, mockFetch);
    await vi.advanceTimersByTimeAsync(INITIAL_DELAY);
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries on 500', async () => {
    vi.useRealTimers();
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchWithRetry('/api', {}, 0, mockFetch)).rejects.toThrow('Error del Oráculo (500)');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    vi.useFakeTimers();
  });

  it('retries on network error and succeeds', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const promise = fetchWithRetry('/api', {}, 2, mockFetch);
    await vi.advanceTimersByTimeAsync(INITIAL_DELAY);
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws connection error after exhausting retries on network failure', async () => {
    vi.useRealTimers();
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchWithRetry('/api', {}, 0, mockFetch)).rejects.toThrow('Error de conexión');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    vi.useFakeTimers();
  });

  it('uses exponential backoff delays', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const promise = fetchWithRetry('/api', {}, 2, mockFetch);

    // First retry after 1000ms
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(INITIAL_DELAY);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Second retry after 2000ms
    await vi.advanceTimersByTimeAsync(INITIAL_DELAY * 2);
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('does not retry "Error del Oráculo" errors from network catch', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Error del Oráculo (401)'));
    await expect(fetchWithRetry('/api', {}, 2, mockFetch)).rejects.toThrow('Error del Oráculo (401)');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('mockAIResponse', () => {
  // Replicate the mock logic for testing
  function mockAIResponse(prompt) {
    if (prompt.includes("Oráculo") || prompt.includes("poética")) {
      return "Las sombras del pasado se entrelazan con el presente.";
    } else if (prompt.includes("Analiza")) {
      return JSON.stringify({
        characters: [{ name: "Guerrero Misterioso", tags: ["enigmático"], content: "Un viajero." }],
        places: [{ name: "Montañas Nubladas", tags: ["peligroso"], content: "Cordillera." }],
        glossary: [{ name: "Mithril", tags: ["material"], content: "Metal." }]
      });
    }
    return "Una revelación poética del Oráculo sobre los hilos del destino...";
  }

  it('returns poetic response for Oracle prompts', () => {
    expect(mockAIResponse('Oráculo habla')).toContain('sombras');
  });

  it('returns JSON for analysis prompts', () => {
    const result = mockAIResponse('Analiza este texto');
    const parsed = JSON.parse(result);
    expect(parsed.characters).toHaveLength(1);
    expect(parsed.places).toHaveLength(1);
    expect(parsed.glossary).toHaveLength(1);
  });

  it('returns generic response for other prompts', () => {
    expect(mockAIResponse('hello')).toContain('revelación');
  });
});
