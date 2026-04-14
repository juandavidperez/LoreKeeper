import { supabase } from '../lib/supabase';

/**
 * Maps localStorage keys to Supabase table names and their
 * local ↔ remote field transformations.
 */
const TABLE_MAP = {
  'lore-books': {
    table: 'books',
    toRow: (item, userId) => ({
      id: item.id,
      user_id: userId,
      title: item.title,
      emoji: item.emoji || null,
      color: item.color || null,
      type: item.type || null,
    }),
    toLocal: (row) => ({
      id: row.id,
      title: row.title,
      emoji: row.emoji,
      color: row.color,
      type: row.type,
    }),
  },
  'lore-phases': {
    table: 'phases',
    toRow: (item, userId) => ({
      id: item.id,
      user_id: userId,
      label: item.label || null,
      weeks: item.weeks || null,
      color: item.color || null,
      description: item.desc || null,
    }),
    toLocal: (row) => ({
      id: row.id,
      label: row.label,
      weeks: row.weeks,
      color: row.color,
      desc: row.description,
    }),
  },
  'lore-schedule': {
    table: 'schedule',
    toRow: (item, userId) => ({
      week: item.week,
      user_id: userId,
      manga_title: item.mangaTitle || null,
      manga_vols: item.mangaVols || null,
      novel_title: item.novelTitle || null,
      novel_section: item.novelSection || null,
      tip: item.tip || null,
      companion: item.companion || null,
    }),
    toLocal: (row) => ({
      week: row.week,
      mangaTitle: row.manga_title,
      mangaVols: row.manga_vols,
      novelTitle: row.novel_title,
      novelSection: row.novel_section,
      tip: row.tip,
      companion: row.companion,
    }),
  },
  'reading-entries': {
    table: 'entries',
    toRow: (item, userId) => ({
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
    }),
    toLocal: (row) => ({
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
    }),
  },
  'completed-weeks': {
    table: 'completed_weeks',
    toRow: (week, userId) => ({ week, user_id: userId }),
    toLocal: (row) => row.week,
  },
};

function getConflictKey(table) {
  const keys = {
    books: 'user_id,id',
    phases: 'user_id,id',
    schedule: 'user_id,week',
    entries: 'user_id,id',
    completed_weeks: 'user_id,week',
  };
  return keys[table] || 'id';
}

/**
 * Backup all local data to Supabase. Full upsert — no merging, local is source of truth.
 * @param {string} userId
 * @param {Object} localData - { 'lore-books': [...], 'reading-entries': [...], ... }
 */
export async function backupToSupabase(userId, localData) {
  if (!supabase || !userId) return { success: false, error: 'No Supabase' };

  const promises = Object.entries(TABLE_MAP).map(([key, config]) => {
    const items = localData[key];
    if (!items || items.length === 0) return Promise.resolve({ error: null });
    const rows = items.map(item => config.toRow(item, userId));
    return supabase
      .from(config.table)
      .upsert(rows, { onConflict: getConflictKey(config.table) });
  });

  const results = await Promise.allSettled(promises);
  const errors = results
    .filter(r => r.status === 'rejected' || r.value?.error)
    .map(r => r.reason || r.value?.error);

  if (errors.length > 0) {
    console.error('Backup errors:', errors);
    return { success: false, errors };
  }

  return { success: true };
}

/**
 * Restore all data from Supabase. Returns data in local shape, keyed by localStorage key.
 * @param {string} userId
 */
export async function restoreFromSupabase(userId) {
  if (!supabase || !userId) return null;

  const result = {};

  for (const [localKey, config] of Object.entries(TABLE_MAP)) {
    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(`Restore error for ${config.table}:`, error);
      continue;
    }

    result[localKey] = (data || []).map(config.toLocal);
  }

  return result;
}
