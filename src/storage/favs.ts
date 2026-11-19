import {
  FAVS_SCHEMA_VERSION,
  FAVS_STORAGE_KEY,
  STORAGE_KEY,
} from "../config/constants";
import { log } from "../log";
import { pruneMarksIfNeeded } from "./marks-prune";
import {
  FavsSchema,
  FavsSyncSchema,
  StorageSchema,
  createDefaultFavs,
  migrateRetiredFeatureChoices,
  stripLegacyPanelWindowSize,
  type FavsData,
  type FavsSyncState,
  type MarkFlags,
  type StorageData,
} from "./schema";

type GmGetValue = (key: string, defaultValue?: unknown) => unknown;
type GmSetValue = (key: string, value: unknown) => void;

let cachedIds: Set<number> | null = null;
let cachedSync: FavsSyncState | undefined;
let cacheHydrated = false;

function getGmGetValue(): GmGetValue {
  return GM_getValue;
}

function getGmSetValue(): GmSetValue {
  return GM_setValue;
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isIntNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isIntNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isIntNumber);
}

/**
 * Cheap page-path shape check: version + integer id array.
 * Optional `sync` is validated with the small FavsSyncSchema when present.
 * Full FavsSchema is reserved for {@link parseFavsStrict} (import / migration).
 */
export function cheapParseFavs(raw: unknown): FavsData | null {
  if (!isUnknownRecord(raw)) {
    return null;
  }
  if (raw.version !== FAVS_SCHEMA_VERSION) {
    return null;
  }
  if (!isIntNumberArray(raw.ids)) {
    return null;
  }
  const next: FavsData = {
    version: FAVS_SCHEMA_VERSION,
    ids: raw.ids,
  };
  if (raw.sync !== undefined) {
    const syncParsed = FavsSyncSchema.safeParse(raw.sync);
    if (syncParsed.success) {
      next.sync = syncParsed.data;
    }
  }
  return next;
}

