import * as z from "zod/mini";

import {
  APPEARANCE_BACKGROUND_KEY,
  APPEARANCE_BACKGROUND_MAX_BYTES,
  APPEARANCE_BACKGROUND_TOO_LARGE,
  COLLECTION_KIND_POSTS,
  COLLECTION_KIND_SEARCH,
  DEFAULT_GRID_FAV_BUTTONS,
  DEFAULT_PLAYLIST_CHUNK_SIZE,
  DEFAULT_SEEN_POST_ID,
  DEFAULT_TWEAKS_ENABLED,
  DEFAULT_UPDATES_GROUP_SIZE,
  IMPORT_SCHEMA_ERROR_PREFIX,
  MAX_UPDATES_GROUP_SIZE,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "../config/constants";
import { log } from "../log";
import { normalizeArtistTag, parseTags } from "../search/query";
import { readArtistsMirror, writeArtistsMirror } from "./artists-mirror";
import {
  addFav,
  addFavs,
  extractFavIdsFromMarks,
  loadFavSet,
  migrateMarksFavToFavs,
  removeFav,
} from "./favs";
import { pruneMarksIfNeeded } from "./marks-prune";
import {
  AppearanceSchema,
  ArtistEntrySchema,
  CollectionSchema,
  ExportBlobSchema,
  StorageSchema,
  createDefaultAppearance,
  createDefaultStorage,
  isPlaylist,
  migrateCollectionMediaFields,
  resolveAppearance,
  resolveGridFavButtons,
  resolvePlaylistChunkSize,
  resolveSeenPostId,
  resolveTweaksEnabled,
  resolveUpdatesGroupSize,
  type Appearance,
  type ArtistEntry,
  type Collection,
  type ExportBlob,
  type MarkFlags,
  type Settings,
  type StorageData,
  type TagEntry,
} from "./schema";

type GmGetValue = (key: string, defaultValue?: unknown) => unknown;
type GmSetValue = (key: string, value: unknown) => void;

let cachedStorage: StorageData | null = null;
let storageCacheHydrated = false;

function getGmGetValue(): GmGetValue {
  return GM_getValue;
}

function getGmSetValue(): GmSetValue {
  return GM_setValue;
}

function readRaw(): unknown {
  return getGmGetValue()(STORAGE_KEY, undefined);
}

function writeData(data: StorageData): void {
  getGmSetValue()(STORAGE_KEY, data);
}

function setStorageCache(data: StorageData): void {
  cachedStorage = data;
  storageCacheHydrated = true;
}

/** Authoritative replace: used after intentional GM writes ({@link save}). */
function syncArtistsMirror(data: StorageData): void {
  writeArtistsMirror(data.artists.map((entry) => entry.tag));
}

/**
 * Seeds the mirror from GM only when missing/unparseable.
 * Never replaces an existing fresher mirror (bfcache / cross-tab).
 */
function seedArtistsMirrorIfMissing(data: StorageData): void {
  if (readArtistsMirror() !== null) {
    return;
  }
  syncArtistsMirror(data);
}

/**
 * Seeds the artists mirror from current storage when the mirror is missing.
 * Does not clobber an existing mirror. Prefer {@link save} for authoritative updates.
 * Package A may call this once on boot if load has not run yet.
 */
export function syncArtistsMirrorFromStorage(): void {
  seedArtistsMirrorIfMissing(load());
}

/** Clears the in-memory main storage cache (tests / full remount). */
export function clearStorageCache(): void {
  cachedStorage = null;
  storageCacheHydrated = false;
}

function loadUncached(): StorageData {
  const raw = readRaw();
  if (raw === undefined || raw === null) {
    migrateMarksFavToFavs();
    const empty = createDefaultStorage();
    seedArtistsMirrorIfMissing(empty);
    return empty;
  }
  const parsed = StorageSchema.safeParse(raw);
  if (!parsed.success) {
    backupInvalid(raw);
    migrateMarksFavToFavs();
    const empty = createDefaultStorage();
    seedArtistsMirrorIfMissing(empty);
    return empty;
  }
  migrateMarksFavToFavs();
  const after = readRaw();
  if (after === undefined || after === null) {
    const empty = createDefaultStorage();
    seedArtistsMirrorIfMissing(empty);
    return empty;
  }
  const reparsed = StorageSchema.safeParse(after);
  if (!reparsed.success) {
    seedArtistsMirrorIfMissing(parsed.data);
    return persistCollectionMediaMigration(parsed.data);
  }
  seedArtistsMirrorIfMissing(reparsed.data);
  return persistCollectionMediaMigration(reparsed.data);
}

function persistCollectionMediaMigration(data: StorageData): StorageData {
  const migrated = migrateCollectionMediaFields(data);
  if (!migrated.changed) {
    return data;
  }
  const parsed = StorageSchema.parse(migrated.data);
  writeData(parsed);
  return parsed;
}

function backupInvalid(raw: unknown): void {
  getGmSetValue()(STORAGE_BACKUP_KEY, raw);
  log.error("Invalid storage content backed up", {
    key: STORAGE_KEY,
    backupKey: STORAGE_BACKUP_KEY,
  });
}

function formatSchemaImportError(error: z.core.$ZodError): Error {
  const issue = error.issues[0];
  if (issue === undefined) {
    return new Error(`${IMPORT_SCHEMA_ERROR_PREFIX}: (root): Invalid data`);
  }
  const path =
    issue.path.length === 0
      ? "(root)"
      : issue.path.map((segment) => String(segment)).join(".");
  return new Error(
    `${IMPORT_SCHEMA_ERROR_PREFIX}: ${path}: ${issue.message}`,
  );
}

function currentSettings(data: StorageData): Settings {
  const next: Settings = {
    gridFavButtons: resolveGridFavButtons(data),
    updatesGroupSize: resolveUpdatesGroupSize(data),
    playlistChunkSize: resolvePlaylistChunkSize(data),
    tweaksEnabled: resolveTweaksEnabled(data),
  };
  if (data.settings?.features !== undefined) {
    next.features = { ...data.settings.features };
  }
  if (data.settings?.featureChoice !== undefined) {
    next.featureChoice = { ...data.settings.featureChoice };
  }
  if (data.settings?.featureState !== undefined) {
    next.featureState = { ...data.settings.featureState };
  }
  if (data.settings?.appearance !== undefined) {
    next.appearance = data.settings.appearance;
  }
  return next;
}

function byteLengthUtf8(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length;
}

function normalizePostId(postId: number): number | null {
  if (!Number.isFinite(postId)) {
    return null;
  }
  const truncated = Math.trunc(postId);
  if (truncated < 0) {
    return null;
  }
  return truncated;
}

export function load(): StorageData {
  if (storageCacheHydrated && cachedStorage !== null) {
    return cachedStorage;
  }
  const data = loadUncached();
  setStorageCache(data);
  return data;
}

/** Drop the in-memory cache and re-read + validate from GM storage. */
export function reloadFromStorage(): StorageData {
  clearStorageCache();
  return load();
}

export function save(data: StorageData): void {
  const parsed = StorageSchema.parse(data);
  const migrated = migrateCollectionMediaFields(parsed).data;
  const pruned = pruneMarksIfNeeded(migrated.marks);
  const toWrite = pruned.pruned
    ? { ...migrated, marks: pruned.marks }
    : migrated;
  writeData(toWrite);
  migrateMarksFavToFavs();
  const after = readRaw();
  if (after === undefined || after === null) {
    const empty = createDefaultStorage();
    setStorageCache(empty);
    syncArtistsMirror(empty);
    return;
  }
  const reparsed = StorageSchema.safeParse(after);
  if (!reparsed.success) {
    setStorageCache(toWrite);
    syncArtistsMirror(toWrite);
    return;
  }
  setStorageCache(reparsed.data);
  syncArtistsMirror(reparsed.data);
}

export function addCollection(name: string, tags: TagEntry[]): Collection {
  const data = load();
  const collection = CollectionSchema.parse({
    id: crypto.randomUUID(),
    name: name.trim(),
    tags,
  });
  data.collections.push(collection);
  save(data);
  return collection;
}

export function renameCollection(id: string, name: string): Collection | null {
  const data = reloadFromStorage();
  const target = data.collections.find((item) => item.id === id);
  if (target === undefined) {
    return null;
  }
  target.name = name.trim();
  CollectionSchema.parse(target);
  save(data);
  return target;
}

export function deleteCollection(id: string): boolean {
  const data = reloadFromStorage();
  const next = data.collections.filter((item) => item.id !== id);
  if (next.length === data.collections.length) {
    return false;
  }
  data.collections = next;
  save(data);
  return true;
}

/** Creates a post playlist (`kind: "posts"`, empty tags, empty postIds). */
export function createPlaylist(name: string): Collection {
  const data = reloadFromStorage();
  const collection = CollectionSchema.parse({
    id: crypto.randomUUID(),
    name: name.trim(),
    tags: [],
    kind: COLLECTION_KIND_POSTS,
    postIds: [],
    thumbs: {},
    shuffledOrder: null,
  });
  data.collections.push(collection);
  save(data);
  return collection;
}

export function listPlaylists(): Collection[] {
  return load().collections.filter(isPlaylist);
}

export function playlistsContaining(postId: number): Collection[] {
  const normalized = normalizePostId(postId);
  if (normalized === null) {
    return [];
  }
  return listPlaylists().filter((playlist) =>
    (playlist.postIds ?? []).includes(normalized),
  );
}

const FISHER_YATES_STOP_INDEX = 0;
const SHUFFLE_DISTINCT_MIN_LENGTH = 2;
const SHUFFLE_FALLBACK_INDEX = 1;

/** One removed custom-collection post, enough to undo membership, thumb, and order. */
export type CollectionPostRestore = {
  readonly postId: number;
  readonly thumbUrl: string | null;
  readonly insertionIndex: number;
  readonly displayIndex: number;
};

/** Undo payload from {@link removePostsFromCollection}. */
export type CollectionPostsSnapshot = {
  readonly collectionId: string;
  readonly posts: readonly CollectionPostRestore[];
};

function thumbKey(postId: number): string {
  return String(postId);
}

function readThumb(
  thumbs: Record<string, string> | undefined,
  postId: number,
): string | null {
  if (thumbs === undefined) {
    return null;
  }
  const value = thumbs[thumbKey(postId)];
  if (value === undefined || value.length === 0) {
    return null;
  }
  return value;
}

function normalizeThumbUrl(thumbUrl: string | undefined): string | null {
  if (thumbUrl === undefined) {
    return null;
  }
  const trimmed = thumbUrl.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed;
}

function samePostOrder(left: readonly number[], right: readonly number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

/** Fisher-Yates. When another permutation exists, the result is not `order`. */
function shufflePermutation(order: readonly number[]): number[] {
  const next = [...order];
  for (let index = next.length - 1; index > FISHER_YATES_STOP_INDEX; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    const swapped = next[swapIndex];
    if (current === undefined || swapped === undefined) {
      continue;
    }
    next[index] = swapped;
    next[swapIndex] = current;
  }
  if (next.length < SHUFFLE_DISTINCT_MIN_LENGTH || !samePostOrder(next, order)) {
    return next;
  }
  const first = next[FISHER_YATES_STOP_INDEX];
  const second = next[SHUFFLE_FALLBACK_INDEX];
  if (first === undefined || second === undefined) {
    return next;
  }
  next[FISHER_YATES_STOP_INDEX] = second;
  next[SHUFFLE_FALLBACK_INDEX] = first;
  return next;
}

function clampInsertIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || index < FISHER_YATES_STOP_INDEX) {
    return length;
  }
  const truncated = Math.trunc(index);
  if (truncated > length) {
    return length;
  }
  return truncated;
}

