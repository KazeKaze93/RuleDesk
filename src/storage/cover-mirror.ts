import * as z from "zod/mini";

import { log } from "../log";

/** localStorage key for dynamic-collection covers, keyed by collection id. */
export const COVER_MIRROR_KEY = "ruledesk-web.covers-mirror";

const CoverMirrorSchema = z.record(z.string(), z.array(z.string()));

type CoverMirror = Record<string, string[]>;

/**
 * Covers are written on a results page and read on the Collections page.
 * Coming back with the browser Back button restores that page from bfcache,
 * where the userscript storage can still hold the old value; localStorage is
 * shared and current, so the card reads the cover from here first.
 */
function readAll(): CoverMirror {
  try {
    const raw = localStorage.getItem(COVER_MIRROR_KEY);
    if (raw === null) {
      return {};
    }
    const parsed = CoverMirrorSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch (error) {
    log.error("cover-mirror: read failed", error);
    return {};
  }
}

function writeAll(mirror: CoverMirror): void {
  try {
    localStorage.setItem(COVER_MIRROR_KEY, JSON.stringify(mirror));
  } catch (error) {
    log.error("cover-mirror: write failed", error);
  }
}

/** Mirrored cover of one collection, or null when none is stored. */
export function readCoverMirror(collectionId: string): readonly string[] | null {
  const cover = readAll()[collectionId];
  return cover === undefined ? null : cover;
}

/** Stores one cover and drops entries of collections that no longer exist. */
export function writeCoverMirror(
  collectionId: string,
  cover: readonly string[],
  knownIds: readonly string[],
): void {
  const current = readAll();
  const next: CoverMirror = {};
  for (const id of knownIds) {
    const kept = current[id];
    if (kept !== undefined) {
      next[id] = kept;
    }
  }
  next[collectionId] = [...cover];
  writeAll(next);
}

/** Forgets the cover of one collection (query changed, collection deleted). */
export function removeCoverMirror(collectionId: string): void {
  const current = readAll();
  if (current[collectionId] === undefined) {
    return;
  }
  const next: CoverMirror = {};
  for (const [id, cover] of Object.entries(current)) {
    if (id !== collectionId) {
      next[id] = cover;
    }
  }
  writeAll(next);
}

/** Removes the mirror key (tests / reset). */
export function clearCoverMirror(): void {
  try {
    localStorage.removeItem(COVER_MIRROR_KEY);
  } catch (error) {
    log.error("cover-mirror: clear failed", error);
  }
}

/** localStorage key for dynamic-collection post counts, keyed by collection id. */
export const COUNT_MIRROR_KEY = "ruledesk-web.counts-mirror";

const CountSchema = z.object({ value: z.int(), exact: z.boolean() });
const CountMirrorSchema = z.record(z.string(), CountSchema);

type CountEntry = z.infer<typeof CountSchema>;
type CountMirror = Record<string, CountEntry>;

function readAllCounts(): CountMirror {
  try {
    const raw = localStorage.getItem(COUNT_MIRROR_KEY);
    if (raw === null) {
      return {};
    }
    const parsed = CountMirrorSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch (error) {
    log.error("count-mirror: read failed", error);
    return {};
  }
}

function writeAllCounts(mirror: CountMirror): void {
  try {
    localStorage.setItem(COUNT_MIRROR_KEY, JSON.stringify(mirror));
  } catch (error) {
    log.error("count-mirror: write failed", error);
  }
}

/** Mirrored post count of one collection, or null when none is stored. */
export function readCountMirror(collectionId: string): CountEntry | null {
  const count = readAllCounts()[collectionId];
  return count === undefined ? null : count;
}

/** Stores one count and drops entries of collections that no longer exist. */
export function writeCountMirror(
  collectionId: string,
  count: CountEntry,
  knownIds: readonly string[],
): void {
  const current = readAllCounts();
  const next: CountMirror = {};
  for (const id of knownIds) {
    const kept = current[id];
    if (kept !== undefined) {
      next[id] = kept;
    }
  }
  next[collectionId] = { value: count.value, exact: count.exact };
  writeAllCounts(next);
}

/** Forgets the count of one collection (query changed, collection deleted). */
export function removeCountMirror(collectionId: string): void {
  const current = readAllCounts();
  if (current[collectionId] === undefined) {
    return;
  }
  const next: CountMirror = {};
  for (const [id, count] of Object.entries(current)) {
    if (id !== collectionId) {
      next[id] = count;
    }
  }
  writeAllCounts(next);
}

/** Removes the count mirror key (tests / reset). */
export function clearCountMirror(): void {
  try {
    localStorage.removeItem(COUNT_MIRROR_KEY);
  } catch (error) {
    log.error("count-mirror: clear failed", error);
  }
}
