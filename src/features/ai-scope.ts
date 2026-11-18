import {
  COLLECTION_KIND_SEARCH,
  SEARCH_PARAM_TAGS,
} from "../config/constants";
import { readDynamicCollectionMark } from "../pages/constants";
import {
  findFeedGroupIndex,
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
  normalizeArtistTag,
  serialize,
} from "../search/query";
import { readSiteAiFilter, writeSiteAiFilter } from "../site/ai-filter";
import { detectPageKind } from "../site/pages";
import {
  getFeatureState,
  getUpdatesGroupSize,
  loadRecent,
  setFeatureState,
} from "../storage/store";
import { log } from "../log";
import { AI_SCOPE_FAVORITES, AI_STATE_ALL, AI_STATE_HIDE, AI_STATE_ID } from "./types";

/**
 * AI posts, shown or hidden, by the part of the site.
 *
 * Posts, Feed, what is opened from Following and what is opened from
 * Collections are all the site's list of posts, and the site has one switch
 * for it. The script remembers a choice for each of them and puts the site's
 * switch (the cookie `filter_ai`) the way the part you are in wants it.
 * Favorites is not filtered by the site at all: there the script leaves the
 * posts tagged `ai_generated` out itself.
 *
 * "Hide AI posts everywhere" in the settings overrides every one of them.
 */

export const AI_SCOPE_POSTS = "posts";
export const AI_SCOPE_FEED = "feed";
export const AI_SCOPE_FOLLOWING = "following";
export const AI_SCOPE_COLLECTIONS = "collections";
export { AI_SCOPE_FAVORITES };

export type AiScope =
  | typeof AI_SCOPE_POSTS
  | typeof AI_SCOPE_FEED
  | typeof AI_SCOPE_FOLLOWING
  | typeof AI_SCOPE_COLLECTIONS
  | typeof AI_SCOPE_FAVORITES;

const AI_SCOPES: readonly AiScope[] = [
  AI_SCOPE_POSTS,
  AI_SCOPE_FEED,
  AI_SCOPE_FOLLOWING,
  AI_SCOPE_COLLECTIONS,
  AI_SCOPE_FAVORITES,
];

/** The tag the site puts on an AI post; Favorites is narrowed by it. */
export const AI_TAG = "ai_generated";

export { AI_STATE_ID };
const STATE_ALL = AI_STATE_ALL;
const STATE_HIDE = AI_STATE_HIDE;

export const AI_MODE_SHOW = "show";
export const AI_MODE_HIDE = "hide";
export type AiMode = typeof AI_MODE_SHOW | typeof AI_MODE_HIDE;
export const AI_LABEL = "AI posts";
export const AI_MODE_OPTIONS = [
  { value: AI_MODE_SHOW, label: "Show" },
  { value: AI_MODE_HIDE, label: "Hide" },
] as const;

type AiState = {
  readonly all: boolean;
  readonly hide: Partial<Record<AiScope, boolean>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readState(): AiState {
  const raw = getFeatureState(AI_STATE_ID);
  const hide: Partial<Record<AiScope, boolean>> = {};
  if (!isRecord(raw)) {
    return { all: false, hide };
  }
  const stored = raw[STATE_HIDE];
  if (isRecord(stored)) {
    for (const scope of AI_SCOPES) {
      const value = stored[scope];
      if (typeof value === "boolean") {
        hide[scope] = value;
      }
    }
  }
  return { all: raw[STATE_ALL] === true, hide };
}

function writeState(state: AiState): void {
  setFeatureState(AI_STATE_ID, { [STATE_ALL]: state.all, [STATE_HIDE]: state.hide });
}

/** True when the settings hide AI posts in every part of the site. */
export function aiHiddenEverywhere(): boolean {
  return readState().all;
}

export function setAiHiddenEverywhere(hide: boolean): void {
  writeState({ ...readState(), all: hide });
}

/**
 * The choice remembered for one part, whatever the settings say. Every part
 * starts with AI posts shown; Posts starts from what the site's own switch was
 * set to (see {@link adoptSiteAiChoice}).
 */
export function aiChoiceIn(scope: AiScope): boolean {
  return readState().hide[scope] ?? false;
}

/**
 * Keeps what the site's switch was set to as the choice of Posts, once, before
 * the script starts moving the switch for the other parts.
 */
export function adoptSiteAiChoice(): void {
  const state = readState();
  if (state.hide[AI_SCOPE_POSTS] === undefined) {
    writeState({
      ...state,
      hide: { ...state.hide, [AI_SCOPE_POSTS]: readSiteAiFilter() === true },
    });
  }
}

/** True when AI posts are hidden in this part: by the settings, or by its own choice. */
export function aiHiddenIn(scope: AiScope): boolean {
  return aiHiddenEverywhere() || aiChoiceIn(scope);
}

export function setAiHiddenIn(scope: AiScope, hide: boolean): void {
  const state = readState();
  writeState({ ...state, hide: { ...state.hide, [scope]: hide } });
}

export function aiModeIn(scope: AiScope): AiMode {
  return aiHiddenIn(scope) ? AI_MODE_HIDE : AI_MODE_SHOW;
}

/** What a list page is told apart by: who is followed and what searches are saved. */
export type ListScopeData = {
  readonly artistTags: readonly string[];
  readonly groupSize: number;
  /** The queries of the saved searches, as they are opened. */
  readonly savedQueries: readonly string[];
};

const SORT_PREFIX = "sort:";
const SCORE_PREFIX = "score:";
const MEDIA_TOKENS: ReadonlySet<string> = new Set(["video", "-video"]);

/** The query without what the controls of the sidebar add to it: order, least score, type. */
function withoutToolTokens(tagsParam: string): string[] {
  return tagsParam
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 0 &&
        !token.startsWith(SORT_PREFIX) &&
        !token.startsWith(SCORE_PREFIX) &&
        !MEDIA_TOKENS.has(token),
    );
}

