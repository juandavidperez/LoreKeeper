import { supabase } from '../lib/supabase';

const DB_NAME = 'lorekeeper-images';
const STORE_NAME = 'panels';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null; // allow retry on next call
      reject(request.error);
    };
  });
  return dbPromise;
}

export async function saveImage(key, dataUri) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(dataUri, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadImage(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImages(keys) {
  if (!keys.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    keys.forEach(k => store.delete(k));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Convert inline data URIs to IndexedDB keys, return updated panels array */
export async function externalizePanels(panels) {
  const result = [];
  for (const panel of panels) {
    if (panel.startsWith('data:')) {
      const key = `panel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      await saveImage(key, panel);
      result.push(key);
    } else {
      result.push(panel); // already a key
    }
  }
  return result;
}

/** Load data URIs from IndexedDB for key-based panels */
export async function resolvePanels(panels) {
  const result = [];
  for (const panel of panels) {
    if (panel.startsWith('data:')) {
      result.push(panel); // inline, keep as-is
    } else if (panel.startsWith('supabase:')) {
      // Supabase Storage panel: supabase:{storagePath}
      const url = await getStorageUrl(panel.slice('supabase:'.length));
      if (url) result.push(url);
    } else {
      const uri = await loadImage(panel);
      if (uri) result.push(uri);
    }
  }
  return result;
}

// --- Supabase Storage integration ---

const BUCKET = 'manga-panels';

/**
 * Upload a data URI panel to Supabase Storage.
 * Returns the storage path (to store as `supabase:{path}` in entry).
 */
export async function uploadToStorage(dataUri, userId, entryId, panelKey) {
  if (!supabase || !userId) return null;

  const blob = dataUriToBlob(dataUri);
  const path = `${userId}/${entryId}/${panelKey}.webp`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/webp', upsert: true });

  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }
  return path;
}

/**
 * Get a signed URL for a storage panel (valid 1 hour).
 */
export async function getStorageUrl(path) {
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error) {
    console.error('Storage URL error:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Delete IndexedDB panel keys not referenced by any entry.
 * Call on app mount to reclaim space over time.
 * @param {Array} entries - current reading entries
 * @returns {number} count of deleted orphans
 */
export async function pruneOrphanedPanels(entries) {
  const validKeys = new Set();
  for (const entry of entries) {
    for (const panel of entry.mangaPanels || []) {
      if (!panel.startsWith('data:') && !panel.startsWith('supabase:')) {
        validKeys.add(panel);
      }
    }
  }

  const db = await openDB();
  const allKeys = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const orphans = allKeys.filter(k => !validKeys.has(k));
  if (orphans.length > 0) {
    await deleteImages(orphans);
  }
  return orphans.length;
}

function dataUriToBlob(dataUri) {
  const [header, base64] = dataUri.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