/**
 * Display order: `shuffledOrder` with deleted ids dropped, then postIds that
 * are not in that list (new since the shuffle), in insertion order.
 * `null` / missing `shuffledOrder` is insertion order.
 */
function collectionDisplayOrder(collection: Collection): number[] {
  const insertion = collection.postIds ?? [];
  const shuffled = collection.shuffledOrder;
  if (shuffled === undefined || shuffled === null) {
    return [...insertion];
  }
  const present = new Set(insertion);
  const ordered: number[] = [];
  const seen = new Set<number>();
  for (const id of shuffled) {
    if (!present.has(id) || seen.has(id)) {
      continue;
    }
    ordered.push(id);
    seen.add(id);
  }
  for (const id of insertion) {
    if (seen.has(id)) {
      continue;
    }
    ordered.push(id);
    seen.add(id);
  }
  return ordered;
}

function findPlaylist(
  data: StorageData,
  collectionId: string,
): Collection | null {
  const target = data.collections.find((item) => item.id === collectionId);
  if (target === undefined || !isPlaylist(target)) {
    return null;
  }
  return target;
}

function ensurePostsMedia(target: Collection): void {
  target.kind = COLLECTION_KIND_POSTS;
  target.tags = [];
  if (target.thumbs === undefined) {
    target.thumbs = {};
  }
  if (target.shuffledOrder === undefined) {
    target.shuffledOrder = null;
  }
}

