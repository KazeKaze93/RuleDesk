import {
  APPEARANCE_BACKGROUND_KEY,
  APPEARANCE_BACKGROUND_MAX_BYTES,
  APPEARANCE_BACKGROUND_TOO_LARGE,
} from "../config/constants";
import { log } from "../log";

const BACKGROUND_DB_NAME = "ruledesk-web.background";
const BACKGROUND_DB_VERSION = 1;
const BACKGROUND_STORE_NAME = "background";
/** Single record key inside the object store. */
const BACKGROUND_RECORD_KEY = "dataUrl";

type GmGetValue = (key: string, defaultValue?: unknown) => unknown;
type GmSetValue = (key: string, value: unknown) => void;

function getGmGetValue(): GmGetValue {
  return GM_getValue;
}

function getGmSetValue(): GmSetValue {
  return GM_setValue;
}

function byteLengthUtf8(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length;
}

function readGmBackground(): string | null {
  try {
    const raw = getGmGetValue()(APPEARANCE_BACKGROUND_KEY, undefined);
    if (typeof raw !== "string" || raw.length === 0) {
      return null;
    }
    return raw;
  } catch (error) {
    log.error("background-store: GM read failed", error);
    return null;
  }
}

function clearGmBackground(): void {
  try {
    getGmSetValue()(APPEARANCE_BACKGROUND_KEY, "");
  } catch (error) {
    log.error("background-store: GM clear failed", error);
  }
}

function openBackgroundDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKGROUND_DB_NAME, BACKGROUND_DB_VERSION);
    request.onerror = () => {
      reject(request.error ?? new Error("background-store: indexedDB open failed"));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BACKGROUND_STORE_NAME)) {
        db.createObjectStore(BACKGROUND_STORE_NAME);
      }
    };
  });
}

function idbGet(db: IDBDatabase): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_STORE_NAME, "readonly");
    const store = tx.objectStore(BACKGROUND_STORE_NAME);
    const request = store.get(BACKGROUND_RECORD_KEY);
    request.onerror = () => {
      reject(request.error ?? new Error("background-store: get failed"));
    };
    request.onsuccess = () => {
      const value: unknown = request.result;
      if (typeof value === "string" && value.length > 0) {
        resolve(value);
        return;
      }
      resolve(null);
    };
  });
}

function idbPut(db: IDBDatabase, dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_STORE_NAME, "readwrite");
    const store = tx.objectStore(BACKGROUND_STORE_NAME);
    const request = store.put(dataUrl, BACKGROUND_RECORD_KEY);
    request.onerror = () => {
      reject(request.error ?? new Error("background-store: put failed"));
    };
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error("background-store: put transaction failed"));
    };
  });
}

function idbDelete(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_STORE_NAME, "readwrite");
    const store = tx.objectStore(BACKGROUND_STORE_NAME);
    const request = store.delete(BACKGROUND_RECORD_KEY);
    request.onerror = () => {
      reject(request.error ?? new Error("background-store: delete failed"));
    };
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error("background-store: delete transaction failed"));
    };
  });
}

/**
 * If the legacy GM background key still holds a value and IDB is empty,
 * copy it into IDB and clear the GM key.
 */
async function migrateGmToIdb(db: IDBDatabase): Promise<string | null> {
  const existing = await idbGet(db);
  if (existing !== null) {
    clearGmBackground();
    return existing;
  }
  const fromGm = readGmBackground();
  if (fromGm === null) {
    return null;
  }
  await idbPut(db, fromGm);
  clearGmBackground();
  return fromGm;
}

/** Loads the background data URL from IndexedDB (migrating from GM once if needed). */
export async function loadBackground(): Promise<string | null> {
  try {
    const db = await openBackgroundDb();
    try {
      return await migrateGmToIdb(db);
    } finally {
      db.close();
    }
  } catch (error) {
    log.error("background-store: load failed", error);
    return null;
  }
}

/** True for a picture too large to be kept as the background. */
export function backgroundTooLarge(dataUrl: string): boolean {
  return byteLengthUtf8(dataUrl) > APPEARANCE_BACKGROUND_MAX_BYTES;
}

/** Stores a background image data URL in IndexedDB (clears any leftover GM value). */
export async function saveBackground(dataUrl: string): Promise<void> {
  if (backgroundTooLarge(dataUrl)) {
    throw new Error(APPEARANCE_BACKGROUND_TOO_LARGE);
  }
  const db = await openBackgroundDb();
  try {
    await idbPut(db, dataUrl);
    clearGmBackground();
  } finally {
    db.close();
  }
}

/** Removes the background from IndexedDB and clears any leftover GM value. */
export async function clearBackground(): Promise<void> {
  try {
    const db = await openBackgroundDb();
    try {
      await idbDelete(db);
    } finally {
      db.close();
    }
  } catch (error) {
    log.error("background-store: clear idb failed", error);
  }
  clearGmBackground();
}
