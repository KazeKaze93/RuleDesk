import {
  EXCLUDE_PREFIX,
  PLAYLIST_ID_PREFIX,
  SEARCH_PAGE,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PARAM_TAGS,
  SEARCH_PATH,
  SEARCH_SECTION,
  SITE_ORIGIN,
  TAG_SEPARATOR,
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
  UPDATES_ID_PREFIX,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
  UPDATES_OR_OPEN,
  URL_TAG_SEPARATOR,
} from "../config/constants";
import type { TagEntry } from "../storage/schema";

const UPDATES_ID_TOKEN_PATTERN = /^id:>(\d+)$/;
const PLAYLIST_ID_TOKEN_PATTERN = /^id:(\d+)$/;

export function normalizeArtistTag(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }
  const withUnderscores = trimmed.replaceAll(" ", "_");
  if (/\s/.test(withUnderscores)) {
    return null;
  }
  if (
    withUnderscores === UPDATES_OR_OPEN ||
    withUnderscores === UPDATES_OR_CLOSE ||
    withUnderscores === UPDATES_OR_JOIN
  ) {
    return null;
  }
  if (withUnderscores.startsWith(EXCLUDE_PREFIX)) {
    return null;
  }
  if (withUnderscores.length === 0) {
    return null;
  }
  return withUnderscores;
}

export function parseTags(raw: string): TagEntry[] {
  const tokens = raw.trim().split(/\s+/).filter((token) => token.length > 0);
  return tokens.map((token) => {
    if (token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length) {
      return {
        tag: token.slice(EXCLUDE_PREFIX.length),
        type: TAG_TYPE_EXCLUDE,
      };
    }
    return {
      tag: token,
      type: TAG_TYPE_INCLUDE,
    };
  });
}

export function serialize(tags: TagEntry[]): string {
  return tags
    .map((entry) =>
      entry.type === TAG_TYPE_EXCLUDE
        ? `${EXCLUDE_PREFIX}${entry.tag}`
        : entry.tag,
    )
    .join(TAG_SEPARATOR);
}

function encodeSearchToken(raw: string): string {
  // encodeURIComponent leaves () unescaped; rule34 encodes them as %28/%29.
  return encodeURIComponent(raw).replaceAll("(", "%28").replaceAll(")", "%29");
}

export function buildSearchUrl(tags: TagEntry[]): string {
  const encoded = tags
    .map((entry) => {
      const raw =
        entry.type === TAG_TYPE_EXCLUDE
          ? `${EXCLUDE_PREFIX}${entry.tag}`
          : entry.tag;
      return encodeSearchToken(raw);
    })
    .join(URL_TAG_SEPARATOR);

  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, SEARCH_PAGE);
  params.set(SEARCH_PARAM_SECTION, SEARCH_SECTION);
  const query = params.toString();
  return `${SITE_ORIGIN}${SEARCH_PATH}?${query}&${SEARCH_PARAM_TAGS}=${encoded}`;
}

export function readTagsFromLocation(search: string): TagEntry[] | null {
  const params = new URLSearchParams(search);
  const page = params.get(SEARCH_PARAM_PAGE);
  const section = params.get(SEARCH_PARAM_SECTION);
  const tagsRaw = params.get(SEARCH_PARAM_TAGS);
  if (page !== SEARCH_PAGE || section !== SEARCH_SECTION) {
    return null;
  }
  if (tagsRaw === null || tagsRaw.trim().length === 0) {
    return null;
  }
  return parseTags(tagsRaw);
}

function formatGroupQuery(tags: string[]): string {
  if (tags.length === 1) {
    const only = tags[0];
    return only === undefined ? "" : only;
  }
  return `${UPDATES_OR_OPEN} ${tags.join(` ${UPDATES_OR_JOIN} `)} ${UPDATES_OR_CLOSE}`;
}

export function buildUpdatesQueries(
  artistTags: string[],
  seenPostId: number,
  groupSize: number,
): string[] {
  const normalized: string[] = [];
  for (const raw of artistTags) {
    const tag = normalizeArtistTag(raw);
    if (tag !== null) {
      normalized.push(tag);
    }
  }
  if (normalized.length === 0) {
    return [];
  }

  const groups: string[][] = [];
  if (groupSize <= 0) {
    groups.push(normalized);
  } else {
    for (let index = 0; index < normalized.length; index += groupSize) {
      groups.push(normalized.slice(index, index + groupSize));
    }
  }

  return groups.map((group) => {
    const base = formatGroupQuery(group);
    if (seenPostId > 0) {
      return `${base} ${UPDATES_ID_PREFIX}${String(seenPostId)}`;
    }
    return base;
  });
}

export function buildUpdatesSearchUrl(query: string): string {
  return buildSearchUrl(parseTags(query));
}

/**
 * First artist OR-group without an id:> token (single tag, no parentheses, if one artist).
 */