/** Full zod parse for import / migration callers. */
export function parseFavsStrict(raw: unknown): FavsData | null {
  const parsed = FavsSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

function normalizePostId(id: number | string): number | null {
  if (typeof id === "number") {
    if (!Number.isFinite(id)) {
      return null;
    }
    return Math.trunc(id);
  }
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
}

function readFavsRaw(): FavsData {
  const raw = getGmGetValue()(FAVS_STORAGE_KEY, undefined);
  if (raw === undefined || raw === null) {
    return createDefaultFavs();
  }
  const parsed = cheapParseFavs(raw);
  if (parsed === null) {
    log.error("Invalid favs storage content; using empty favs", {
      key: FAVS_STORAGE_KEY,
    });
    return createDefaultFavs();
  }
  return parsed;
}

function writeFavsData(data: FavsData): void {
  getGmSetValue()(FAVS_STORAGE_KEY, data);
}

function setCacheFromData(data: FavsData): void {
  cachedIds = new Set(data.ids);
  cachedSync = data.sync;
  cacheHydrated = true;
}

function readMainStorageRaw(): StorageData | null {
  const raw = getGmGetValue()(STORAGE_KEY, undefined);
  if (raw === undefined || raw === null) {
    return null;
  }
  const parsed = StorageSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

function writeMainStorage(data: StorageData): void {
  const pruned = pruneMarksIfNeeded(data.marks);
  const next = pruned.pruned ? { ...data, marks: pruned.marks } : data;
  getGmSetValue()(STORAGE_KEY, StorageSchema.parse(next));
}

/**
 * Extract legacy `marks.*.fav === true` into favs.ids, strip `fav` from marks,
 * strip legacy panel window size from featureState, save both keys.
 * Idempotent. Preserves `marks.seen` and other featureState keys.
 * Favs blob: full zod when rewriting after a marks/panel change; cheap read otherwise.
 *
 * `known` is the main storage the caller has just read and validated: it is
 * not read and validated a second time. Returns whether the main storage was
 * written, so that the caller reads it again only then.
 */
export function migrateMarksFavToFavs(known?: StorageData): boolean {
  const main = known ?? readMainStorageRaw();
  const favsRaw = getGmGetValue()(FAVS_STORAGE_KEY, undefined);
  const favsCheap =
    favsRaw === undefined || favsRaw === null
      ? createDefaultFavs()
      : cheapParseFavs(favsRaw);
  const favs = favsCheap ?? createDefaultFavs();
  if (favsCheap === null && favsRaw !== undefined && favsRaw !== null) {
    log.error("Invalid favs storage content; using empty favs", {
      key: FAVS_STORAGE_KEY,
    });
  }
  const ids = new Set(favs.ids);
  let marksChanged = false;
  let mainToWrite: StorageData | null = null;

  if (main !== null) {
    const nextMarks: StorageData["marks"] = {};
    for (const [postId, flags] of Object.entries(main.marks)) {
      const nextFlags: MarkFlags = {};
      if (flags.seen === true) {
        nextFlags.seen = true;
      }
      if (flags.fav === true) {
        const normalized = normalizePostId(postId);
        if (normalized !== null) {
          ids.add(normalized);
        }
        marksChanged = true;
      } else if (flags.fav !== undefined) {
        marksChanged = true;
      }
      if (Object.keys(nextFlags).length > 0) {
        nextMarks[postId] = nextFlags;
      } else if (flags.fav === undefined && flags.seen === undefined) {
        nextMarks[postId] = {};
      }
      // fav-only entries become empty and are dropped
    }

    let nextMain: StorageData = main;
    if (marksChanged) {
      nextMain = { ...main, marks: nextMarks };
    }
    const stripped = stripLegacyPanelWindowSize(nextMain);
    const choices = migrateRetiredFeatureChoices(stripped.data);
    if (marksChanged || stripped.changed || choices.changed) {
      mainToWrite = choices.data;
    }
  }

  if (mainToWrite !== null) {
    writeMainStorage(mainToWrite);
  }

  const nextFavs: FavsData = {
    version: favs.version,
    ids: Array.from(ids),
  };
  if (favs.sync !== undefined) {
    nextFavs.sync = favs.sync;
  }

  // By a set: with `includes` this was a pass over all the favorites for each
  // of them, on every read of the storage.
  const had = new Set(favs.ids);
  const idsChanged =
    nextFavs.ids.length !== favs.ids.length || nextFavs.ids.some((id) => !had.has(id));

  if (idsChanged) {
    const strict = parseFavsStrict(nextFavs);
    if (strict === null) {
      log.error("migrateMarksFavToFavs: strict favs validate failed; skipping write", {
        key: FAVS_STORAGE_KEY,
      });
    } else {
      writeFavsData(strict);
      setCacheFromData(strict);
      return mainToWrite !== null;
    }
  }

  setCacheFromData(nextFavs);
  return mainToWrite !== null;
}

function ensureCache(): Set<number> {
  if (cacheHydrated && cachedIds !== null) {
    return cachedIds;
  }
  migrateMarksFavToFavs();
  if (cachedIds === null) {
    const data = readFavsRaw();
    setCacheFromData(data);
  }
  return cachedIds ?? new Set();
}

function persistIds(ids: Set<number>): void {
  const next: FavsData = {
    version: createDefaultFavs().version,
    ids: Array.from(ids),
  };
  if (cachedSync !== undefined) {
    next.sync = cachedSync;
  }
  writeFavsData(next);
  cachedIds = ids;
  cacheHydrated = true;
}

/** Clears the in-memory fav cache (tests / full remount). */
export function clearFavsCache(): void {
  cachedIds = null;
  cachedSync = undefined;
  cacheHydrated = false;
}

export function loadFavSet(): Set<number> {
  return ensureCache();
}

export function isFav(id: number | string): boolean {
  const normalized = normalizePostId(id);
  if (normalized === null) {
    return false;
  }
  return ensureCache().has(normalized);
}

export function addFav(id: number | string): void {
  const normalized = normalizePostId(id);
  if (normalized === null) {
    return;
  }
  const ids = new Set(ensureCache());
  if (ids.has(normalized)) {
    cachedIds = ids;
    return;
  }
  ids.add(normalized);
  persistIds(ids);
}

export function removeFav(id: number | string): void {
  const normalized = normalizePostId(id);
  if (normalized === null) {
    return;
  }
  const ids = new Set(ensureCache());
  if (!ids.has(normalized)) {
    cachedIds = ids;
    return;
  }
  ids.delete(normalized);
  persistIds(ids);
}

export function addFavs(ids: number[]): void {
  if (ids.length === 0) {
    ensureCache();
    return;
  }
  const next = new Set(ensureCache());
  let changed = false;
  for (const id of ids) {
    const normalized = normalizePostId(id);
    if (normalized === null) {
      continue;
    }
    if (!next.has(normalized)) {
      next.add(normalized);
      changed = true;
    }
  }
  if (changed) {
    persistIds(next);
  } else {
    cachedIds = next;
  }
}

export function getSyncState(): FavsSyncState | undefined {
  ensureCache();
  return cachedSync;
}

export function setSyncState(sync: FavsSyncState | undefined): void {
  const ids = ensureCache();
  cachedSync = sync;
  const next: FavsData = {
    version: createDefaultFavs().version,
    ids: Array.from(ids),
  };
  if (sync !== undefined) {
    next.sync = sync;
  }
  writeFavsData(next);
  cacheHydrated = true;
}

/**
 * Strip legacy `fav` flags from a marks record and return the fav post ids found.
 * Used by import to treat old `marks.fav` as fav ids.
 */
export function extractFavIdsFromMarks(
  marks: StorageData["marks"],
): { marks: StorageData["marks"]; favIds: number[] } {
  const favIds: number[] = [];
  const nextMarks: StorageData["marks"] = {};
  for (const [postId, flags] of Object.entries(marks)) {
    if (flags.fav === true) {
      const normalized = normalizePostId(postId);
      if (normalized !== null) {
        favIds.push(normalized);
      }
    }
    const nextFlags: MarkFlags = {};
    if (flags.seen === true) {
      nextFlags.seen = true;
    }
    if (Object.keys(nextFlags).length > 0) {
      nextMarks[postId] = nextFlags;
    }
  }
  return { marks: nextMarks, favIds };
}
