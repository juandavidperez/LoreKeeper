import { supabase } from '../lib/supabase';
import * as syncQueue from './syncQueue';

/**
 * Maps localStorage keys to Supabase table names and their
 * local → remote field transformations.
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
      mood: item.mood || null,
      reingreso: item.reingreso || null,
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
      mood: row.mood,
      reingreso: row.reingreso,
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
    toRow: (week, userId) => ({
      week,
      user_id: userId,
    }),
    toLocal: (row) => row.week,
  },
};

/**
 * Process the sync queue: push pending local changes to Supabase.
 * Removes each operation from the queue on success.
 */
export async function pushQueue(userId) {
  if (!supabase || !userId) return { pushed: 0, errors: [] };

  const ops = await syncQueue.getAll();
  let pushed = 0;
  const errors = [];

  for (const op of ops) {
    try {
      if (op.action === 'upsert') {
        const { error } = await supabase
          .from(op.table)
          .upsert(op.payload, { onConflict: getConflictKey(op.table) });
        if (error) throw error;
      } else if (op.action === 'delete') {
        let query = supabase.from(op.table).delete();
        for (const [key, val] of Object.entries(op.payload)) {
          query = query.eq(key, val);
        }
        const { error } = await query;
        if (error) throw error;
      }
      await syncQueue.remove(op.id);
      pushed++;
    } catch (err) {
      errors.push({ op, error: err.message || err });
    }
  }

  return { pushed, errors };
}

function getConflictKey(table) {
  const keys = {
    books: 'user_id,id',
    phases: 'user_id,id',
    schedule: 'user_id,week',
    entries: 'user_id,id',
    completed_weeks: 'user_id,week',
    oracle_replies: 'user_id,entity_name',
  };
  return keys[table] || 'id';
}

/**
 * Pull remote data and merge into localStorage using LWW (last-write-wins).
 * Returns the merged data keyed by localStorage key.
 */
export async function pullRemote(userId, lastSyncedAt) {
  if (!supabase || !userId) return null;

  const results = {};

  for (const [localKey, config] of Object.entries(TABLE_MAP)) {
    let query = supabase
      .from(config.table)
      .select('*')
      .eq('user_id', userId);

    // Only pull changes since last sync if available
    if (lastSyncedAt) {
      query = query.gte('updated_at', lastSyncedAt);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Pull error for ${config.table}:`, error);
      continue;
    }

    if (data && data.length > 0) {
      results[localKey] = {
        rows: data,
        toLocal: config.toLocal,
      };
    }
  }

  return results;
}

/**
 * Merge remote rows into local data.
 * For array-based state (books, entries, etc.): LWW by updated_at.
 * For completed-weeks: union of sets.
 */
export function mergeData(localKey, localData, remoteRows, toLocal) {
  if (localKey === 'completed-weeks') {
    // Union of local and remote weeks
    const remoteWeeks = remoteRows.map(toLocal);
    return [...new Set([...localData, ...remoteWeeks])].sort((a, b) => a - b);
  }

  // For array-based data: merge by id/primary key
  const idField = localKey === 'lore-schedule' ? 'week' : 'id';
  const localMap = new Map(localData.map(item => [
    typeof item === 'object' ? item[idField] : item,
    item,
  ]));

  for (const row of remoteRows) {
    const localItem = toLocal(row);
    const key = typeof localItem === 'object' ? localItem[idField] : localItem;
    const existing = localMap.get(key);

    if (!existing) {
      // New from remote
      localMap.set(key, localItem);
    } else {
      // LWW: remote updated_at vs local (local has no timestamp, so remote wins
      // if we pulled it — it means it was changed on another device)
      localMap.set(key, localItem);
    }
  }

  return Array.from(localMap.values());
}

/**
 * Full push of all localStorage data to Supabase (used for first-time migration).
 */
export async function pushAll(userId, data) {
  if (!supabase || !userId) return;

  const promises = [];

  for (const [localKey, config] of Object.entries(TABLE_MAP)) {
    const items = data[localKey];
    if (!items || (Array.isArray(items) && items.length === 0)) continue;

    if (localKey === 'completed-weeks') {
      const rows = items.map(week => config.toRow(week, userId));
      if (rows.length > 0) {
        promises.push(
          supabase.from(config.table).upsert(rows, { onConflict: getConflictKey(config.table) })
        );
      }
    } else {
      const rows = items.map(item => config.toRow(item, userId));
      if (rows.length > 0) {
        promises.push(
          supabase.from(config.table).upsert(rows, { onConflict: getConflictKey(config.table) })
        );
      }
    }
  }

  const results = await Promise.allSettled(promises);
  const errors = results
    .filter(r => r.status === 'rejected' || r.value?.error)
    .map(r => r.reason || r.value?.error);

  if (errors.length > 0) {
    console.error('Push all errors:', errors);
  }

  return { errors };
}

/**
 * Enqueue a state change for background sync.
 */
export async function enqueueChange(localKey, action, items, userId) {
  if (!supabase || !userId) return;

  const config = TABLE_MAP[localKey];
  if (!config) return;

  if (action === 'upsert') {
    const rows = Array.isArray(items)
      ? items.map(item =>
          localKey === 'completed-weeks'
            ? config.toRow(item, userId)
            : config.toRow(item, userId)
        )
      : [config.toRow(items, userId)];

    for (const row of rows) {
      await syncQueue.enqueue(config.table, 'upsert', row);
    }
  } else if (action === 'delete') {
    const payload = typeof items === 'object' ? items : { user_id: userId, ...items };
    await syncQueue.enqueue(config.table, 'delete', payload);
  }
}

/** Update sync log timestamp */
export async function updateSyncLog(userId, deviceId) {
  if (!supabase || !userId) return;
  const tables = Object.values(TABLE_MAP).map(c => c.table);
  for (const table of tables) {
    await supabase.from('sync_log').upsert({
      user_id: userId,
      device_id: deviceId,
      table_name: table,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id,device_id,table_name' });
  }
}

/** Get last sync timestamp for this device */
export async function getLastSyncTime(userId, deviceId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase
    .from('sync_log')
    .select('last_synced_at')
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .order('last_synced_at', { ascending: true })
    .limit(1);
  return data?.[0]?.last_synced_at || null;
}