/**
 * Phase 2 HANDOFF: custom collections are `kind: "posts"`.
 * Append `postId` (no duplicates). Pass `thumbUrl` to store a thumb.
 * Re-add with a URL fills an empty thumb; re-add without a URL keeps a known thumb.
 * New ids stay out of `shuffledOrder` and show up at the end of {@link getCollectionOrder}.
 */
export function addPostToCollection(
  collectionId: string,
  postId: number,
  thumbUrl?: string,
): Collection | null {
  const normalized = normalizePostId(postId);
  if (normalized === null) {
    return null;
  }
  const data = reloadFromStorage();
  const target = findPlaylist(data, collectionId);
  if (target === null) {
    return null;
  }
  const postIds = [...(target.postIds ?? [])];
  const alreadyPresent = postIds.includes(normalized);
  if (!alreadyPresent) {
    postIds.push(normalized);
    if (target.shuffledOrder !== undefined && target.shuffledOrder !== null) {
      target.shuffledOrder = target.shuffledOrder.filter((id) => id !== normalized);
    }
  }
  target.postIds = postIds;
  const incoming = normalizeThumbUrl(thumbUrl);
  const known = readThumb(target.thumbs, normalized);
  const nextThumb = incoming ?? known;
  if (nextThumb !== null) {
    target.thumbs = {
      ...(target.thumbs ?? {}),
      [thumbKey(normalized)]: nextThumb,
    };
  }
  ensurePostsMedia(target);
  CollectionSchema.parse(target);
  save(data);
  return target;
}

