// Simple IndexedDB helper for CRUD
export const DB_NAME = 'dm122-db';
export const DB_VERSION = 1;
export const STORE = 'items';

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function waitTx(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transação abortada'));
  });
}

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_title', 'title', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addItem(data) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const now = Date.now();
  const record = { title: '', details: '', createdAt: now, updatedAt: now, ...data };
  const id = await promisify(store.add(record));
  await waitTx(tx);
  return { ...record, id };
}

export async function getItems() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const req = store.getAll();
  const items = await promisify(req);
  items.sort((a, b) => b.updatedAt - a.updatedAt);
  return items;
}

export async function updateItem(id, data) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const current = await promisify(store.get(id));
  if (!current) throw new Error('Item não encontrado');
  const next = { ...current, ...data, updatedAt: Date.now() };
  await promisify(store.put(next));
  await waitTx(tx);
  return next;
}

export async function deleteItem(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  await promisify(store.delete(id));
  await waitTx(tx);
}
