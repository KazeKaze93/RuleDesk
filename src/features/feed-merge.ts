import { SEARCH_PARAM_PID, SEARCH_PARAM_TAGS } from "../config/constants";
import { log } from "../log";
import { buildUpdatesSearchUrl, feedGroupQueries, findFeedGroupIndex } from "../search/query";
import { isBlacklisted, readSiteBlacklist } from "../site/blacklist";
import { fetchNextPage } from "../site/next-page";
import { SITE_SELECTORS, extractPostIdFromThumb } from "../site/selectors";
import { notifyThumbsAdded } from "./runtime";

/**
 * Feed for more followed artists than one site search can hold.
 *
 * The site search takes a limited OR-group, so the followed artists are split
 * into groups and every group is its own search, newest post first. The feed
 * page is the first group's search. This module reads the other groups' result
 * pages (one request at a time, with a pause) and shows all groups as one list
 * ordered by post id, newest first.
 */

/** Set on body while the merged feed owns the grid; infinite scroll stays off. */
export const FEED_MERGE_BODY_CLASS = "rdw-feed-merged";

const PENDING_CLASS = "rdw-feed-merge-pending";
const BLACKLISTED_CLASS = "rdw-blacklisted";
const STATUS_CLASS = "rdw-feed-merge-status";
const SENTINEL_CLASS = "rdw-feed-merge-sentinel";
const RETRY_CLASS = "rdw-feed-merge-retry";

const MIN_REQUEST_INTERVAL_MS = 1000;
const PREFETCH_VIEWPORT_HEIGHTS = 2;
const FIRST_PAGE_PID = "0";
const NEXT_LINK_SELECTOR = 'div.pagination a[alt="next"]';
const EMPTY_HREF = "#";
const SCORE_TOKEN_PREFIX = "score:";
const RATING_TOKEN_PREFIX = "rating:";
const TOKEN_SPLIT = /\s+/;

const TEXT_LOADING_PREFIX = "Loading feed: part ";
const TEXT_LOADING_JOIN = " of ";
const TEXT_END = "End of feed";
const TEXT_ERROR = "Failed to load a part of the feed";
const TEXT_RETRY = "Retry";

export const FEED_MERGE_CSS = `
body.${FEED_MERGE_BODY_CLASS} ${SITE_SELECTORS.pagination} {
  display: none;
}
body.${FEED_MERGE_BODY_CLASS} ${SITE_SELECTORS.thumb}.${PENDING_CLASS},
body.${FEED_MERGE_BODY_CLASS} ${SITE_SELECTORS.thumb}.${BLACKLISTED_CLASS} {
  display: none !important;
}
.${SENTINEL_CLASS} {
  display: block;
  width: 100%;
  height: 1px;
}
.${STATUS_CLASS} {
  display: block;
  width: 100%;
  margin: 12px 0;
  text-align: center;
  font-size: 13px;
  color: var(--rdw-muted);
}
.${RETRY_CLASS} {
  margin-left: 8px;
  padding: 2px 8px;
  font: inherit;
  color: var(--rdw-text);
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  cursor: pointer;
}
`;

/** One group's search: posts read so far and where its next page is. */
export type MergeSource<T> = {
  /** Read but not shown yet, newest first. */
  buffer: T[];
  /** Next results page of this group, or null when the group has no more. */
  nextUrl: string | null;
};

export type DrainResult<T> = {
  /** Items that are safe to show now, newest first, without duplicates. */
  readonly emitted: T[];
  /**
   * Index of the group that must be read before anything else can be shown,
   * or null when every group is exhausted.
   */
  readonly starving: number | null;
};

/**
 * Takes from the groups every item whose place in the common order is already
 * certain. An item is certain while each group that still has pages also has a
 * buffered item: only then no unread page can hold something newer.
 * `seen` collects the ids already emitted, so a post of two followed artists
 * from different groups shows once. Mutates the buffers and `seen`.
 */
export function drainMerged<T>(
  sources: MergeSource<T>[],
  idOf: (item: T) => number,
  seen: Set<number>,
): DrainResult<T> {
  const emitted: T[] = [];
  for (;;) {
    let best = -1;
    let bestId = -1;
    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];
      if (source === undefined) {
        continue;
      }
      const head = source.buffer[0];
      if (head === undefined) {
        if (source.nextUrl !== null) {
          return { emitted, starving: index };
        }
        continue;
      }
      const id = idOf(head);
      if (id > bestId) {
        bestId = id;
        best = index;
      }
    }
    const source = sources[best];
    const item = source?.buffer.shift();
    if (item === undefined) {
      return { emitted, starving: null };
    }
    if (!seen.has(bestId)) {
      seen.add(bestId);
      emitted.push(item);
    }
  }
}

function thumbPostId(thumb: Element): number {
  const raw = extractPostIdFromThumb(thumb);
  const id = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(id) ? id : 0;
}

