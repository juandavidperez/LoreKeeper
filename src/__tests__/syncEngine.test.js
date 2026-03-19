import { describe, it, expect } from 'vitest';
import { mergeData } from '../utils/syncEngine';

describe('syncEngine.mergeData', () => {
  it('merges new remote books into local', () => {
    const local = [{ id: 'b1', title: 'Local Book' }];
    const remoteRows = [
      { id: 'b2', title: 'Remote Book', emoji: '📖', color: '#000', type: 'novel', updated_at: '2026-01-01' },
    ];
    const toLocal = (row) => ({ id: row.id, title: row.title, emoji: row.emoji, color: row.color, type: row.type });

    const result = mergeData('lore-books', local, remoteRows, toLocal);
    expect(result).toHaveLength(2);
    expect(result.find(b => b.id === 'b2').title).toBe('Remote Book');
  });

  it('remote overwrites local with same id (LWW)', () => {
    const local = [{ id: 'b1', title: 'Old Title' }];
    const remoteRows = [
      { id: 'b1', title: 'New Title', emoji: '📕', color: '#fff', type: 'manga', updated_at: '2026-03-01' },
    ];
    const toLocal = (row) => ({ id: row.id, title: row.title, emoji: row.emoji, color: row.color, type: row.type });

    const result = mergeData('lore-books', local, remoteRows, toLocal);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('New Title');
  });

  it('merges completed weeks as union of sets', () => {
    const local = [1, 2, 3];
    const remoteRows = [
      { week: 2, updated_at: '2026-01-01' },
      { week: 4, updated_at: '2026-01-01' },
      { week: 5, updated_at: '2026-01-01' },
    ];
    const toLocal = (row) => row.week;

    const result = mergeData('completed-weeks', local, remoteRows, toLocal);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('merges schedule by week key', () => {
    const local = [
      { week: 1, mangaTitle: 'Local Manga', novelTitle: 'Novel 1' },
    ];
    const remoteRows = [
      { week: 1, manga_title: 'Remote Manga', manga_vols: 'Vol 1', novel_title: 'Novel 1', novel_section: 'Ch 1', tip: null, companion: null, updated_at: '2026-03-01' },
      { week: 2, manga_title: 'Manga 2', manga_vols: 'Vol 2', novel_title: 'Novel 2', novel_section: 'Ch 2', tip: null, companion: null, updated_at: '2026-03-01' },
    ];
    const toLocal = (row) => ({
      week: row.week,
      mangaTitle: row.manga_title,
      mangaVols: row.manga_vols,
      novelTitle: row.novel_title,
      novelSection: row.novel_section,
      tip: row.tip,
      companion: row.companion,
    });

    const result = mergeData('lore-schedule', local, remoteRows, toLocal);
    expect(result).toHaveLength(2);
    expect(result.find(s => s.week === 1).mangaTitle).toBe('Remote Manga');
  });

  it('merges entries with JSONB fields', () => {
    const local = [];
    const remoteRows = [
      {
        id: 'e1', date: '2026-01-01', book: 'Test', chapter: 'Ch1',
        mood: 'happy', reingreso: 'text',
        quotes: ['quote1'], characters: [{ name: 'A' }],
        places: [], glossary: [], world_rules: [], connections: [],
        manga_panels: [], updated_at: '2026-01-01',
      },
    ];
    const toLocal = (row) => ({
      id: row.id, date: row.date, book: row.book, chapter: row.chapter,
      mood: row.mood, reingreso: row.reingreso,
      quotes: row.quotes || [], characters: row.characters || [],
      places: row.places || [], glossary: row.glossary || [],
      worldRules: row.world_rules || [], connections: row.connections || [],
      mangaPanels: row.manga_panels || [],
    });

    const result = mergeData('reading-entries', local, remoteRows, toLocal);
    expect(result).toHaveLength(1);
    expect(result[0].worldRules).toEqual([]);
    expect(result[0].quotes).toEqual(['quote1']);
  });
});