export function addPostToPlaylist(
  id: string,
  postId: number,
): Collection | null {
  return addPostToCollection(id, postId);
}

/**
 * Phase 2 HANDOFF: drops the given ids from a custom collection.
 * Returned snapshot is the undo input for {@link restorePosts}.
 * Unknown ids are omitted. A missing or non-posts collection returns null.
 */
export function removePostsFromCollection(
  collectionId: string,
  postIds: readonly number[],
): CollectionPostsSnapshot | null {
  const data = reloadFromStorage();
  const target = findPlaylist(data, collectionId);
  if (target === null) {
    return null;
  }
  const removal = new Set<number>();
  for (const rawId of postIds) {
    const normalized = normalizePostId(rawId);
    if (normalized !== null) {
      removal.add(normalized);
    }
  }
  const currentIds = target.postIds ?? [];
  const display = collectionDisplayOrder(target);
  const posts: CollectionPostRestore[] = [];
  for (let index = 0; index < currentIds.length; index += 1) {
    const id = currentIds[index];
    if (id === undefined || !removal.has(id)) {
      continue;
    }
    const displayIndex = display.indexOf(id);
    posts.push({
      postId: id,
      thumbUrl: readThumb(target.thumbs, id),
      insertionIndex: index,
      displayIndex: displayIndex < FISHER_YATES_STOP_INDEX ? index : displayIndex,
    });
  }
  if (posts.length === 0) {
    return { collectionId, posts };
  }
  const removedIds = new Set(posts.map((post) => post.postId));
  target.postIds = currentIds.filter((id) => !removedIds.has(id));
  // Keep thumbs so a later add without a URL can fill from a known thumb.
  if (target.shuffledOrder !== undefined && target.shuffledOrder !== null) {
    target.shuffledOrder = target.shuffledOrder.filter((id) => !removedIds.has(id));
  }
  ensurePostsMedia(target);
  CollectionSchema.parse(target);
  save(data);
  return { collectionId, posts };
}

