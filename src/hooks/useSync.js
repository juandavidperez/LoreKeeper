import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useLorekeeperState } from './useLorekeeperState';
import { backupToSupabase, restoreFromSupabase } from '../utils/syncEngine';

const SyncContext = createContext(null);
const BACKUP_TIMEOUT_MS = 15_000;

function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Backup timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

export function SyncProvider({ children }) {
  const { user, isConfigured } = useAuth();
  const { books, phases, schedule, entries, completedWeeks, stateSetters } = useLorekeeperState();
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error | offline
  const inProgress = useRef(false);

  const canSync = isConfigured && !!user && !!supabase;

  const backup = useCallback(async () => {
    if (!canSync || inProgress.current) return;
    inProgress.current = true;
    setStatus('saving');
    try {
      await withTimeout(
        backupToSupabase(user.id, {
          'lore-books': books,
          'lore-phases': phases,
          'lore-schedule': schedule,
          'reading-entries': entries,
          'completed-weeks': completedWeeks,
        }),
        BACKUP_TIMEOUT_MS
      );
      setStatus('saved');
    } catch (err) {
      console.error('Backup error:', err);
      setStatus('error');
    } finally {
      inProgress.current = false;
    }
  }, [canSync, user, books, phases, schedule, entries, completedWeeks]);

  const restore = useCallback(async () => {
    if (!canSync || inProgress.current) return;
    inProgress.current = true;
    setStatus('saving');
    try {
      const data = await withTimeout(restoreFromSupabase(user.id), BACKUP_TIMEOUT_MS);
      if (data && stateSetters) {
        for (const [key, items] of Object.entries(data)) {
          localStorage.setItem(key, JSON.stringify(items));
          if (stateSetters[key]) stateSetters[key](items);
        }
      }
      setStatus('saved');
    } catch (err) {
      console.error('Restore error:', err);
      setStatus('error');
    } finally {
      inProgress.current = false;
    }
  }, [canSync, user, stateSetters]);

  // Auto-backup when tab becomes hidden (user closes or switches app)
  const backupRef = useRef(backup);
  useEffect(() => { backupRef.current = backup; }, [backup]);

  useEffect(() => {
    if (!canSync) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') backupRef.current();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [canSync]);

  // Offline detection
  useEffect(() => {
    if (!navigator.onLine) setStatus('offline');
    const handleOnline = () => setStatus('idle');
    const handleOffline = () => setStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = { status, backup, restore };

  return React.createElement(SyncContext.Provider, { value }, children);
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
