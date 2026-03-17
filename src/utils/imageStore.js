const DB_NAME = 'lorekeeper-images';
const STORE_NAME = 'panels';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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
    } else {
      const uri = await loadImage(panel);
      if (uri) result.push(uri);
    }
  }
  return result;
}
