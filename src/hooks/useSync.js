import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import {
  pushQueue,
  pullRemote,
  mergeData,
  enqueueChange,
  updateSyncLog,
  getLastSyncTime,
} from '../utils/syncEngine';
import { count as queueCount } from '../utils/syncQueue';

const SyncContext = createContext(null);

// Unique device ID persisted in localStorage
function getDeviceId() {
  let id = localStorage.getItem('lore-device-id');
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('lore-device-id', id);
  }
  return id;
}

export function SyncProvider({ children, stateSetters }) {
  const { user, isConfigured } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | syncing | synced | error | offline
  const [pendingCount, setPendingCount] = useState(0);
  const syncInProgress = useRef(false);
  const deviceId = useRef(getDeviceId());

  const canSync = isConfigured && !!user && !!supabase;

  // Update pending count periodically
  useEffect(() => {
    if (!canSync) return;
    const update = async () => {
      const c = await queueCount();
      setPendingCount(c);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [canSync]);

  const sync = useCallback(async () => {
    if (!canSync || syncInProgress.current) return;
    syncInProgress.current = true;
    setStatus('syncing');

    try {
      // 1. Push pending local changes
      const { errors: pushErrors } = await pushQueue(user.id);
      if (pushErrors.length > 0) {
        console.warn('Sync push errors:', pushErrors);
      }

      // 2. Pull remote changes
      const lastSync = await getLastSyncTime(user.id, deviceId.current);
      const remoteData = await pullRemote(user.id, lastSync);

      // 3. Merge into localStorage
      if (remoteData && stateSetters) {
        for (const [localKey, { rows, toLocal }] of Object.entries(remoteData)) {
          const currentLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
          const merged = mergeData(localKey, currentLocal, rows, toLocal);
          // Update localStorage and React state
          localStorage.setItem(localKey, JSON.stringify(merged));
          if (stateSetters[localKey]) {
            stateSetters[localKey](merged);
          }
        }
      }

      // 4. Update sync log
      await updateSyncLog(user.id, deviceId.current);

      const c = await queueCount();
      setPendingCount(c);
      setStatus('synced');
    } catch (err) {
      console.error('Sync error:', err);
      setStatus('error');
    } finally {
      syncInProgress.current = false;
    }
  }, [canSync, user, stateSetters]);

  // Enqueue a change for background sync
  const trackChange = useCallback(async (localKey, action, items) => {
    if (!canSync) return;
    await enqueueChange(localKey, action, items, user.id);
    const c = await queueCount();
    setPendingCount(c);
  }, [canSync, user]);

  // Auto-sync on mount, on coming back online, and on visibility change
  useEffect(() => {
    if (!canSync) return;

    // Initial sync
    sync();

    // Sync when coming back online
    const handleOnline = () => {
      setStatus('idle');
      sync();
    };
    const handleOffline = () => setStatus('offline');

    // Sync when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic sync every 5 minutes
    const interval = setInterval(sync, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [canSync, sync]);

  // Set offline status
  useEffect(() => {
    if (!navigator.onLine) setStatus('offline');
  }, []);

  const value = { status, pendingCount, sync, trackChange, canSync };

  return React.createElement(SyncContext.Provider, { value }, children);
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
