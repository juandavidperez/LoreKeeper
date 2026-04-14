import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: null,
}));

// Mock syncEngine.backupToSupabase
vi.mock('../utils/syncEngine', () => ({
  backupToSupabase: vi.fn().mockResolvedValue({ success: false, error: 'No Supabase' }),
}));

describe('migration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('returns error when supabase is null', async () => {
    const { migrateLocalToSupabase } = await import('../utils/migration');
    const result = await migrateLocalToSupabase('user-123');
    expect(result.success).toBe(false);
  });

  it('returns error when userId is null', async () => {
    const { migrateLocalToSupabase } = await import('../utils/migration');
    const result = await migrateLocalToSupabase(null);
    expect(result.success).toBe(false);
  });
});