function sameTokens(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const set = new Set(left);
  return right.every((token) => set.has(token));
}

/**
 * The part of the site a list of posts belongs to, by its query: the feed, one
 * followed tag (what a card of Following opens), a saved search, or Posts. A
 * saved search opened from its card carries a mark in the address; the mark is
 * gone on the next page of the result, so the query is compared too.
 */
export function listScope(tagsParam: string, hash: string, data: ListScopeData): AiScope {
  if (readDynamicCollectionMark(hash) !== null) {
    return AI_SCOPE_COLLECTIONS;
  }
  const tokens = withoutToolTokens(tagsParam);
  if (tokens.length === 0) {
    return AI_SCOPE_POSTS;
  }
  const query = tokens.join(" ");
  const artists = [...data.artistTags];
  if (
    isFullUpdatesQuery(query, artists) ||
    isPartialUpdatesQuery(query, artists) ||
    findFeedGroupIndex(query, artists, data.groupSize) >= 0
  ) {
    return AI_SCOPE_FEED;
  }
  const only = tokens[0];
  if (tokens.length === 1 && only !== undefined) {
    const followed = new Set<string>();
    for (const raw of artists) {
      const tag = normalizeArtistTag(raw);
      if (tag !== null) {
        followed.add(tag);
      }
    }
    if (followed.has(only)) {
      return AI_SCOPE_FOLLOWING;
    }
  }
  for (const saved of data.savedQueries) {
    const savedTokens = withoutToolTokens(saved);
    if (savedTokens.length > 0 && sameTokens(savedTokens, tokens)) {
      return AI_SCOPE_COLLECTIONS;
    }
  }
  return AI_SCOPE_POSTS;
}

function scopeData(): ListScopeData {
  const data = loadRecent();
  return {
    artistTags: data.artists.map((entry) => entry.tag),
    groupSize: getUpdatesGroupSize(),
    savedQueries: data.collections
      .filter((collection) => collection.kind === COLLECTION_KIND_SEARCH)
      .map((collection) => serialize(collection.tags)),
  };
}

/** The part a list address belongs to, or null when the address is not a list of posts. */
export function scopeOfListUrl(url: URL): AiScope | null {
  if (detectPageKind(url.search) !== "list") {
    return null;
  }
  return listScope(url.searchParams.get(SEARCH_PARAM_TAGS) ?? "", url.hash, scopeData());
}

/** The part the page being shown belongs to, when it is a list of posts. */
export function currentListScope(): AiScope | null {
  return scopeOfListUrl(new URL(window.location.href));
}

/**
 * Puts the site's switch the way `scope` wants it. Returns true when it had
 * to be changed: a list already on the page was then given with the other
 * setting. Favorites is not the site's to filter, and is left alone.
 */
export function alignSiteAiFilter(scope: AiScope): boolean {
  if (scope === AI_SCOPE_FAVORITES) {
    return false;
  }
  try {
    const want = aiHiddenIn(scope);
    const have = readSiteAiFilter();
    // Never set and nothing to hide: the site shows AI posts by default.
    if (have === want || (have === null && !want)) {
      return false;
    }
    writeSiteAiFilter(want);
    return true;
  } catch (error) {
    // The request this was called before is still made, with the switch as it is.
    log.warn("ai-scope: the site's AI switch was not set", error);
    return false;
  }
}

/**
 * Runs one request to the site with its switch set for `scope`, then puts the
 * switch back. For a request made from a page of another part: the counter
 * beside Feed is read from any page. The switch is put back only when the
 * answer has come, because the browser reads the cookie after `fetch` returns.
 */
export async function withSiteAiFilter<T>(scope: AiScope, run: () => Promise<T>): Promise<T> {
  const before = readSiteAiFilter();
  const changed = alignSiteAiFilter(scope);
  try {
    return await run();
  } finally {
    if (changed) {
      writeSiteAiFilter(before === true);
    }
  }
}