export function removePostFromPlaylist(
  id: string,
  postId: number,
): Collection | null {
  const normalized = normalizePostId(postId);
  if (normalized === null) {
    return null;
  }
  const snapshot = removePostsFromCollection(id, [normalized]);
  if (snapshot === null) {
    return null;
  }
  const updated = load().collections.find((item) => item.id === id);
  return updated ?? null;
}

/** Phase 2 HANDOFF: puts {@link removePostsFromCollection} posts back. */
export function restorePosts(snapshot: CollectionPostsSnapshot): Collection | null {
  const data = reloadFromStorage();
  const target = findPlaylist(data, snapshot.collectionId);
  if (target === null) {
    return null;
  }
  if (snapshot.posts.length === 0) {
    return target;
  }
  const postIds = [...(target.postIds ?? [])];
  const thumbs: Record<string, string> = { ...(target.thumbs ?? {}) };
  const byInsertion = [...snapshot.posts].sort(
    (left, right) => left.insertionIndex - right.insertionIndex,
  );
  for (const post of byInsertion) {
    const normalized = normalizePostId(post.postId);
    if (normalized === null) {
      continue;
    }
    if (!postIds.includes(normalized)) {
      const index = clampInsertIndex(post.insertionIndex, postIds.length);
      postIds.splice(index, 0, normalized);
    }
    if (post.thumbUrl !== null && post.thumbUrl.length > 0) {
      thumbs[thumbKey(normalized)] = post.thumbUrl;
    }
  }
  target.postIds = postIds;
  target.thumbs = thumbs;
  if (target.shuffledOrder !== undefined && target.shuffledOrder !== null) {
    const order = [...target.shuffledOrder];
    const byDisplay = [...snapshot.posts].sort(
      (left, right) => left.displayIndex - right.displayIndex,
    );
    for (const post of byDisplay) {
      const normalized = normalizePostId(post.postId);
      if (normalized === null || order.includes(normalized)) {
        continue;
      }
      const index = clampInsertIndex(post.displayIndex, order.length);
      order.splice(index, 0, normalized);
    }
    target.shuffledOrder = order;
  }
  ensurePostsMedia(target);
  CollectionSchema.parse(target);
  save(data);
  return target;
}

/** Phase 2 HANDOFF: replaces `shuffledOrder` with a new permutation of the display order. */
export function shuffleCollection(collectionId: string): Collection | null {
  const data = reloadFromStorage();
  const target = findPlaylist(data, collectionId);
  if (target === null) {
    return null;
  }
  target.shuffledOrder = shufflePermutation(collectionDisplayOrder(target));
  ensurePostsMedia(target);
  CollectionSchema.parse(target);
  save(data);
  return target;
}

/** Phase 2 HANDOFF: `shuffledOrder: null` so {@link getCollectionOrder} follows `postIds`. */
export function resetCollectionOrder(collectionId: string): Collection | null {
  const data = reloadFromStorage();
  const target = findPlaylist(data, collectionId);
  if (target === null) {
    return null;
  }
  target.shuffledOrder = null;
  ensurePostsMedia(target);
  CollectionSchema.parse(target);
  save(data);
  return target;
}

/** Phase 2 HANDOFF: read-only display order. Null when the id is missing or not a posts collection. */
export function getCollectionOrder(collectionId: string): number[] | null {
  const target = findPlaylist(load(), collectionId);
  if (target === null) {
    return null;
  }
  return collectionDisplayOrder(target);
}

/**
 * Phase 2 HANDOFF: saved search. `query` is stored raw; `tags` are `parseTags(query)`
 * so existing search links keep working. Missing `query` on older rows means
 * `serialize(collection.tags)`.
 */
export function createDynamicCollection(name: string, query: string): Collection {
  const data = reloadFromStorage();
  const trimmedQuery = query.trim();
  const collection = CollectionSchema.parse({
    id: crypto.randomUUID(),
    name: name.trim(),
    tags: parseTags(trimmedQuery),
    kind: COLLECTION_KIND_SEARCH,
    query: trimmedQuery,
  });
  data.collections.push(collection);
  save(data);
  return collection;
}

