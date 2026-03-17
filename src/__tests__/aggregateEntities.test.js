import { describe, it, expect } from 'vitest';

// Extract aggregateEntities for testing — it's not exported, so we replicate it
// (same logic as useLorekeeperState.js lines 12-30)
function aggregateEntities(entries, field, type) {
  const data = {};
  entries.forEach(entry => {
    entry[field]?.forEach(item => {
      if (!data[item.name]) {
        data[item.name] = { name: item.name, type, book: entry.book, tags: item.tags || [], mentions: [] };
      }
      const mentionKey = `${entry.date}|${entry.book}|${item.content}`;
      const isDuplicate = data[item.name].mentions.some(
        m => `${m.date}|${m.book}|${m.text}` === mentionKey
      );
      if (!isDuplicate) {
        data[item.name].mentions.push({ date: entry.date, text: item.content, book: entry.book });
      }
      data[item.name].tags = [...new Set([...data[item.name].tags, ...(item.tags || [])])];
    });
  });
  return Object.values(data);
}

describe('aggregateEntities', () => {
  it('returns empty array for empty entries', () => {
    expect(aggregateEntities([], 'characters', 'personaje')).toEqual([]);
  });

  it('aggregates characters from a single entry', () => {
    const entries = [{
      date: '2025-01-01', book: 'El Hobbit',
      characters: [{ name: 'Bilbo', tags: ['hobbit'], content: 'Sale de casa' }]
    }];
    const result = aggregateEntities(entries, 'characters', 'personaje');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bilbo');
    expect(result[0].type).toBe('personaje');
    expect(result[0].book).toBe('El Hobbit');
    expect(result[0].tags).toEqual(['hobbit']);
    expect(result[0].mentions).toHaveLength(1);
    expect(result[0].mentions[0].text).toBe('Sale de casa');
  });

  it('aggregates same character across multiple entries', () => {
    const entries = [
      { date: '2025-01-01', book: 'El Hobbit', characters: [{ name: 'Gandalf', tags: ['mago'], content: 'Aparece' }] },
      { date: '2025-01-02', book: 'El Hobbit', characters: [{ name: 'Gandalf', tags: ['sabio'], content: 'Lucha' }] },
    ];
    const result = aggregateEntities(entries, 'characters', 'personaje');
    expect(result).toHaveLength(1);
    expect(result[0].mentions).toHaveLength(2);
    expect(result[0].tags).toContain('mago');
    expect(result[0].tags).toContain('sabio');
  });

  it('deduplicates identical mentions', () => {
    const entries = [
      { date: '2025-01-01', book: 'El Hobbit', characters: [{ name: 'Bilbo', tags: [], content: 'Sale' }] },
      { date: '2025-01-01', book: 'El Hobbit', characters: [{ name: 'Bilbo', tags: [], content: 'Sale' }] },
    ];
    const result = aggregateEntities(entries, 'characters', 'personaje');
    expect(result[0].mentions).toHaveLength(1);
  });

  it('keeps different mentions with different dates', () => {
    const entries = [
      { date: '2025-01-01', book: 'El Hobbit', characters: [{ name: 'Bilbo', tags: [], content: 'Sale' }] },
      { date: '2025-01-02', book: 'El Hobbit', characters: [{ name: 'Bilbo', tags: [], content: 'Sale' }] },
    ];
    const result = aggregateEntities(entries, 'characters', 'personaje');
    expect(result[0].mentions).toHaveLength(2);
  });

  it('handles entries without the field', () => {
    const entries = [
      { date: '2025-01-01', book: 'El Hobbit' },
    ];
    expect(aggregateEntities(entries, 'characters', 'personaje')).toEqual([]);
  });

  it('merges tags without duplicates', () => {
    const entries = [
      { date: '2025-01-01', book: 'A', characters: [{ name: 'X', tags: ['a', 'b'], content: '1' }] },
      { date: '2025-01-02', book: 'A', characters: [{ name: 'X', tags: ['b', 'c'], content: '2' }] },
    ];
    const result = aggregateEntities(entries, 'characters', 'personaje');
    expect(result[0].tags).toEqual(['a', 'b', 'c']);
  });

  it('handles items with no tags', () => {
    const entries = [
      { date: '2025-01-01', book: 'A', places: [{ name: 'Mordor', content: 'Dark' }] },
    ];
    const result = aggregateEntities(entries, 'places', 'lugar');
    expect(result[0].tags).toEqual([]);
  });

  it('aggregates across different books', () => {
    const entries = [
      { date: '2025-01-01', book: 'Book A', characters: [{ name: 'Hero', tags: [], content: 'In A' }] },
      { date: '2025-01-02', book: 'Book B', characters: [{ name: 'Hero', tags: [], content: 'In B' }] },
    ];
    const result = aggregateEntities(entries, 'characters', 'personaje');
    expect(result).toHaveLength(1);
    expect(result[0].book).toBe('Book A'); // first seen
    expect(result[0].mentions).toHaveLength(2);
    expect(result[0].mentions[1].book).toBe('Book B');
  });
});
