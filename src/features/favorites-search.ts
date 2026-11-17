import { titleSaysVideo } from "../site/video-thumbs";
import type { FavoriteIndexEntry } from "../storage/favorites-index";
import { END_CUT, END_WHOLE, restoreFavoriteTags, type FavoriteTags } from "./favorites-tags";

/**
 * Search over the local index of favorites. Pure: no storage, no page.
 *
 * A query is written the way the site's own search is, as far as the index
 * can answer it. The index knows the tags of a favorite and its id, nothing
 * else, so:
 *
 * - `cat dog`: every tag must be on the post;
 * - `-cat`: the tag must not be;
 * - `ca*t`: a star stands for any run of characters;
 * - `( cat ~ dog )`: at least one tag of the group must be on the post; the
 *   spaces around the brackets matter, as on the site, because a tag may end
 *   in a bracket;
 * - `sort:id:asc`, `sort:id:desc`: the order.
 *
 * A random order is the Shuffle button of the page, and only that: one way to
 * do it, and one that shows whether it is on. `sort:random` is therefore not
 * taken here.
 *
 * The site's other metatags (`rating:`, `score:`, `user:`, sizes, the other
 * sorts) and the fuzzy `tag~` ask for what the index does not hold. They are
 * not searched as tags, which would find nothing: they are set aside in
 * `unsupported`, for the page to say so.
 */

export const MEDIA_ALL = "all";
export const MEDIA_IMAGES = "images";
export const MEDIA_VIDEOS = "videos";
export type FavoritesMedia = typeof MEDIA_ALL | typeof MEDIA_IMAGES | typeof MEDIA_VIDEOS;

export const SORT_ID_ASC = "id-asc";
export const SORT_ID_DESC = "id-desc";
export type FavoritesSort = typeof SORT_ID_ASC | typeof SORT_ID_DESC;

/**
 * One term of a query, ready to be tried on the tags of a favorite.
 *
 * The index is filled from the favorites pages, where the site cuts the first
 * and the last character off the tag list (see favorites-tags.ts, which puts
 * most of those ends right). For an end that could not be restored the term
 * is also kept without its first character, without its last, and without
 * both, to be tried on the tag at that place.
 */
export type TagPattern = {
  readonly whole: RegExp;
  readonly noFirst: RegExp;
  readonly noLast: RegExp;
  readonly noEnds: RegExp;
};

export type FavoritesQuery = {
  readonly include: readonly TagPattern[];
  readonly exclude: readonly TagPattern[];
  /** Groups of "or": a post needs at least one tag of every group. */
  readonly anyOf: readonly (readonly TagPattern[])[];
  /** The order asked for, or null for the site's order. */
  readonly sort: FavoritesSort | null;
  /** Terms the index cannot answer, as they were typed. */
  readonly unsupported: readonly string[];
};

const TERM_SEPARATOR = /\s+/;
const EXCLUDE_PREFIX = "-";
const WILDCARD = "*";
const GROUP_OPEN = "(";
const GROUP_CLOSE = ")";
const GROUP_OR = "~";
const FUZZY_SUFFIX = "~";
const META_SEPARATOR = ":";
const SORT_PREFIX = "sort";
const SORTS: ReadonlyMap<string, FavoritesSort> = new Map([
  ["sort:id:asc", SORT_ID_ASC],
  ["sort:id:desc", SORT_ID_DESC],
  ["sort:id", SORT_ID_DESC],
]);
/**
 * The names of the site's metatags. Only these are taken for metatags: a
 * colon alone does not make one, tags such as `re:zero` have it too.
 */
const META_NAMES: ReadonlySet<string> = new Set([
  SORT_PREFIX,
  "user",
  "md5",
  "rating",
  "parent",
  "width",
  "height",
  "score",
  "aspectratio",
  "aspectratiof",
  "sourcedomains",
  "source",
  "id",
]);
const REGEXP_SPECIAL = /[.+?^${}()|[\]\\]/g;