/** Phase 2 HANDOFF: replaces `query` and `tags` on a saved search. Posts collections return null. */
export function updateDynamicQuery(
  collectionId: string,
  query: string,
): Collection | null {
  const data = reloadFromStorage();
  const target = data.collections.find((item) => item.id === collectionId);
  if (target === undefined || isPlaylist(target)) {
    return null;
  }
  const trimmedQuery = query.trim();
  target.query = trimmedQuery;
  target.tags = parseTags(trimmedQuery);
  target.kind = COLLECTION_KIND_SEARCH;
  CollectionSchema.parse(target);
  save(data);
  return target;
}

/** Thin wrapper over favs storage (keeps callers compiling). */
export function setPostFavMark(postId: string, fav: boolean): void {
  if (fav) {
    addFav(postId);
  } else {
    removeFav(postId);
  }
}

/** Thin wrapper over favs storage (keeps callers compiling). */
export function setPostFavMarks(postIds: string[], fav: boolean): void {
  if (postIds.length === 0) {
    return;
  }
  if (fav) {
    const ids: number[] = [];
    for (const postId of postIds) {
      const parsed = Number(postId);
      if (Number.isFinite(parsed)) {
        ids.push(Math.trunc(parsed));
      }
    }
    addFavs(ids);
    return;
  }
  for (const postId of postIds) {
    removeFav(postId);
  }
}

export function setPostSeenMark(postId: string): void {
  const data = load();
  const previous: MarkFlags = data.marks[postId] ?? {};
  data.marks[postId] = { ...previous, seen: true };
  save(data);
}

export function getGridFavButtonsEnabled(): boolean {
  return resolveGridFavButtons(load());
}

export function setGridFavButtonsEnabled(enabled: boolean): void {
  const data = load();
  data.settings = {
    ...currentSettings(data),
    gridFavButtons: enabled,
  };
  save(data);
}

export function getTweaksEnabled(): boolean {
  return resolveTweaksEnabled(load());
}

export function setTweaksEnabled(enabled: boolean): void {
  const data = load();
  data.settings = {
    ...currentSettings(data),
    tweaksEnabled: enabled,
  };
  save(data);
}

export function getFeatureEnabled(id: string, defaultEnabled: boolean): boolean {
  const stored = load().settings?.features?.[id];
  if (stored === undefined) {
    return defaultEnabled;
  }
  return stored;
}

export function setFeatureEnabled(id: string, enabled: boolean): void {
  const data = load();
  const settings = currentSettings(data);
  const features = { ...(settings.features ?? {}), [id]: enabled };
  data.settings = {
    ...settings,
    features,
  };
  save(data);
}

export function getFeatureChoiceValue(id: string): string | undefined {
  return load().settings?.featureChoice?.[id];
}

export function setFeatureChoiceValue(id: string, value: string): void {
  const data = load();
  const settings = currentSettings(data);
  const featureChoice = { ...(settings.featureChoice ?? {}), [id]: value };
  data.settings = {
    ...settings,
    featureChoice,
  };
  save(data);
}

export function getFeatureState(id: string): unknown {
  return load().settings?.featureState?.[id];
}

export function setFeatureState(id: string, value: unknown): void {
  const data = load();
  const settings = currentSettings(data);
  const featureState = { ...(settings.featureState ?? {}), [id]: value };
  data.settings = {
    ...settings,
    featureState,
  };
  save(data);
}

/**
 * Effective artists-per-search pack size for query building.
 * Stored 0 (default) means MAX_UPDATES_GROUP_SIZE; values above the max are capped.
 */
export function getUpdatesGroupSize(): number {
  const stored = resolveUpdatesGroupSize(load());
  if (!Number.isFinite(stored) || stored <= 0) {
    return MAX_UPDATES_GROUP_SIZE;
  }
  return Math.min(Math.floor(stored), MAX_UPDATES_GROUP_SIZE);
}

export function setUpdatesGroupSize(size: number): void {
  const data = load();
  let safeSize = Number.isFinite(size) && size >= 0 ? Math.floor(size) : 0;
  if (safeSize > MAX_UPDATES_GROUP_SIZE) {
    safeSize = MAX_UPDATES_GROUP_SIZE;
  }
  data.settings = {
    ...currentSettings(data),
    updatesGroupSize: safeSize,
  };
  save(data);
}

export function getPlaylistChunkSize(): number {
  return resolvePlaylistChunkSize(load());
}

