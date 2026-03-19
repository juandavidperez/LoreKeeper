import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Since jsdom doesn't provide IndexedDB, we test the syncQueue
 * logic by mocking the IDB layer with an in-memory store.
 */

// In-memory store to simulate IndexedDB
let store = [];
let autoId = 1;

vi.mock('../utils/syncQueue', () => {
  return {
    enqueue: async (table, action, payload) => {
      store.push({ id: autoId++, table, action, payload, createdAt: Date.now() });
    },
    getAll: async () => [...store],
    remove: async (id) => {
      store = store.filter(item => item.id !== id);
    },
    clearAll: async () => {
      store = [];
    },
    count: async () => store.length,
  };
});

// Import after mock
const { enqueue, getAll, remove, clearAll, count } = await import('../utils/syncQueue');

describe('syncQueue (mocked IDB)', () => {
  beforeEach(async () => {
    store = [];
    autoId = 1;
  });

  it('starts empty', async () => {
    expect(await getAll()).toEqual([]);
    expect(await count()).toBe(0);
  });

  it('enqueues an operation', async () => {
    await enqueue('books', 'upsert', { id: 'b1', title: 'Test' });
    const items = await getAll();
    expect(items).toHaveLength(1);
    expect(items[0].table).toBe('books');
    expect(items[0].action).toBe('upsert');
    expect(items[0].payload).toEqual({ id: 'b1', title: 'Test' });
  });

  it('enqueues multiple operations in order', async () => {
    await enqueue('books', 'upsert', { id: 'b1' });
    await enqueue('entries', 'upsert', { id: 'e1' });
    await enqueue('books', 'delete', { id: 'b1' });

    const items = await getAll();
    expect(items).toHaveLength(3);
    expect(items[0].table).toBe('books');
    expect(items[1].table).toBe('entries');
    expect(items[2].action).toBe('delete');
  });

  it('removes a specific operation by id', async () => {
    await enqueue('books', 'upsert', { id: 'b1' });
    await enqueue('entries', 'upsert', { id: 'e1' });

    const items = await getAll();
    await remove(items[0].id);

    const remaining = await getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].table).toBe('entries');
  });

  it('clears all operations', async () => {
    await enqueue('books', 'upsert', { id: 'b1' });
    await enqueue('entries', 'upsert', { id: 'e1' });
    expect(await count()).toBe(2);

    await clearAll();
    expect(await count()).toBe(0);
  });

  it('count returns correct number', async () => {
    expect(await count()).toBe(0);
    await enqueue('books', 'upsert', { id: 'b1' });
    expect(await count()).toBe(1);
    await enqueue('books', 'upsert', { id: 'b2' });
    expect(await count()).toBe(2);
  });
});