function wholeTag(term: string): RegExp {
  const body = term
    .split(WILDCARD)
    .map((part) => part.replace(REGEXP_SPECIAL, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}$`);
}

/** A star at an end already stands for the cut character: nothing is taken off there. */
function termPattern(term: string): TagPattern {
  const first = term.startsWith(WILDCARD) ? term : term.slice(1);
  const last = term.endsWith(WILDCARD) ? term : term.slice(0, -1);
  const ends = term.endsWith(WILDCARD) ? first : first.slice(0, -1);
  return {
    whole: wholeTag(term),
    noFirst: wholeTag(first),
    noLast: wholeTag(last),
    noEnds: wholeTag(ends),
  };
}

export function isFavoritesMedia(value: string): value is FavoritesMedia {
  return value === MEDIA_ALL || value === MEDIA_IMAGES || value === MEDIA_VIDEOS;
}

function isMetatag(term: string): boolean {
  const at = term.indexOf(META_SEPARATOR);
  return at > 0 && META_NAMES.has(term.slice(0, at));
}

/** Parses what was typed. Case does not matter: the site's tags are lower case. */
export function parseFavoritesQuery(text: string): FavoritesQuery {
  const include: TagPattern[] = [];
  const exclude: TagPattern[] = [];
  const anyOf: TagPattern[][] = [];
  const unsupported: string[] = [];
  let sort: FavoritesSort | null = null;
  // The tags of the group being read, or null outside a group.
  let group: TagPattern[] | null = null;

  for (const raw of text.toLowerCase().split(TERM_SEPARATOR)) {
    if (raw.length === 0) {
      continue;
    }
    if (group !== null) {
      if (raw === GROUP_CLOSE) {
        if (group.length > 0) {
          anyOf.push(group);
        }
        group = null;
      } else if (raw !== GROUP_OR) {
        group.push(termPattern(raw));
      }
      continue;
    }
    if (raw === GROUP_OPEN) {
      group = [];
      continue;
    }
    const negated = raw.startsWith(EXCLUDE_PREFIX);
    const term = negated ? raw.slice(EXCLUDE_PREFIX.length) : raw;
    if (term.length === 0) {
      continue;
    }
    if (isMetatag(term)) {
      const known = negated ? undefined : SORTS.get(term);
      if (known === undefined) {
        unsupported.push(raw);
      } else {
        sort = known;
      }
      continue;
    }
    if (term.endsWith(FUZZY_SUFFIX)) {
      unsupported.push(raw);
      continue;
    }
    (negated ? exclude : include).push(termPattern(term));
  }
  // A group that was not closed still counts: the query is being typed.
  if (group !== null && group.length > 0) {
    anyOf.push(group);
  }
  return { include, exclude, anyOf, sort, unsupported };
}

/** True when the query neither narrows the list nor orders it. */
export function isEmptyFavoritesQuery(query: FavoritesQuery): boolean {
  return (
    query.include.length === 0 &&
    query.exclude.length === 0 &&
    query.anyOf.length === 0 &&
    query.sort === null
  );
}

function hasTag(entry: FavoriteTags, pattern: TagPattern): boolean {
  const tags = entry.tagList;
  const lastAt = tags.length - 1;
  return tags.some((tag, at) => {
    // The tag as it stands is always tried: even an end that looks cut may be
    // a rare whole tag. The cut spellings are tried on an end not known whole.
    if (pattern.whole.test(tag)) {
      return true;
    }
    const firstOpen = at === 0 && entry.firstEnd !== END_WHOLE;
    const lastOpen = at === lastAt && entry.lastEnd !== END_WHOLE;
    return (
      (firstOpen && pattern.noFirst.test(tag)) ||
      (lastOpen && pattern.noLast.test(tag)) ||
      (firstOpen && lastOpen && pattern.noEnds.test(tag))
    );
  });
}

function matchesQuery(entry: FavoriteTags, query: FavoritesQuery): boolean {
  return (
    query.include.every((pattern) => hasTag(entry, pattern)) &&
    !query.exclude.some((pattern) => hasTag(entry, pattern)) &&
    query.anyOf.every((group) => group.some((pattern) => hasTag(entry, pattern)))
  );
}

function matchesMedia(entry: FavoriteIndexEntry, media: FavoritesMedia): boolean {
  if (media === MEDIA_ALL) {
    return true;
  }
  return titleSaysVideo(entry.tags) === (media === MEDIA_VIDEOS);
}

/**
 * The favorites that match, in the site's order (the newest favorite first)
 * or by post id when the query asks for that. A post that is no longer a
 * favorite is left out even while the index still holds it.
 */
export function filterFavoriteIndex(
  entries: readonly FavoriteIndexEntry[],
  favoriteIds: ReadonlySet<number>,
  query: FavoritesQuery,
  media: FavoritesMedia,
): FavoriteIndexEntry[] {
  const matched: FavoriteIndexEntry[] = restoreFavoriteTags(entries).filter(
    (entry) =>
      favoriteIds.has(entry.id) && matchesMedia(entry, media) && matchesQuery(entry, query),
  );
  if (query.sort === SORT_ID_ASC) {
    return matched.sort((a, b) => a.id - b.id);
  }
  if (query.sort === SORT_ID_DESC) {
    return matched.sort((a, b) => b.id - a.id);
  }
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
  for (const entry of restoreFavoriteTags(entries)) {
    if (!favoriteIds.has(entry.id)) {
      continue;
    }
    const lastAt = entry.tagList.length - 1;
    // A tag still cut at an end is not a tag to count: it would stand in the
    // list beside its whole spelling.
    const whole = entry.tagList.filter(
      (_tag, at) =>
        !(at === 0 && entry.firstEnd === END_CUT) && !(at === lastAt && entry.lastEnd === END_CUT),
    );
    for (const tag of new Set(whole)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
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
