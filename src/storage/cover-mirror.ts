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
/*
 * The text last read from the page's storage and what it parsed to. Every
 * card of the Collections page asks for its cover and its count at every
 * redraw, a redraw at every key typed into the filter: the same text was
 * parsed and checked twice for each card. The text itself is still read each
 * time, so a change made by another page is seen at once.
 */
let coverText: string | null = null;
let coverParsed: CoverMirror = {};
let countText: string | null = null;
let countParsed: CountMirror = {};

function readAll(): CoverMirror {
  try {
    const raw = localStorage.getItem(COVER_MIRROR_KEY);
    if (raw === null) {
      return {};
    }
    if (raw === coverText) {
      return coverParsed;
    }
    const parsed = CoverMirrorSchema.safeParse(JSON.parse(raw));
    coverText = raw;
    coverParsed = parsed.success ? parsed.data : {};
    return coverParsed;
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
  // An id may be a word every object has ("constructor"): only what is stored counts.
  const all = readAll();
  const cover = Object.hasOwn(all, collectionId) ? all[collectionId] : undefined;
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
    const kept = Object.hasOwn(current, id) ? current[id] : undefined;
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
  if (!Object.hasOwn(current, collectionId)) {
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
    if (raw === countText) {
      return countParsed;
    }
    const parsed = CountMirrorSchema.safeParse(JSON.parse(raw));
    countText = raw;
    countParsed = parsed.success ? parsed.data : {};
    return countParsed;
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
  const all = readAllCounts();
  const count = Object.hasOwn(all, collectionId) ? all[collectionId] : undefined;
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
    const kept = Object.hasOwn(current, id) ? current[id] : undefined;
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
  if (!Object.hasOwn(current, collectionId)) {
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