export function buildFeedQuery(
  artistTags: string[],
  groupSize: number,
): string {
  const groups = buildUpdatesQueries(artistTags, 0, groupSize);
  const first = groups[0];
  return first === undefined ? "" : first;
}

/** Search URL for the first feed group of followed artists. */
export function buildFeedUrl(
  artistTags: string[],
  groupSize: number,
): string {
  const query = buildFeedQuery(artistTags, groupSize);
  if (query.length === 0) {
    return buildSearchUrl([]);
  }
  return buildUpdatesSearchUrl(query);
}

export function stripUpdatesIdFilter(tagsParam: string): string {
  const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return "";
  }
  const last = tokens[tokens.length - 1];
  if (last !== undefined && UPDATES_ID_TOKEN_PATTERN.test(last)) {
    return tokens.slice(0, -1).join(TAG_SEPARATOR);
  }
  return tokens.join(TAG_SEPARATOR);
}

type ParsedUpdatesQuery = {
  tags: string[];
  hasIdFilter: boolean;
};

function trackedArtistSet(artistTags: string[]): Set<string> {
  const tracked = new Set<string>();
  for (const raw of artistTags) {
    const tag = normalizeArtistTag(raw);
    if (tag !== null) {
      tracked.add(tag);
    }
  }
  return tracked;
}

function parseUpdatesArtistQuery(
  tagsParam: string,
  tracked: Set<string>,
): ParsedUpdatesQuery | null {
  if (tracked.size === 0) {
    return null;
  }

  const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return null;
  }

  let body = tokens;
  let hasIdFilter = false;
  const last = tokens[tokens.length - 1];
  if (last !== undefined && UPDATES_ID_TOKEN_PATTERN.test(last)) {
    body = tokens.slice(0, -1);
    hasIdFilter = true;
  }
  if (body.some((token) => UPDATES_ID_TOKEN_PATTERN.test(token))) {
    return null;
  }
  if (body.length === 0) {
    return null;
  }

  const tags: string[] = [];

  if (body.length === 1) {
    const only = body[0];
    if (only === undefined) {
      return null;
    }
    const tag = normalizeArtistTag(only);
    if (tag === null || !tracked.has(tag)) {
      return null;
    }
    tags.push(tag);
    return { tags, hasIdFilter };
  }

  const first = body[0];
  const lastBody = body[body.length - 1];
  if (first !== UPDATES_OR_OPEN || lastBody !== UPDATES_OR_CLOSE) {
    return null;
  }
  const inner = body.slice(1, -1);
  if (inner.length === 0 || inner.length % 2 === 0) {
    return null;
  }

  for (let index = 0; index < inner.length; index += 1) {
    const token = inner[index];
    if (token === undefined) {
      return null;
    }
    if (index % 2 === 1) {
      if (token !== UPDATES_OR_JOIN) {
        return null;
      }
      continue;
    }
    const tag = normalizeArtistTag(token);
    if (tag === null || !tracked.has(tag)) {
      return null;
    }
    if (tags.includes(tag)) {
      return null;
    }
    tags.push(tag);
  }

  return { tags, hasIdFilter };
}

function isExactTrackedSet(tags: string[], tracked: Set<string>): boolean {
  if (tags.length !== tracked.size) {
    return false;
  }
  for (const tag of tags) {
    if (!tracked.has(tag)) {
      return false;
    }
  }
  return true;
}

export function isFullUpdatesQuery(
  tagsParam: string,
  artistTags: string[],
): boolean {
  const tracked = trackedArtistSet(artistTags);
  const parsed = parseUpdatesArtistQuery(tagsParam, tracked);
  if (parsed === null) {
    return false;
  }
  return isExactTrackedSet(parsed.tags, tracked);
}

export function isPartialUpdatesQuery(
  tagsParam: string,
  artistTags: string[],
): boolean {
  const tracked = trackedArtistSet(artistTags);
  const parsed = parseUpdatesArtistQuery(tagsParam, tracked);
  if (parsed === null) {
    return false;
  }
  if (!parsed.hasIdFilter) {
    return false;
  }
  if (isExactTrackedSet(parsed.tags, tracked)) {
    return false;
  }
  return parsed.tags.length > 0 && parsed.tags.length < tracked.size;
}

function formatPlaylistIdToken(postId: number): string {
  return `${PLAYLIST_ID_PREFIX}${String(postId)}`;
}

function formatPlaylistChunkQuery(ids: number[]): string {
  if (ids.length === 1) {
    const only = ids[0];
    return only === undefined ? "" : formatPlaylistIdToken(only);
  }
  const tokens = ids.map(formatPlaylistIdToken);
  return `${UPDATES_OR_OPEN} ${tokens.join(` ${UPDATES_OR_JOIN} `)} ${UPDATES_OR_CLOSE}`;
}

