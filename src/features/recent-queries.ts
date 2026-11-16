import { SEARCH_PARAM_TAGS } from "../config/constants";
import { getFeatureState, setFeatureState } from "../storage/store";

/**
 * The searches you ran last, newest first, for the search panel to offer
 * again. Kept with the script's settings; nothing is requested.
 */

export const RECENT_QUERIES_STATE_ID = "recent-queries";
/** How many searches are kept. */
export const RECENT_QUERIES_MAX = 8;
/** A search of everything: the site's word for it, and no query at all. */
const ALL_QUERY = "all";
const SPACES = /\s+/g;

function normalize(query: string): string {
  return query.trim().replace(SPACES, " ");
}

/** The same search typed with other case or spacing is one search. */
function foldQuery(query: string): string {
  return normalize(query).toLowerCase();
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * `list` with `query` put first. A query already in the list moves to the
 * front instead of appearing twice; an empty one or "all" changes nothing.
 */
export function withRecentQuery(list: readonly string[], query: string): string[] {
  const clean = normalize(query);
  if (clean.length === 0 || foldQuery(clean) === ALL_QUERY) {
    return [...list];
  }
  const key = foldQuery(clean);
  return [clean, ...list.filter((item) => foldQuery(item) !== key)].slice(0, RECENT_QUERIES_MAX);
}

export function readRecentQueries(): string[] {
  const stored = getFeatureState(RECENT_QUERIES_STATE_ID);
  return isStringArray(stored) ? stored.slice(0, RECENT_QUERIES_MAX) : [];
}

export function clearRecentQueries(): void {
  setFeatureState(RECENT_QUERIES_STATE_ID, []);
}

/** Remembers the search of a results page, read from its address. */
export function rememberQueryOfPage(search: string): void {
  const query = new URLSearchParams(search).get(SEARCH_PARAM_TAGS) ?? "";
  const before = readRecentQueries();
  const after = withRecentQuery(before, query);
  if (after.length !== before.length || after.some((item, index) => item !== before[index])) {
    setFeatureState(RECENT_QUERIES_STATE_ID, after);
  }
}

/** The recent searches other than the one the page is showing. */
export function recentQueriesFor(search: string): string[] {
  const current = foldQuery(new URLSearchParams(search).get(SEARCH_PARAM_TAGS) ?? "");
  return readRecentQueries().filter((item) => foldQuery(item) !== current);
}