export function setPlaylistChunkSize(size: number): void {
  const data = load();
  const safeSize =
    Number.isFinite(size) && size > 0
      ? Math.floor(size)
      : DEFAULT_PLAYLIST_CHUNK_SIZE;
  data.settings = {
    ...currentSettings(data),
    playlistChunkSize: safeSize,
  };
  save(data);
}

export function getAppearance(): Appearance {
  return resolveAppearance(load());
}

export function setAppearance(appearance: Appearance): Appearance {
  const parsed = AppearanceSchema.parse(appearance);
  const data = load();
  data.settings = {
    ...currentSettings(data),
    appearance: parsed,
  };
  save(data);
  return parsed;
}

/** Reads the background image data URL from its dedicated GM key. */
export function getAppearanceBackgroundDataUrl(): string | undefined {
  const raw = getGmGetValue()(APPEARANCE_BACKGROUND_KEY, undefined);
  if (typeof raw !== "string" || raw.length === 0) {
    return undefined;
  }
  return raw;
}

/**
 * Stores a background image data URL in a dedicated GM key.
 * Rejects payloads larger than APPEARANCE_BACKGROUND_MAX_BYTES.
 */
export function setAppearanceBackgroundDataUrl(dataUrl: string): void {
  if (byteLengthUtf8(dataUrl) > APPEARANCE_BACKGROUND_MAX_BYTES) {
    throw new Error(APPEARANCE_BACKGROUND_TOO_LARGE);
  }
  getGmSetValue()(APPEARANCE_BACKGROUND_KEY, dataUrl);
}

export function clearAppearanceBackgroundDataUrl(): void {
  getGmSetValue()(APPEARANCE_BACKGROUND_KEY, "");
}

export function createDefaultAppearanceSettings(): Appearance {
  return createDefaultAppearance();
}

export function getSeenPostId(): number {
  return resolveSeenPostId(load());
}

export function setSeenPostId(seenPostId: number): void {
  const data = load();
  const safeId =
    Number.isFinite(seenPostId) && seenPostId >= 0
      ? Math.floor(seenPostId)
      : DEFAULT_SEEN_POST_ID;
  data.updates = { seenPostId: safeId };
  save(data);
}

/**
 * Followed artist tags from a fresh GM read (not the in-memory snapshot).
 * Feed href / recognition and Follow/Unfollow must not diverge across pages.
 */
export function listArtistTags(): string[] {
  return reloadFromStorage().artists.map((entry) => entry.tag);
}

export function isFollowingArtist(tag: string): boolean {
  const normalized = normalizeArtistTag(tag);
  if (normalized === null) {
    return false;
  }
  return listArtistTags().includes(normalized);
}

export function addArtist(tag: string): ArtistEntry {
  const normalized = normalizeArtistTag(tag);
  if (normalized === null) {
    throw new Error("Invalid artist tag");
  }
  const data = reloadFromStorage();
  if (data.artists.some((entry) => entry.tag === normalized)) {
    throw new Error("Duplicate artist tag");
  }
  const entry = ArtistEntrySchema.parse({ tag: normalized });
  data.artists.push(entry);
  save(data);
  return entry;
}

export function removeArtist(tag: string): boolean {
  const normalized = normalizeArtistTag(tag);
  if (normalized === null) {
    return false;
  }
  const data = reloadFromStorage();
  const next = data.artists.filter((entry) => entry.tag !== normalized);
  if (next.length === data.artists.length) {
    return false;
  }
  data.artists = next;
  save(data);
  return true;
}

export function exportJson(): string {
  const data = load();
  const favIds = Array.from(loadFavSet()).sort((a, b) => a - b);
  const blob: ExportBlob = {
    ...data,
    favIds,
  };
  return `${JSON.stringify(blob, null, 2)}\n`;
}