/**
 * Builds playlist search queries: ids descending, chunked by `chunkSize`.
 * One id → `id:N`; multiple → `( id:A ~ id:B ~ ... )`.
 * `chunkSize <= 0` keeps all ids in a single query.
 */
export function buildPlaylistQueries(
  postIds: number[],
  chunkSize: number,
): string[] {
  const unique = new Set<number>();
  for (const raw of postIds) {
    if (!Number.isFinite(raw)) {
      continue;
    }
    const id = Math.trunc(raw);
    if (id >= 0) {
      unique.add(id);
    }
  }
  const sorted = Array.from(unique).sort((a, b) => b - a);
  if (sorted.length === 0) {
    return [];
  }

  const chunks: number[][] = [];
  if (chunkSize <= 0) {
    chunks.push(sorted);
  } else {
    for (let index = 0; index < sorted.length; index += chunkSize) {
      chunks.push(sorted.slice(index, index + chunkSize));
    }
  }
  return chunks.map(formatPlaylistChunkQuery);
}

/**
 * Parses a playlist id-query produced by `buildPlaylistQueries`.
 * Returns null when any non-playlist token is present.
 */
export function parsePlaylistQuery(tagsParam: string): number[] | null {
  const tokens = tagsParam
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return null;
  }

  if (tokens.length === 1) {
    const only = tokens[0];
    if (only === undefined) {
      return null;
    }
    const match = PLAYLIST_ID_TOKEN_PATTERN.exec(only);
    if (match === null) {
      return null;
    }
    const id = Number(match[1]);
    if (!Number.isFinite(id)) {
      return null;
    }
    return [id];
  }

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  if (first !== UPDATES_OR_OPEN || last !== UPDATES_OR_CLOSE) {
    return null;
  }
  const inner = tokens.slice(1, -1);
  if (inner.length === 0 || inner.length % 2 === 0) {
    return null;
  }

  const ids: number[] = [];
  for (let index = 0; index < inner.length; index += 1) {
    const token = inner[index];
    if (token === undefined) {
      return null;
    }
    if (index % 2 === 1) {
      if (token !== UPDATES_OR_JOIN) {
        return null;
      }
      continue;
    }
    const match = PLAYLIST_ID_TOKEN_PATTERN.exec(token);
    if (match === null) {
      return null;
    }
    const id = Number(match[1]);
    if (!Number.isFinite(id)) {
      return null;
    }
    if (ids.includes(id)) {
      return null;
    }
    ids.push(id);
  }
  return ids;
}

/** Site shuffle token. Ignored when matching a saved dynamic search. */
export const SORT_RANDOM_TOKEN = "sort:random";

const SEARCH_TOKEN_SPLIT = /\s+/;

function searchTokens(raw: string): string[] {
  return raw.trim().split(SEARCH_TOKEN_SPLIT).filter((token) => token.length > 0);
}

function tokenCountsIgnoringSortRandom(raw: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of searchTokens(raw)) {
    if (token === SORT_RANDOM_TOKEN) {
      continue;
    }
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

/** The site's own "everything" search: `tags=all` is the plain post list. */
export const SEARCH_ALL_TOKEN = "all";

/**
 * True for a search that narrows nothing: empty, the site's `all`, or either
 * of them with `sort:random`.
 */
export function isUnfilteredQuery(raw: string): boolean {
  const query = withoutSortRandom(raw);
  return query.length === 0 || query === SEARCH_ALL_TOKEN;
}

/** True when `raw` contains at least one `sort:random` token. */
export function queryHasSortRandom(raw: string): boolean {
  return searchTokens(raw).includes(SORT_RANDOM_TOKEN);
}

/** Token string with every `sort:random` removed. Other tokens keep their order. */
export function withoutSortRandom(raw: string): string {
  return searchTokens(raw)
    .filter((token) => token !== SORT_RANDOM_TOKEN)
    .join(TAG_SEPARATOR);
}

/**
 * Token string that includes one trailing `sort:random`.
 * Existing shuffle tokens are left in place.
 */
export function withSortRandom(raw: string): string {
  const tokens = searchTokens(raw);
  if (!tokens.includes(SORT_RANDOM_TOKEN)) {
    tokens.push(SORT_RANDOM_TOKEN);
  }
  return tokens.join(TAG_SEPARATOR);
}

/**
 * True when two search strings are the same multiset of tokens.
 * Token order does not matter. Every `sort:random` token is ignored.
 */
export function queriesMatchIgnoringSortRandom(left: string, right: string): boolean {
  const leftCounts = tokenCountsIgnoringSortRandom(left);
  const rightCounts = tokenCountsIgnoringSortRandom(right);
  if (leftCounts.size !== rightCounts.size) {
    return false;
  }
  for (const [token, count] of leftCounts) {
    if (rightCounts.get(token) !== count) {
      return false;
    }
  }
  return true;
}
