// src/lib/dashboardSession.ts
export type VehiclePayload = {
  brandModel?: string;
  year?: string;
  physicalCondition?: string;
  defects: string[];
};

export type StoredFileMeta = {
  id: string;          // key di IndexedDB
  name: string;
  type: string;        // mime
  size: number;
  lastModified: number;
};

export type DocumentState = {
  // bebas kamu sesuaikan sesuai DocumentCard kamu
  extracted?: unknown;
            // hasil OCR/scan
  files?: StoredFileMeta[];      // meta file yang disimpan di IDB
};

export type DashboardSession = {
  scanDone: boolean;
  vehicle: VehiclePayload | null;
  vehicleImages?: StoredFileMeta[]; // foto kendaraan (meta)
  document?: DocumentState | null;
  updatedAt: number;
};

const LS_KEY = "pegadaian.dashboard.session.v1";

/** ---------- LocalStorage (data kecil) ---------- */
export function loadDashboardSession(): DashboardSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardSession;
  } catch {
    return null;
  }
}

export function saveDashboardSession(partial: Partial<DashboardSession>) {
  if (typeof window === "undefined") return;
  const current = loadDashboardSession() ?? {
    scanDone: false,
    vehicle: null,
    vehicleImages: [],
    document: null,
    updatedAt: Date.now(),
  };

  const next: DashboardSession = {
    ...current,
    ...partial,
    updatedAt: Date.now(),
  };

  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

export function clearDashboardSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_KEY);
  // bersihin juga IndexedDB supaya file ga nyangkut
  void idbClearAll();
}

/** ---------- IndexedDB (blob / file besar) ---------- */
const DB_NAME = "pegadaian_dashboard_db";
const STORE = "files";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPutBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function idbGetBlob(id: string): Promise<Blob | null> {
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

export async function idbDelete(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function idbClearAll(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** helper: bikin meta + simpan file ke IDB */
export async function persistFile(file: File): Promise<StoredFileMeta> {
  const id = crypto.randomUUID();
  await idbPutBlob(id, file);
  return {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  };
}

/** helper: ambil meta -> bikin objectURL untuk preview */
export async function metaToObjectUrl(meta: StoredFileMeta): Promise<string | null> {
  const blob = await idbGetBlob(meta.id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
