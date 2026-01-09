// src/lib/idbFiles.ts
export type StoredFileMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
};

const DB_NAME = "pegadaian_dashboard_db";
const STORE = "files";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function delBlob(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function persistFile(file: File): Promise<StoredFileMeta> {
  const id = crypto.randomUUID();
  await putBlob(id, file);
  return {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  };
}

export async function metaToObjectUrl(meta: StoredFileMeta): Promise<string | null> {
  const blob = await getBlob(meta.id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
