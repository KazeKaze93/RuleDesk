import * as z from "zod/mini";

import {
  APPEARANCE_BACKGROUND_TOO_LARGE,
  FAVS_STORAGE_KEY,
  IMPORT_SCHEMA_ERROR_PREFIX,
  STORAGE_BACKUP_KEY,
} from "../config/constants";
import { log } from "../log";
import {
  backgroundTooLarge,
  clearBackground,
  loadBackground,
  saveBackground,
} from "./background-store";
import { isSiteUrl } from "../site/urls";
import {
  clearFavsCache,
  extractFavIdsFromMarks,
  migrateMarksFavToFavs,
  parseFavsStrict,
} from "./favs";
import {
  FavsSchema,
  StorageSchema,
  createDefaultFavs,
  createDefaultStorage,
  stripLegacyPanelWindowSize,
  type FavsData,
  type StorageData,
} from "./schema";
import { rememberBackup } from "./history";
import { clearStorageCache, load, save } from "./store";

export const BACKUP_FORMAT = "ruledesk-web-backup" as const;
export const BACKUP_VERSION = 1 as const;

export const IMPORT_MODE_MERGE = "merge" as const;
export const IMPORT_MODE_REPLACE = "replace" as const;

export type BackupImportMode =
  | typeof IMPORT_MODE_MERGE
  | typeof IMPORT_MODE_REPLACE;

export const BackupFileSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  storage: StorageSchema,
  favs: z.optional(FavsSchema),
  background: z.optional(z.string()),
});

export type BackupFile = z.infer<typeof BackupFileSchema>;

const IMPORT_BACKGROUND_NOT_PICTURE = "The background in this file is not a picture";

export type BackupExportOptions = {
  readonly includeBackground: boolean;
  readonly includeFavorites: boolean;
};

export type BackupImportSummary = {
  readonly artistCount: number;
  readonly collectionCount: number;
  readonly favCount: number;
};

export type BackupImportResult =
  | { readonly ok: true; readonly summary: BackupImportSummary }
  | { readonly ok: false; readonly error: string };

type GmGetValue = (key: string, defaultValue?: unknown) => unknown;
type GmSetValue = (key: string, value: unknown) => void;

function getGmGetValue(): GmGetValue {
  return GM_getValue;
}

function getGmSetValue(): GmSetValue {
  return GM_setValue;
}

function formatSchemaError(error: z.core.$ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) {
    return `${IMPORT_SCHEMA_ERROR_PREFIX}: (root): Invalid data`;
  }
  const path =
    issue.path.length === 0
      ? "(root)"
      : issue.path.map((segment) => String(segment)).join(".");
  return `${IMPORT_SCHEMA_ERROR_PREFIX}: ${path}: ${issue.message}`;
}

async function readBackgroundForBackup(): Promise<string | undefined> {
  const dataUrl = await loadBackground();
  if (dataUrl === null || dataUrl.length === 0) {
    return undefined;
  }
  return dataUrl;
}

async function writeBackgroundForBackup(
  value: string | undefined,
): Promise<void> {
  if (value === undefined || value.length === 0) {
    await clearBackground();
    return;
  }
  await saveBackground(value);
}

function readFavsForBackup(): FavsData {
  const raw = getGmGetValue()(FAVS_STORAGE_KEY, undefined);
  if (raw === undefined || raw === null) {
    return createDefaultFavs();
  }
  const parsed = parseFavsStrict(raw);
  if (parsed === null) {
    log.error("backup: invalid favs; exporting empty favs", {
      key: FAVS_STORAGE_KEY,
    });
    return createDefaultFavs();
  }
  return parsed;
}

function writeFavsForBackup(data: FavsData): void {
  getGmSetValue()(FAVS_STORAGE_KEY, FavsSchema.parse(data));
  clearFavsCache();
}

async function snapshotCurrentToBackupKey(): Promise<void> {
  const background = await readBackgroundForBackup();
  const snapshot: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    storage: load(),
    favs: readFavsForBackup(),
    ...(background !== undefined ? { background } : {}),
  };
  getGmSetValue()(STORAGE_BACKUP_KEY, snapshot);
}

function siteUrlsOnly(urls: readonly string[] | undefined): string[] | undefined {
  return urls === undefined ? undefined : urls.filter(isSiteUrl);
}

/**
 * Drops picture addresses that are not on the site from an imported file.
 * A file from someone else could otherwise make the Collections and Following
 * pages load pictures from a server of its author's choice.
 */
