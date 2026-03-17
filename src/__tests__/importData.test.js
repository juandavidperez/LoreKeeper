import { describe, it, expect } from 'vitest';

// Extract importData validation logic for unit testing
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
    }
  }

  return data;
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
});
