import { useState, useCallback } from 'react';

const QUOTA_WARNING_KEY = 'lore-quota-warned';
const QUOTA_THRESHOLD_KEY = 'lore-quota-threshold-warned';

function estimateUsage() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const val = localStorage.getItem(key);
    total += (key?.length || 0) + (val?.length || 0);
  }
  return total * 2; // UTF-16 = 2 bytes per char
}

function checkQuotaThreshold() {
  if (sessionStorage.getItem(QUOTA_THRESHOLD_KEY)) return;
  try {
    const used = estimateUsage();
    const limit = 5 * 1024 * 1024; // 5MB conservative estimate
    if (used / limit > 0.8) {
      sessionStorage.setItem(QUOTA_THRESHOLD_KEY, '1');
      window.dispatchEvent(new CustomEvent('lore-storage-error', {
        detail: 'El almacenamiento local está al 80% de su capacidad. Exporta tus datos como respaldo.'
      }));
    }
  } catch { /* ignore */ }
}

function notifyQuotaError() {
  // Only warn once per session to avoid spam
  if (sessionStorage.getItem(QUOTA_WARNING_KEY)) return;
  sessionStorage.setItem(QUOTA_WARNING_KEY, '1');

  // Dispatch a custom event that NotificationProvider can pick up
  window.dispatchEvent(new CustomEvent('lore-storage-error', {
    detail: 'El almacenamiento local está lleno. Exporta tus datos como respaldo para no perder información.'
  }));
}

function validateShape(key, value) {
  const arrayKeys = ['lore-books', 'lore-phases', 'lore-schedule', 'reading-entries', 'completed-weeks'];
  if (arrayKeys.includes(key) && !Array.isArray(value)) return false;

  if (key === 'lore-books' && Array.isArray(value)) {
    return value.every(b => b && typeof b.title === 'string');
  }
  if (key === 'reading-entries' && Array.isArray(value)) {
    return value.every(e =>
      e &&
      e.id &&
      typeof e.book === 'string' &&
      (e.readingTime === undefined || (typeof e.readingTime === 'number' && isFinite(e.readingTime) && e.readingTime >= 0))
    );
  }
  return true;
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      const parsed = JSON.parse(item);
      if (!validateShape(key, parsed)) {
        console.warn(`localStorage key "${key}" has invalid shape, using defaults.`);
        return initialValue;
      }
      return parsed;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        checkQuotaThreshold();
      } catch (error) {
        console.error(`localStorage error for key "${key}":`, error);
        if (error?.name === 'QuotaExceededError' || error?.code === 22) {
          notifyQuotaError();
        }
        // Still update React state so the UI stays consistent this session
      }
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}