function byNewest(a: Element, b: Element): number {
  return thumbPostId(b) - thumbPostId(a);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readPagerNextUrl(): string | null {
  const href = document.querySelector(NEXT_LINK_SELECTOR)?.getAttribute("href") ?? "";
  if (href.length === 0 || href === EMPTY_HREF) {
    return null;
  }
  try {
    return new URL(href, window.location.href).href;
  } catch {
    return null;
  }
}

/** Fetched thumbs get the same blacklist treatment as infinite scroll gives. */
function applyBlacklist(thumb: Element, list: readonly string[]): void {
  const image = thumb.querySelector(SITE_SELECTORS.previewImage);
  const text = image?.getAttribute("title")?.trim() ?? image?.getAttribute("alt")?.trim() ?? "";
  const tags: string[] = [];
  let score = 0;
  let rating = "";
  for (const token of text.split(TOKEN_SPLIT)) {
    const lower = token.toLowerCase();
    if (lower.startsWith(SCORE_TOKEN_PREFIX)) {
      const parsed = Number(token.slice(SCORE_TOKEN_PREFIX.length));
      score = Number.isFinite(parsed) ? parsed : score;
    } else if (lower.startsWith(RATING_TOKEN_PREFIX)) {
      rating = token.slice(RATING_TOKEN_PREFIX.length);
    } else if (token.length > 0) {
      tags.push(token);
    }
  }
  if (isBlacklisted(tags, score, rating, list)) {
    thumb.classList.add(BLACKLISTED_CLASS);
  }
}

/**
 * True when this results page is the feed that must be merged: the first
 * group's search, first page, with more than one group of followed artists.
 */
export function isMergedFeedPage(
  search: string,
  artistTags: string[],
  groupSize: number,
): boolean {
  const params = new URLSearchParams(search);
  const pid = params.get(SEARCH_PARAM_PID);
  if (pid !== null && pid.length > 0 && pid !== FIRST_PAGE_PID) {
    return false;
  }
  const tagsParam = params.get(SEARCH_PARAM_TAGS) ?? "";
  return findFeedGroupIndex(tagsParam, artistTags, groupSize) === 0;
}

export type FeedMergeOptions = {
  readonly artistTags: string[];
  readonly groupSize: number;
  /** Called after posts were added to the grid (e.g. to recount new posts). */
  readonly onChange: () => void;
};

/**
 * Starts the merged feed on a page for which {@link isMergedFeedPage} is true.
 * Returns false when the page has no grid to merge into.
 */
export function mountFeedMerge(options: FeedMergeOptions): boolean {
  const imageList = document.querySelector(SITE_SELECTORS.imageList);
  if (imageList === null) {
    return false;
  }
  const queries = feedGroupQueries(options.artistTags, options.groupSize);
  document.body.classList.add(FEED_MERGE_BODY_CLASS);

  const own = Array.from(imageList.querySelectorAll(SITE_SELECTORS.thumb));
  for (const thumb of own) {
    thumb.classList.add(PENDING_CLASS);
  }
  const sources: MergeSource<Element>[] = queries.map((query, index) =>
    index === 0
      ? { buffer: own.sort(byNewest), nextUrl: readPagerNextUrl() }
      : { buffer: [], nextUrl: buildUpdatesSearchUrl(query) },
  );

  const sentinel = document.createElement("div");
  sentinel.className = SENTINEL_CLASS;
  sentinel.setAttribute("aria-hidden", "true");
  const status = document.createElement("div");
  status.className = STATUS_CLASS;
  status.setAttribute("role", "status");
  imageList.after(sentinel, status);

  const seen = new Set<number>();
  let shown = 0;
  let running = false;
  let lastRequestAt = 0;

  const sentinelNear = (): boolean => {
    const margin = PREFETCH_VIEWPORT_HEIGHTS * window.innerHeight;
    return sentinel.getBoundingClientRect().top < window.innerHeight + margin;
  };

  const show = (thumbs: readonly Element[]): void => {
    if (thumbs.length === 0) {
      return;
    }
    for (const thumb of thumbs) {
      thumb.classList.remove(PENDING_CLASS);
      // Appending in emit order also moves the page's own thumbs into place.
      imageList.append(thumb);
    }
    shown += thumbs.length;
    notifyThumbsAdded(imageList);
    options.onChange();
  };

  const readGroup = async (index: number): Promise<void> => {
    const source = sources[index];
    if (source === undefined || source.nextUrl === null) {
      return;
    }
    const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (lastRequestAt > 0 && wait > 0) {
      await sleep(wait);
    }
    lastRequestAt = Date.now();
    status.textContent = `${TEXT_LOADING_PREFIX}${String(index + 1)}${TEXT_LOADING_JOIN}${String(sources.length)}…`;
    const page = await fetchNextPage(source.nextUrl);
    const blacklist = readSiteBlacklist();
    const fresh: Element[] = [];
    for (const thumb of page.thumbs) {
      const node = document.importNode(thumb, true);
      applyBlacklist(node, blacklist);
      fresh.push(node);
    }
    source.buffer.push(...fresh.sort(byNewest));
    source.nextUrl = page.nextUrl;
    status.textContent = "";
  };

  const pump = async (): Promise<void> => {
    if (running) {
      return;
    }
    running = true;
    try {
      for (;;) {
        const result = drainMerged(sources, thumbPostId, seen);
        show(result.emitted);
        if (result.starving === null) {
          status.textContent = TEXT_END;
          return;
        }
        // Until something is on screen the other groups are read at once;
        // afterwards only when the reader gets close to the end of the list.
        if (shown > 0 && !sentinelNear()) {
          return;
        }
        try {
          await readGroup(result.starving);
        } catch (error) {
          log.warn("feed-merge: fetch failed", error);
          status.textContent = TEXT_ERROR;
          const retry = document.createElement("button");
          retry.type = "button";
          retry.className = RETRY_CLASS;
          retry.textContent = TEXT_RETRY;
          retry.addEventListener("click", () => {
            status.textContent = "";
            void pump();
          });
          status.append(retry);
          return;
        }
      }
    } finally {
      running = false;
    }
  };

  if (typeof IntersectionObserver === "function") {
    const margin = `${String(PREFETCH_VIEWPORT_HEIGHTS * window.innerHeight)}px`;
    new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void pump();
        }
      },
      { root: null, rootMargin: margin, threshold: 0 },
    ).observe(sentinel);
  }
  void pump();
  return true;
}
