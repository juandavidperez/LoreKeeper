import { backupToSupabase } from './syncEngine';

/**
 * One-time backup of localStorage data to Supabase on first sign-in.
 * Reads directly from localStorage so it can run before React state is available.
 */
export async function migrateLocalToSupabase(userId) {
  const localData = {
    'lore-books': safeParseArray('lore-books'),
    'lore-phases': safeParseArray('lore-phases'),
    'lore-schedule': safeParseArray('lore-schedule'),
    'reading-entries': safeParseArray('reading-entries'),
    'completed-weeks': safeParseArray('completed-weeks'),
  };

  return backupToSupabase(userId, localData);
}

function safeParseArray(key) {
  try {
    const val = localStorage.getItem(key);
    if (!val) return [];
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