export function keepSiteMedia(storage: StorageData): StorageData {
  return {
    ...storage,
    settings: keepOwnBackground(storage.settings),
    collections: storage.collections.map((collection) => {
      const next = { ...collection };
      const cover = siteUrlsOnly(collection.cover);
      if (cover !== undefined) {
        next.cover = cover;
      }
      if (collection.thumbs !== undefined) {
        const thumbs: Record<string, string> = {};
        for (const [postId, url] of Object.entries(collection.thumbs)) {
          if (isSiteUrl(url)) {
            thumbs[postId] = url;
          }
        }
        next.thumbs = thumbs;
      }
      return next;
    }),
    artists: storage.artists.map((artist) => {
      const cover = siteUrlsOnly(artist.cover);
      return cover === undefined ? artist : { ...artist, cover };
    }),
  };
}

/** A picture kept in the file itself: it asks no server for anything. */
const DATA_IMAGE_PREFIX = /^data:image\/(?:jpeg|png|webp|gif|avif);base64,/i;

function isDataImage(value: string): boolean {
  return DATA_IMAGE_PREFIX.test(value);
}

/**
 * The address of the page background in imported settings is kept only when it
 * is on the site or is the picture itself. Any other address would be asked
 * for on every page of the site, and tell its server when the user is there.
 */
function keepOwnBackground(settings: StorageData["settings"]): StorageData["settings"] {
  const custom = settings?.appearance?.custom;
  const address = custom?.backgroundImage;
  if (
    settings === undefined ||
    settings.appearance === undefined ||
    custom === undefined ||
    address === undefined ||
    isSiteUrl(address) ||
    isDataImage(address)
  ) {
    return settings;
  }
  const { backgroundImage: _dropped, ...kept } = custom;
  return { ...settings, appearance: { ...settings.appearance, custom: kept } };
}

/**
 * What a file says of the run of "Sync favorites" is not taken: the state of
 * a run is of this browser. A file with "running" set made the next page walk
 * all the pages of favorites by itself, and with its own account id (found by
 * the audit of 19.11.2026).
 */
function withoutSync(favs: FavsData): FavsData {
  return { version: favs.version, ids: favs.ids };
}

function mergeArtists(
  current: StorageData["artists"],
  incoming: StorageData["artists"],
): StorageData["artists"] {
  const byTag = new Map<string, StorageData["artists"][number]>();
  for (const entry of current) {
    byTag.set(entry.tag, entry);
  }
  for (const entry of incoming) {
    // Fields the file does not carry (cover, post count, follow date) stay.
    byTag.set(entry.tag, { ...byTag.get(entry.tag), ...entry });
  }
  return Array.from(byTag.values());
}

function mergeCollections(
  current: StorageData["collections"],
  incoming: StorageData["collections"],
): StorageData["collections"] {
  const byId = new Map<string, StorageData["collections"][number]>();
  for (const entry of current) {
    byId.set(entry.id, entry);
  }
  for (const entry of incoming) {
    byId.set(entry.id, entry);
  }
  return Array.from(byId.values());
}

function mergeMarks(
  current: StorageData["marks"],
  incoming: StorageData["marks"],
): StorageData["marks"] {
  const merged: StorageData["marks"] = { ...current };
  for (const [postId, flags] of Object.entries(incoming)) {
    const previous = merged[postId] ?? {};
    merged[postId] = { ...previous, ...flags };
  }
  return merged;
}

function mergeFavs(current: FavsData, incoming: FavsData): FavsData {
  const ids = new Set([...current.ids, ...incoming.ids]);
  const next: FavsData = {
    version: incoming.version,
    ids: Array.from(ids),
  };
  if (current.sync !== undefined) {
    next.sync = current.sync;
  }
  return next;
}

function buildSummary(
  storage: StorageData,
  favs: FavsData,
): BackupImportSummary {
  return {
    artistCount: storage.artists.length,
    collectionCount: storage.collections.length,
    favCount: favs.ids.length,
  };
}

/**
 * When the backup omits favs, strip legacy marks.fav so migrateMarksFavToFavs
 * cannot enlarge the untouched local fav set.
 */
function storageWithoutMarkFavs(storage: StorageData): StorageData {
  const stripped = extractFavIdsFromMarks(storage.marks);
  return { ...storage, marks: stripped.marks };
}

