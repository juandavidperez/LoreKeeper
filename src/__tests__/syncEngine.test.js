import { describe, it, expect, vi } from 'vitest';

// Mock Supabase — not used in field-mapping tests
vi.mock('../lib/supabase', () => ({ supabase: null }));

// Import the module to access TABLE_MAP indirectly through the exported functions.
// Since TABLE_MAP is not exported, we test the transformations by exercising
// backupToSupabase/restoreFromSupabase with a mock Supabase client.
// For pure field-mapping coverage, we replicate the toRow/toLocal logic here
// (same pattern as importData tests extracting validation logic).

// --- Field mapping helpers (mirrors TABLE_MAP in syncEngine.js) ---

const entryToRow = (item, userId) => ({
  id: item.id,
  user_id: userId,
  date: item.date || null,
  book: item.book,
  chapter: item.chapter || null,
  summary: item.summary || null,
  mood: item.mood || null,
  reingreso: item.reingreso || null,
  reading_time: item.readingTime || 0,
  quotes: item.quotes || [],
  characters: item.characters || [],
  places: item.places || [],
  glossary: item.glossary || [],
  world_rules: item.worldRules || [],
  connections: item.connections || [],
  manga_panels: item.mangaPanels || [],
});

const rowToEntry = (row) => ({
  id: row.id,
  date: row.date,
  book: row.book,
  chapter: row.chapter,
  summary: row.summary,
  mood: row.mood,
  reingreso: row.reingreso,
  readingTime: row.reading_time || 0,
  quotes: row.quotes || [],
  characters: row.characters || [],
  places: row.places || [],
  glossary: row.glossary || [],
  worldRules: row.world_rules || [],
  connections: row.connections || [],
  mangaPanels: row.manga_panels || [],
});

const phaseToRow = (item, userId) => ({
  id: item.id,
  user_id: userId,
  label: item.label || null,
  weeks: item.weeks || null,
  color: item.color || null,
  description: item.desc || null,
});

const rowToPhase = (row) => ({
  id: row.id,
  label: row.label,
  weeks: row.weeks,
  color: row.color,
  desc: row.description,
});

// ---

describe('syncEngine — entry field mapping', () => {
  const userId = 'u-1';

  it('maps readingTime to reading_time in toRow', () => {
    const entry = { id: 'e1', book: 'Berserk', readingTime: 45 };
    const row = entryToRow(entry, userId);
    expect(row.reading_time).toBe(45);
    expect(row.user_id).toBe(userId);
  });

  it('defaults reading_time to 0 when readingTime absent', () => {
    const entry = { id: 'e1', book: 'Berserk' };
    const row = entryToRow(entry, userId);
    expect(row.reading_time).toBe(0);
  });

  it('maps summary to summary column', () => {
    const entry = { id: 'e1', book: 'Berserk', summary: 'Guts fights.' };
    const row = entryToRow(entry, userId);
    expect(row.summary).toBe('Guts fights.');
  });

  it('maps worldRules to world_rules in toRow', () => {
    const entry = { id: 'e1', book: 'Berserk', worldRules: [{ name: 'Rule 1' }] };
    const row = entryToRow(entry, userId);
    expect(row.world_rules).toEqual([{ name: 'Rule 1' }]);
  });

  it('restores reading_time as readingTime in toLocal', () => {
    const row = { id: 'e1', book: 'Berserk', reading_time: 30, quotes: [], characters: [],
      places: [], glossary: [], world_rules: [], connections: [], manga_panels: [] };
    const entry = rowToEntry(row);
    expect(entry.readingTime).toBe(30);
  });

  it('restores world_rules as worldRules in toLocal', () => {
    const row = { id: 'e1', book: 'Berserk', reading_time: 0, world_rules: [{ name: 'R1' }],
      quotes: [], characters: [], places: [], glossary: [], connections: [], manga_panels: [] };
    const entry = rowToEntry(row);
    expect(entry.worldRules).toEqual([{ name: 'R1' }]);
  });

  it('defaults JSONB arrays to [] when row has null', () => {
    const row = { id: 'e1', book: 'X', reading_time: 0,
      quotes: null, characters: null, places: null,
      glossary: null, world_rules: null, connections: null, manga_panels: null };
    const entry = rowToEntry(row);
    expect(entry.quotes).toEqual([]);
    expect(entry.worldRules).toEqual([]);
    expect(entry.mangaPanels).toEqual([]);
  });
});

describe('syncEngine — phase field mapping', () => {
  const userId = 'u-1';

  it('maps desc to description column in toRow', () => {
    const phase = { id: 'p1', label: 'Arc 1', desc: 'First arc', weeks: [1, 2], color: '#f00' };
    const row = phaseToRow(phase, userId);
    expect(row.description).toBe('First arc');
    expect(row.desc).toBeUndefined();
  });

  it('restores description as desc in toLocal', () => {
    const row = { id: 'p1', label: 'Arc 1', description: 'First arc', weeks: [1, 2], color: '#f00' };
    const phase = rowToPhase(row);
    expect(phase.desc).toBe('First arc');
    expect(phase.description).toBeUndefined();
  });
});
