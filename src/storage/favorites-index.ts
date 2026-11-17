import * as z from "zod/mini";

import { log } from "../log";

/**
 * What the Favorites page needs to search and show every favorite without
 * asking the site: the tags and the preview address of each post.
 *
 * "Sync favorites" fills it while it walks the site's favorites pages. It is
 * kept in IndexedDB, apart from the main storage: a library of twelve
 * thousand favorites is several megabytes. It is not part of the Data export;
 * a full resync builds it again.
 */

const DB_NAME = "ruledesk-web.favorites-index";
const DB_VERSION = 1;
const STORE_NAME = "posts";
const KEY_PATH = "id";

export const FavoriteIndexEntrySchema = z.object({
  id: z.int(),
  /** The tag list as the site prints it on the preview, space separated. */
  tags: z.string(),
  /** Address of the preview image. */
  thumb: z.string(),
  /** When the sync run that saw the post started, ms since epoch. */
  run: z.number(),
  /** Place of the post in the site's list during that run, 0 is the newest favorite. */
  pos: z.int(),
  /**
   * True when the tag list was read from a favorites page, where the site
   * cuts one character off each end of it; false when it was read whole.
   * Absent on entries written before 0.40.11 (see features/favorites-tags.ts).
   */
  cut: z.optional(z.boolean()),
  /**
   * From the site API, when the user has a key and asked for them ("Read
   * ratings and sizes"): the favorites page gives none of these.
   */
  rating: z.optional(z.string()),
  score: z.optional(z.number()),
  width: z.optional(z.number()),
  height: z.optional(z.number()),
});

/** What the API adds to an entry. */
export type FavoriteDetails = {
  readonly id: number;
  readonly rating?: string | undefined;
  readonly score?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
};

/** The entry with the details laid over it; a detail that is absent changes nothing. */
export function withFavoriteDetails(
  entry: FavoriteIndexEntry,
  details: FavoriteDetails,
): FavoriteIndexEntry {
  return {
    ...entry,
    ...(details.rating === undefined ? {} : { rating: details.rating }),
    ...(details.score === undefined ? {} : { score: details.score }),
    ...(details.width === undefined ? {} : { width: details.width }),
    ...(details.height === undefined ? {} : { height: details.height }),
  };
}

export type FavoriteIndexEntry = z.infer<typeof FavoriteIndexEntrySchema>;

/** False where the browser gives no IndexedDB (and in tests without a stub). */
export function favoritesIndexAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      reject(request.error ?? new Error("favorites-index: open failed"));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: KEY_PATH });
      }
    };
  });
}

function whenDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error("favorites-index: transaction failed"));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error("favorites-index: transaction aborted"));
    };
  });
}

/** Adds or replaces entries. Does nothing without IndexedDB. */
export async function putFavoriteIndexEntries(
  entries: readonly FavoriteIndexEntry[],
): Promise<void> {
  if (entries.length === 0 || !favoritesIndexAvailable()) {
    return;
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const entry of entries) {
      // A sync writes an entry again without the details the API gave it:
      // they are carried over from what is stored.
      const request = store.get(entry.id);
      request.onsuccess = () => {
        const old = FavoriteIndexEntrySchema.safeParse(request.result);
        store.put(old.success ? withFavoriteDetails(entry, { ...old.data, ...definedDetails(entry) }) : entry);
      };
      request.onerror = () => {
        store.put(entry);
      };
    }
    await whenDone(tx);
  } finally {
    db.close();
  }
}

function definedDetails(entry: FavoriteIndexEntry): FavoriteDetails {
  return {
    id: entry.id,
    ...(entry.rating === undefined ? {} : { rating: entry.rating }),
    ...(entry.score === undefined ? {} : { score: entry.score }),
    ...(entry.width === undefined ? {} : { width: entry.width }),
    ...(entry.height === undefined ? {} : { height: entry.height }),
  };
}

/** Lays details over the entries that are stored; a post without an entry is left out. */
export async function putFavoriteDetails(details: readonly FavoriteDetails[]): Promise<void> {
  if (details.length === 0 || !favoritesIndexAvailable()) {
    return;
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const item of details) {
      const request = store.get(item.id);
      request.onsuccess = () => {
        const old = FavoriteIndexEntrySchema.safeParse(request.result);
        if (old.success) {
          store.put(withFavoriteDetails(old.data, item));
        }
      };
    }
    await whenDone(tx);
  } finally {
    db.close();
  }
}

/** Every stored entry that still has the expected shape. */
export async function readFavoriteIndex(): Promise<FavoriteIndexEntry[]> {
  if (!favoritesIndexAvailable()) {
    return [];
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      request.onerror = () => {
        reject(request.error ?? new Error("favorites-index: read failed"));
      };
      request.onsuccess = () => {
        const result: unknown = request.result;
        resolve(Array.isArray(result) ? result : []);
      };
    });
    const entries: FavoriteIndexEntry[] = [];
    for (const row of rows) {
      const parsed = FavoriteIndexEntrySchema.safeParse(row);
      if (parsed.success) {
        entries.push(parsed.data);
      }
    }
    return entries;
  } finally {
    db.close();
  }
}

/** Removes entries by post id. */
export async function deleteFavoriteIndexEntries(ids: readonly number[]): Promise<void> {
  if (ids.length === 0 || !favoritesIndexAvailable()) {
    return;
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const id of ids) {
      store.delete(id);
    }
    await whenDone(tx);
  } finally {
    db.close();
  }
}

/** Like {@link putFavoriteIndexEntries}, but a failure is logged, not thrown. */
export function putFavoriteIndexEntriesQuietly(entries: readonly FavoriteIndexEntry[]): void {
  putFavoriteIndexEntries(entries).catch((error: unknown) => {
    log.warn("favorites-index: write failed", error);
  });
}
