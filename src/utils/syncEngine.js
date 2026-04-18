import { supabase } from '../lib/supabase';

/**
 * Maps localStorage keys to Supabase table names and their
 * local ↔ remote field transformations.
 */
const TABLE_MAP = {
  'lore-books': {
    table: 'books',
    toRow: (item, userId) => ({
      id: item.id || crypto.randomUUID(),
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
    toRow: (item, userId, bookIdMap = {}) => ({
      id: item.id || crypto.randomUUID(),
      user_id: userId,
      book_id: bookIdMap[item.book] || null,
      book: item.book || null, // Keeping legacy field for safety
      date: item.date || null,
      content: item.summary || null,
      chapter: item.chapter || null,
      mood: item.mood || null,
      reingreso: item.reingreso || null,
      reading_time: item.readingTime || 0,
      quotes: item.quotes || [],
      glossary: item.glossary || [],
      world_rules: item.worldRules || [],
      connections: item.connections || [],
      manga_panels: item.mangaPanels || [],
    }),
    toLocal: (row) => ({
      id: row.id,
      date: row.date,
      book: row.book,
      book_id: row.book_id,
      chapter: row.chapter,
      summary: row.content,
      mood: row.mood,
      reingreso: row.reingreso,
      readingTime: row.reading_time,
      quotes: row.quotes,
      glossary: row.glossary,
      worldRules: row.world_rules,
      connections: row.connections,
      mangaPanels: row.manga_panels,
    }),
  },
  'lore-entities': {
    table: 'entities',
    toRow: (item, userId, bookIdMap = {}) => ({
      id: item.id || crypto.randomUUID(),
      user_id: userId,
      book_id: item.bookId || bookIdMap[item.bookName] || null,
      name: item.name,
      aliases: item.aliases || [],
      type: item.type,
      archetype: item.archetype || null,
      description: item.description || null,
      image_url: item.imageUrl || null,
      metadata: item.metadata || {},
    }),
    toLocal: (row) => ({
      id: row.id,
      bookId: row.book_id,
      name: row.name,
      aliases: row.aliases,
      type: row.type,
      archetype: row.archetype,
      description: row.description,
      imageUrl: row.image_url,
      metadata: row.metadata,
    }),
  },
  'lore-relations': {
    table: 'relations',
    toRow: (item, userId) => ({
      id: item.id || crypto.randomUUID(),
      user_id: userId,
      source_id: item.sourceId,
      target_id: item.targetId,
      type: item.type,
      weight: item.weight || 1,
      is_directional: item.isDirectional || false,
    }),
    toLocal: (row) => ({
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      type: row.type,
      weight: row.weight,
      isDirectional: row.is_directional,
    }),
  },
  'lore-mentions': {
    table: 'mentions',
    toRow: (item, userId) => ({
      id: item.id || crypto.randomUUID(),
      user_id: userId,
      entry_id: item.entryId,
      entity_id: item.entityId,
    }),
    toLocal: (row) => ({
      id: row.id,
      entryId: row.entry_id,
      entityId: row.entity_id,
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
    books: 'id',
    phases: 'id',
    schedule: 'user_id,week',
    entries: 'id',
    entities: 'user_id,name',
    relations: 'id',
    mentions: 'entry_id,entity_id',
    completed_weeks: 'user_id,week',
  };
  return keys[table] || 'id';
}

import { getCharacterArchetype, getLandmarkType } from './mapImages';

/** ... existing TABLE_MAP ... */

/**
 * Automagically migrates legacy JSON-heavy data to the normalized schema.
 * @param {Object} localData - The current LocalStorage state.
 */
export function migrateLegacyJsonToNormalized(localData) {
  const entries = localData['reading-entries'] || [];
  const books = localData['lore-books'] || [];
  const entityMap = new Map(); // name -> entity object
  const mentions = [];
  const relations = [];

  // 1. Process books to ensure they have UUIDs
  const updatedBooks = books.map(b => ({
    ...b,
    id: b.id || crypto.randomUUID()
  }));

  // 2. Process entries to extract entities
  const updatedEntries = entries.map(entry => {
    const entryId = entry.id || crypto.randomUUID();
    
    // Extract characters, places, etc.
    const rawEntities = [
      ...(entry.characters || []).map(c => ({ ...c, type: 'personaje' })),
      ...(entry.places || []).map(p => ({ ...p, type: 'lugar' })),
      ...(entry.glossary || []).map(g => ({ ...g, type: 'glosario' })),
      ...(entry.worldRules || []).map(r => ({ ...r, type: 'regla' })),
    ];

    rawEntities.forEach(raw => {
      let entity = entityMap.get(raw.name);
      if (!entity) {
        entity = {
          id: crypto.randomUUID(),
          name: raw.name,
          type: raw.type,
          archetype: raw.type === 'personaje' 
            ? getCharacterArchetype(raw.tags || [], raw.name)
            : (raw.type === 'lugar' ? getLandmarkType(raw.name, raw.tags || []) : null),
          aliases: [],
          description: raw.content || '',
          metadata: { tags: raw.tags || [] }
        };
        entityMap.set(raw.name, entity);
      }
      
      mentions.push({
        id: crypto.randomUUID(),
        entryId: entryId,
        entityId: entity.id
      });
    });

    return { ...entry, id: entryId };
  });

  return {
    'reading-entries': updatedEntries,
    'lore-books': updatedBooks,
    'lore-entities': Array.from(entityMap.values()),
    'lore-mentions': mentions,
    'lore-relations': relations, // Relations usually need manual touch or specific parsing
  };
}

/**
 * Backup all local data to Supabase. Full upsert — no merging, local is source of truth.
 */
export async function backupToSupabase(userId, localData) {
  if (!supabase || !userId) return { success: false, error: 'No Supabase' };

  // Generate a map of Book Title -> Book UUID for foreign keys
  const bookIdMap = Object.fromEntries(
    (localData['lore-books'] || []).map(b => [b.title, b.id])
  );

  const promises = Object.entries(TABLE_MAP).map(([key, config]) => {
    const items = localData[key];
    if (!items || items.length === 0) return Promise.resolve({ error: null });
    
    const rows = items.map(item => config.toRow(item, userId, bookIdMap));
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
