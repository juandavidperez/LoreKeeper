import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('returns initialValue when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('reads complex objects from localStorage', () => {
    const obj = { name: 'test', items: [1, 2, 3] };
    localStorage.setItem('test-key', JSON.stringify(obj));
    const { result } = renderHook(() => useLocalStorage('test-key', {}));
    expect(result.current[0]).toEqual(obj);
  });

  it('writes value to localStorage on setValue', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    act(() => { result.current[1]('updated'); });
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe('updated');
  });

  it('supports updater function', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10));
    act(() => { result.current[1](prev => prev + 5); });
    expect(result.current[0]).toBe(15);
  });

  it('returns initialValue for corrupted JSON', () => {
    localStorage.setItem('test-key', '{broken json');
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  // validateShape tests
  it('returns initialValue when lore-books is not an array', () => {
    localStorage.setItem('lore-books', JSON.stringify('not-array'));
    const { result } = renderHook(() => useLocalStorage('lore-books', []));
    expect(result.current[0]).toEqual([]);
  });

  it('returns initialValue when lore-books has items without title', () => {
    localStorage.setItem('lore-books', JSON.stringify([{ id: 1 }]));
    const { result } = renderHook(() => useLocalStorage('lore-books', []));
    expect(result.current[0]).toEqual([]);
  });

  it('accepts valid lore-books', () => {
    const books = [{ id: 1, title: 'Test Book' }];
    localStorage.setItem('lore-books', JSON.stringify(books));
    const { result } = renderHook(() => useLocalStorage('lore-books', []));
    expect(result.current[0]).toEqual(books);
  });

  it('returns initialValue when reading-entries has items without id', () => {
    localStorage.setItem('reading-entries', JSON.stringify([{ book: 'X' }]));
    const { result } = renderHook(() => useLocalStorage('reading-entries', []));
    expect(result.current[0]).toEqual([]);
  });

  it('returns initialValue when reading-entries has items without book', () => {
    localStorage.setItem('reading-entries', JSON.stringify([{ id: 1 }]));
    const { result } = renderHook(() => useLocalStorage('reading-entries', []));
    expect(result.current[0]).toEqual([]);
  });

  it('accepts valid reading-entries', () => {
    const entries = [{ id: 1, book: 'Hobbit' }];
    localStorage.setItem('reading-entries', JSON.stringify(entries));
    const { result } = renderHook(() => useLocalStorage('reading-entries', []));
    expect(result.current[0]).toEqual(entries);
  });

  // Quota handling
  it('dispatches event on QuotaExceededError', () => {
    const handler = vi.fn();
    window.addEventListener('lore-storage-error', handler);

    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'test-key') {
        const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
        throw err;
      }
      return originalSetItem.call(this, key, value);
    };

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    act(() => { result.current[1]('big-data'); });

    // State should still update even though storage failed
    expect(result.current[0]).toBe('big-data');
    expect(handler).toHaveBeenCalledTimes(1);

    Storage.prototype.setItem = originalSetItem;
    window.removeEventListener('lore-storage-error', handler);
  });

  // Non-validated keys pass through
  it('accepts any shape for non-validated keys', () => {
    localStorage.setItem('lore-theme', JSON.stringify('dark'));
    const { result } = renderHook(() => useLocalStorage('lore-theme', 'light'));
    expect(result.current[0]).toBe('dark');
  });
});