async function applyImportedState(
  storage: StorageData,
  favs: FavsData | undefined,
  background: string | undefined,
  applyBackground: boolean,
  applyFavs: boolean,
): Promise<BackupImportSummary> {
  await snapshotCurrentToBackupKey();
  const storageToWrite = applyFavs
    ? storage
    : storageWithoutMarkFavs(storage);
  const stripped = stripLegacyPanelWindowSize(storageToWrite);
  save(stripped.data);
  if (applyFavs && favs !== undefined) {
    writeFavsForBackup(favs);
  }
  if (applyBackground) {
    await writeBackgroundForBackup(background);
  }
  migrateMarksFavToFavs();
  clearStorageCache();
  clearFavsCache();
  const finalStorage = load();
  const finalFavs = readFavsForBackup();
  return buildSummary(finalStorage, finalFavs);
}

/** Local calendar date YYYY-MM-DD for backup filenames. */
export function backupDateStamp(date: Date = new Date()): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildBackupFilename(date: Date = new Date()): string {
  return `ruledesk-web-backup-${backupDateStamp(date)}.json`;
}

/** Build a validated backup object from current storage + optional IDB background. */
export async function buildBackupFile(
  options: BackupExportOptions,
): Promise<BackupFile> {
  const storage = load();
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    storage,
    ...(options.includeFavorites ? { favs: readFavsForBackup() } : {}),
  };
  if (options.includeBackground) {
    const background = await readBackgroundForBackup();
    if (background !== undefined) {
      return { ...file, background };
    }
  }
  return file;
}

export function serializeBackupFile(file: BackupFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** Trigger a browser download of the JSON text (Blob + `<a download>`). */
export function downloadBackupText(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportBackupDownload(
  options: BackupExportOptions,
): Promise<BackupFile> {
  const file = await buildBackupFile(options);
  downloadBackupText(serializeBackupFile(file), buildBackupFilename());
  rememberBackup();
  return file;
}

/**
 * Parse and apply a backup JSON string.
 * Invalid input leaves storage/favs/background unchanged.
 * A file without a `favs` field leaves the local fav set untouched.
 */
export async function importBackupJson(
  raw: string,
  mode: BackupImportMode,
): Promise<BackupImportResult> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    return { ok: false, error: message };
  }

  const parsed = BackupFileSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: formatSchemaError(parsed.error) };
  }

  const incoming = { ...parsed.data, storage: keepSiteMedia(parsed.data.storage) };
  // The stored background is a picture as data. Anything else in its place,
  // an address among them, is not a background: the file is refused before
  // anything is written, as is a picture too large to keep.
  if (incoming.background !== undefined && incoming.background.length > 0) {
    if (!isDataImage(incoming.background)) {
      return { ok: false, error: IMPORT_BACKGROUND_NOT_PICTURE };
    }
    if (backgroundTooLarge(incoming.background)) {
      return { ok: false, error: APPEARANCE_BACKGROUND_TOO_LARGE };
    }
  }
  const hasBackgroundField = Object.prototype.hasOwnProperty.call(
    incoming,
    "background",
  );
  const hasFavsField = Object.prototype.hasOwnProperty.call(incoming, "favs");
  const incomingFavs = incoming.favs === undefined ? undefined : withoutSync(incoming.favs);

  try {
    if (mode === IMPORT_MODE_REPLACE) {
      const summary = await applyImportedState(
        incoming.storage,
        hasFavsField ? incomingFavs : undefined,
        hasBackgroundField ? incoming.background : undefined,
        true,
        hasFavsField,
      );
      return { ok: true, summary };
    }

    const currentStorage = load();
    const currentFavs = readFavsForBackup();
    const mergedStorage: StorageData = {
      version: currentStorage.version,
      collections: mergeCollections(
        currentStorage.collections,
        incoming.storage.collections,
      ),
      artists: mergeArtists(currentStorage.artists, incoming.storage.artists),
      marks: mergeMarks(currentStorage.marks, incoming.storage.marks),
      settings: incoming.storage.settings,
      updates: incoming.storage.updates ?? currentStorage.updates,
    };
    if (mergedStorage.settings === undefined) {
      mergedStorage.settings = createDefaultStorage().settings;
    }
    const mergedFavs =
      hasFavsField && incomingFavs !== undefined
        ? mergeFavs(currentFavs, incomingFavs)
        : undefined;
    const summary = await applyImportedState(
      mergedStorage,
      mergedFavs,
      incoming.background,
      hasBackgroundField,
      hasFavsField,
    );
    return { ok: true, summary };
  } catch (error) {
    log.error("backup import failed after parse", error);
    clearStorageCache();
    clearFavsCache();
    const message =
      error instanceof Error ? error.message : "Import failed unexpectedly";
    return { ok: false, error: message };
  }
}

