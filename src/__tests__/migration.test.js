import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing migration
vi.mock('../lib/supabase', () => ({
  supabase: null, // Will be overridden per-test
}));

// Mock syncEngine.pushAll
vi.mock('../utils/syncEngine', () => ({
  pushAll: vi.fn(),
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
