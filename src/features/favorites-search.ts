import { titleSaysVideo } from "../site/video-thumbs";
import type { FavoriteIndexEntry } from "../storage/favorites-index";

/**
 * Search over the local index of favorites. Pure: no storage, no page.
 *
 * A query is tags separated by spaces. Every tag must be on the post; a tag
 * with a leading minus must not be. A star stands for any run of characters:
 * `cat*` finds `cat`, `catgirl`, `cat_ears`.
 */

export const MEDIA_ALL = "all";
export const MEDIA_IMAGES = "images";
export const MEDIA_VIDEOS = "videos";
export type FavoritesMedia = typeof MEDIA_ALL | typeof MEDIA_IMAGES | typeof MEDIA_VIDEOS;

export type FavoritesQuery = {
  readonly include: readonly RegExp[];
  readonly exclude: readonly RegExp[];
};

const TERM_SEPARATOR = /\s+/;
const EXCLUDE_PREFIX = "-";
const WILDCARD = "*";
const REGEXP_SPECIAL = /[.+?^${}()|[\]\\]/g;

function termPattern(term: string): RegExp {
  const body = term
    .split(WILDCARD)
    .map((part) => part.replace(REGEXP_SPECIAL, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}$`);
}

export function isFavoritesMedia(value: string): value is FavoritesMedia {
  return value === MEDIA_ALL || value === MEDIA_IMAGES || value === MEDIA_VIDEOS;
}

/** Parses what was typed. Case does not matter: the site's tags are lower case. */
export function parseFavoritesQuery(text: string): FavoritesQuery {
  const include: RegExp[] = [];
  const exclude: RegExp[] = [];
  for (const raw of text.toLowerCase().split(TERM_SEPARATOR)) {
    if (raw.length === 0) {
      continue;
    }
    if (raw.startsWith(EXCLUDE_PREFIX)) {
      const term = raw.slice(EXCLUDE_PREFIX.length);
      if (term.length > 0) {
        exclude.push(termPattern(term));
      }
      continue;
    }
    include.push(termPattern(raw));
  }
  return { include, exclude };
}

export function isEmptyFavoritesQuery(query: FavoritesQuery): boolean {
  return query.include.length === 0 && query.exclude.length === 0;
}

function hasTag(tags: readonly string[], pattern: RegExp): boolean {
  return tags.some((tag) => pattern.test(tag));
}

function matchesQuery(tags: readonly string[], query: FavoritesQuery): boolean {
  return (
    query.include.every((pattern) => hasTag(tags, pattern)) &&
    !query.exclude.some((pattern) => hasTag(tags, pattern))
  );
}

function matchesMedia(entry: FavoriteIndexEntry, media: FavoritesMedia): boolean {
  if (media === MEDIA_ALL) {
    return true;
  }
  return titleSaysVideo(entry.tags) === (media === MEDIA_VIDEOS);
}

/**
 * The favorites that match, in the site's order: the newest favorite first.
 * A post that is no longer a favorite is left out even while the index still
 * holds it.
 */
export function filterFavoriteIndex(
  entries: readonly FavoriteIndexEntry[],
  favoriteIds: ReadonlySet<number>,
  query: FavoritesQuery,
  media: FavoritesMedia,
): FavoriteIndexEntry[] {
  const matched = entries.filter(
    (entry) =>
      favoriteIds.has(entry.id) &&
      matchesMedia(entry, media) &&
      matchesQuery(entry.tags.split(TERM_SEPARATOR), query),
  );
  return matched.sort((a, b) => b.run - a.run || a.pos - b.pos || b.id - a.id);
}

/** The most frequent tags among the favorites, most frequent first. */
export type TagCount = { readonly tag: string; readonly count: number };

export function topFavoriteTags(
  entries: readonly FavoriteIndexEntry[],
  favoriteIds: ReadonlySet<number>,
  limit: number,
): TagCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!favoriteIds.has(entry.id)) {
      continue;
    }
    for (const tag of new Set(entry.tags.split(TERM_SEPARATOR))) {
      if (tag.length > 0) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

const SEED_STEP = 0x6d2b79f5;
const UINT32_RANGE = 4294967296;

/** A repeatable random order: the same seed gives the same order. */
export function shuffleBySeed<T>(items: readonly T[], seed: number): T[] {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + SEED_STEP) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(next() * (index + 1));
    const held = shuffled[index];
    const swapped = shuffled[other];
    if (held !== undefined && swapped !== undefined) {
      shuffled[index] = swapped;
      shuffled[other] = held;
    }
  }
  return shuffled;
}
