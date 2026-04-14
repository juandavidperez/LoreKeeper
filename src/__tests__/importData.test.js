import { describe, it, expect } from 'vitest';

// Replicates importData validation + normalization logic from useLorekeeperState
function validateImportData(jsonString) {
  const data = JSON.parse(jsonString);

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('El archivo no contiene un objeto JSON válido.');
  }

  if (data.books !== undefined && !Array.isArray(data.books)) throw new Error('Campo "books" debe ser un array.');
  if (data.phases !== undefined && !Array.isArray(data.phases)) throw new Error('Campo "phases" debe ser un array.');
  if (data.schedule !== undefined && !Array.isArray(data.schedule)) throw new Error('Campo "schedule" debe ser un array.');
  if (data.entries !== undefined && !Array.isArray(data.entries)) throw new Error('Campo "entries" debe ser un array.');
  if (data.completedWeeks !== undefined && !Array.isArray(data.completedWeeks)) throw new Error('Campo "completedWeeks" debe ser un array.');

  if (data.books) {
    for (const book of data.books) {
      if (!book.title || typeof book.title !== 'string') {
        throw new Error('Cada libro debe tener un campo "title" de tipo texto.');
      }
    }
  }

  if (data.entries) {
    for (const entry of data.entries) {
      if (!entry.id) throw new Error('Cada entrada debe tener un campo "id".');
      if (!entry.book || typeof entry.book !== 'string') {
        throw new Error('Cada entrada debe tener un campo "book" de tipo texto.');
      }
      if (entry.readingTime !== undefined && (typeof entry.readingTime !== 'number' || !isFinite(entry.readingTime))) {
        throw new Error(`Entrada "${entry.id}": el campo "readingTime" debe ser un número.`);
      }
    }
  }

  return data;
}

function normalizeEntries(entries) {
  return entries.map(e => ({
    ...e,
    readingTime: Math.max(0, Math.round(Number(e.readingTime) || 0)),
  }));
}