function mergeCollections(
  current: Collection[],
  incoming: Collection[],
): Collection[] {
  const byId = new Map<string, Collection>();
  for (const item of current) {
    byId.set(item.id, item);
  }
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

function mergeArtists(
  current: StorageData["artists"],
  incoming: StorageData["artists"],
): StorageData["artists"] {
  const byTag = new Map<string, ArtistEntry>();
  for (const item of current) {
    byTag.set(item.tag, item);
  }
  for (const item of incoming) {
    byTag.set(item.tag, item);
  }
  return Array.from(byTag.values());
}

function mergeStringRecord(
  current: Record<string, string> | undefined,
  incoming: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (incoming === undefined && current === undefined) {
    return undefined;
  }
  return {
    ...(current ?? {}),
    ...(incoming ?? {}),
  };
}

function mergeBooleanRecord(
  current: Record<string, boolean> | undefined,
  incoming: Record<string, boolean> | undefined,
): Record<string, boolean> | undefined {
  if (incoming === undefined && current === undefined) {
    return undefined;
  }
  return {
    ...(current ?? {}),
    ...(incoming ?? {}),
  };
}

function mergeUnknownRecord(
  current: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (incoming === undefined && current === undefined) {
    return undefined;
  }
  return {
    ...(current ?? {}),
    ...(incoming ?? {}),
  };
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

function mergeSettings(
  current: StorageData["settings"],
  incoming: StorageData["settings"],
): StorageData["settings"] {
  if (incoming === undefined) {
    return current;
  }
  if (current === undefined) {
    return incoming;
  }
  const merged: Settings = {
    gridFavButtons: incoming.gridFavButtons,
    updatesGroupSize:
      incoming.updatesGroupSize ?? current.updatesGroupSize,
    playlistChunkSize:
      incoming.playlistChunkSize ?? current.playlistChunkSize,
  };
  if (incoming.tweaksEnabled !== undefined) {
    merged.tweaksEnabled = incoming.tweaksEnabled;
  } else if (current.tweaksEnabled !== undefined) {
    merged.tweaksEnabled = current.tweaksEnabled;
  }
  const features = mergeBooleanRecord(current.features, incoming.features);
  if (features !== undefined) {
    merged.features = features;
  }
  const featureChoice = mergeStringRecord(
    current.featureChoice,
    incoming.featureChoice,
  );
  if (featureChoice !== undefined) {
    merged.featureChoice = featureChoice;
  }
  const featureState = mergeUnknownRecord(
    current.featureState,
    incoming.featureState,
  );
  if (featureState !== undefined) {
    merged.featureState = featureState;
  }
  if (incoming.appearance !== undefined) {
    merged.appearance = incoming.appearance;
  } else if (current.appearance !== undefined) {
    merged.appearance = current.appearance;
  }
  return merged;
}

function mergeUpdates(
  current: StorageData["updates"],
  incoming: StorageData["updates"],
): StorageData["updates"] {
  const currentSeen = current?.seenPostId ?? DEFAULT_SEEN_POST_ID;
  const incomingSeen = incoming?.seenPostId ?? DEFAULT_SEEN_POST_ID;
  return { seenPostId: Math.max(currentSeen, incomingSeen) };
}

export function importJson(raw: string): StorageData {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    throw new Error(message);
  }
  const parsed = ExportBlobSchema.safeParse(json);
  if (!parsed.success) {
    throw formatSchemaImportError(parsed.error);
  }
  const incoming = parsed.data;
  const fromMarks = extractFavIdsFromMarks(incoming.marks);
  const favIdsToMerge = new Set<number>(fromMarks.favIds);
  if (incoming.favIds !== undefined) {
    for (const id of incoming.favIds) {
      favIdsToMerge.add(id);
    }
  }
  const current = load();
  const merged: StorageData = {
    version: current.version,
    collections: mergeCollections(current.collections, incoming.collections),
    artists: mergeArtists(current.artists, incoming.artists),
    marks: mergeMarks(current.marks, fromMarks.marks),
    settings: mergeSettings(current.settings, incoming.settings),
    updates: mergeUpdates(current.updates, incoming.updates),
  };
  if (merged.settings === undefined) {
    merged.settings = {
      gridFavButtons: DEFAULT_GRID_FAV_BUTTONS,
      updatesGroupSize: DEFAULT_UPDATES_GROUP_SIZE,
      playlistChunkSize: DEFAULT_PLAYLIST_CHUNK_SIZE,
      tweaksEnabled: DEFAULT_TWEAKS_ENABLED,
    };
  }
  save(merged);
  addFavs(Array.from(favIdsToMerge));
  return merged;
}
