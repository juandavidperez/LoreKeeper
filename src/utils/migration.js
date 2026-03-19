import { pushAll } from './syncEngine';
import { supabase } from '../lib/supabase';

/**
 * One-time migration of localStorage data to Supabase.
 * Called on first sign-in when no remote data exists.
 */
export async function migrateLocalToSupabase(userId) {
  if (!supabase || !userId) return { success: false, error: 'No Supabase' };

  try {
    const data = {
      'lore-books': safeParseArray('lore-books'),
      'lore-phases': safeParseArray('lore-phases'),
      'lore-schedule': safeParseArray('lore-schedule'),
      'reading-entries': safeParseArray('reading-entries'),
      'completed-weeks': safeParseArray('completed-weeks'),
    };

    // Also migrate oracle replies
    const oracleReplies = safeParseObject('oracle-replies');
    if (oracleReplies && Object.keys(oracleReplies).length > 0) {
      const rows = Object.entries(oracleReplies).map(([name, reply]) => ({
        entity_name: name,
        user_id: userId,
        reply,
      }));
      await supabase
        .from('oracle_replies')
        .upsert(rows, { onConflict: 'user_id,entity_name' });
    }

    const { errors } = await pushAll(userId, data);

    if (errors && errors.length > 0) {
      console.error('Migration errors:', errors);
      return { success: false, error: 'Algunos datos no se migraron' };
    }

    // Mark migration as done
    localStorage.setItem('lore-migration-done', 'true');
    return { success: true };
  } catch (err) {
    console.error('Migration failed:', err);
    return { success: false, error: err.message };
  }
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

function safeParseObject(key) {
  try {
    const val = localStorage.getItem(key);
    if (!val) return {};
    return JSON.parse(val);
  } catch {
    return {};
  }
}