describe('importData validation', () => {
  it('accepts valid complete data', () => {
    const data = {
      books: [{ title: 'El Hobbit', id: '1' }],
      entries: [{ id: 1, book: 'El Hobbit', date: '2025-01-01' }],
      phases: [],
      schedule: [],
      completedWeeks: [],
    };
    expect(() => validateImportData(JSON.stringify(data))).not.toThrow();
  });

  it('accepts partial data (only books)', () => {
    expect(() => validateImportData(JSON.stringify({ books: [{ title: 'Test' }] }))).not.toThrow();
  });

  it('accepts empty object', () => {
    expect(() => validateImportData(JSON.stringify({}))).not.toThrow();
  });

  it('rejects invalid JSON', () => {
    expect(() => validateImportData('not json')).toThrow();
  });

  it('rejects null', () => {
    expect(() => validateImportData('null')).toThrow('objeto JSON válido');
  });

  it('rejects array at top level', () => {
    expect(() => validateImportData('[]')).toThrow('objeto JSON válido');
  });

  it('rejects books as non-array', () => {
    expect(() => validateImportData(JSON.stringify({ books: 'invalid' }))).toThrow('"books" debe ser un array');
  });

  it('rejects phases as non-array', () => {
    expect(() => validateImportData(JSON.stringify({ phases: {} }))).toThrow('"phases" debe ser un array');
  });

  it('rejects schedule as non-array', () => {
    expect(() => validateImportData(JSON.stringify({ schedule: 42 }))).toThrow('"schedule" debe ser un array');
  });

  it('rejects entries as non-array', () => {
    expect(() => validateImportData(JSON.stringify({ entries: 'nope' }))).toThrow('"entries" debe ser un array');
  });

  it('rejects completedWeeks as non-array', () => {
    expect(() => validateImportData(JSON.stringify({ completedWeeks: {} }))).toThrow('"completedWeeks" debe ser un array');
  });

  it('rejects book without title', () => {
    expect(() => validateImportData(JSON.stringify({ books: [{ id: 1 }] }))).toThrow('campo "title"');
  });

  it('rejects book with non-string title', () => {
    expect(() => validateImportData(JSON.stringify({ books: [{ title: 123 }] }))).toThrow('campo "title"');
  });

  it('rejects entry without id', () => {
    expect(() => validateImportData(JSON.stringify({ entries: [{ book: 'X' }] }))).toThrow('campo "id"');
  });

  it('rejects entry without book', () => {
    expect(() => validateImportData(JSON.stringify({ entries: [{ id: 1 }] }))).toThrow('campo "book"');
  });

  it('rejects entry with non-string book', () => {
    expect(() => validateImportData(JSON.stringify({ entries: [{ id: 1, book: 123 }] }))).toThrow('campo "book"');
  });

  // readingTime validation
  it('accepts entry with valid integer readingTime', () => {
    const data = { entries: [{ id: '1', book: 'X', readingTime: 30 }] };
    expect(() => validateImportData(JSON.stringify(data))).not.toThrow();
  });

  it('accepts entry without readingTime field', () => {
    const data = { entries: [{ id: '1', book: 'X' }] };
    expect(() => validateImportData(JSON.stringify(data))).not.toThrow();
  });

  it('accepts entry with readingTime = 0', () => {
    const data = { entries: [{ id: '1', book: 'X', readingTime: 0 }] };
    expect(() => validateImportData(JSON.stringify(data))).not.toThrow();
  });

  it('rejects entry with readingTime as string', () => {
    const data = { entries: [{ id: '1', book: 'X', readingTime: '30' }] };
    expect(() => validateImportData(JSON.stringify(data))).toThrow('"readingTime" debe ser un número');
  });

  it('rejects entry with readingTime as Infinity', () => {
    // JSON.stringify drops Infinity to null — simulate the real edge case via object literal
    const data = { entries: [{ id: '1', book: 'X', readingTime: null }] };
    // null is not a number → typeof null is 'object', so it should throw
    expect(() => validateImportData(JSON.stringify(data))).toThrow('"readingTime" debe ser un número');
  });

  it('rejects entry with readingTime as boolean', () => {
    const data = { entries: [{ id: '1', book: 'X', readingTime: true }] };
    expect(() => validateImportData(JSON.stringify(data))).toThrow('"readingTime" debe ser un número');
  });
});

describe('readingTime normalization', () => {
  it('rounds float to nearest integer', () => {
    const result = normalizeEntries([{ id: '1', book: 'X', readingTime: 30.7 }]);
    expect(result[0].readingTime).toBe(31);
  });

  it('clamps negative to 0', () => {
    const result = normalizeEntries([{ id: '1', book: 'X', readingTime: -10 }]);
    expect(result[0].readingTime).toBe(0);
  });

  it('defaults absent readingTime to 0', () => {
    const result = normalizeEntries([{ id: '1', book: 'X' }]);
    expect(result[0].readingTime).toBe(0);
  });

  it('leaves valid integer unchanged', () => {
    const result = normalizeEntries([{ id: '1', book: 'X', readingTime: 45 }]);
    expect(result[0].readingTime).toBe(45);
  });

  it('normalizes multiple entries independently', () => {
    const result = normalizeEntries([
      { id: '1', book: 'X', readingTime: 20 },
      { id: '2', book: 'X', readingTime: -5 },
      { id: '3', book: 'X' },
    ]);
    expect(result.map(e => e.readingTime)).toEqual([20, 0, 0]);
  });

  it('preserves other entry fields unchanged', () => {
    const result = normalizeEntries([{ id: '1', book: 'X', date: '2026-01-01', readingTime: 10 }]);
    expect(result[0].id).toBe('1');
    expect(result[0].book).toBe('X');
    expect(result[0].date).toBe('2026-01-01');
  });
});
