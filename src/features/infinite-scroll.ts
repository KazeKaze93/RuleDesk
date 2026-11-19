import { log } from "../log";
import { isBlacklisted, readSiteBlacklist } from "../site/blacklist";
import { fetchNextPage } from "../site/next-page";
import { SITE_SELECTORS } from "../site/selectors";
import { FEED_MERGE_BODY_CLASS } from "./feed-merge";
import { notifyThumbsAdded } from "../site/thumbs-bus";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";
import { AI_SCOPE_POSTS, alignSiteAiFilter, currentListScope } from "./ai-scope";

const FEATURE_ID = "infinite-scroll";
const FEATURE_LABEL = "Infinite scroll";
const FEATURE_PAGES = ["list"] as const;

const BODY_FEATURE_CLASS = featureBodyClass(FEATURE_ID);

/** Prefetch when remaining distance to list end ≤ this many viewport heights. */
const PREFETCH_REMAINING_VIEWPORT_HEIGHTS = 2;
const MIN_REQUEST_INTERVAL_MS = 1000;

const CLASS_SENTINEL = "rdw-infinite-sentinel";
const CLASS_STATUS = "rdw-infinite-status";
const CLASS_SEPARATOR = "rdw-infinite-page";
const CLASS_RETRY = "rdw-infinite-retry";
const CLASS_BLACKLISTED = "rdw-blacklisted";

const TEXT_LOADING = "Loading…";
const TEXT_END = "End of results";
const TEXT_ERROR = "Failed to load more";
const TEXT_RETRY = "Retry";
const TEXT_STALLED = "Paused: the last pages added nothing to the screen";
const TEXT_LOAD_MORE = "Load more";
/** Pages in a row that may add nothing to the screen before loading waits for the user. */
export const MAX_STALLED_LOADS = 2;
const PAGE_LABEL_PREFIX = "Page ";

const PAGINATION_NEXT_SELECTOR = 'div.pagination a[alt="next"]';

const WARN_MISSING =
  "infinite-scroll: missing image-list or next link; not mounted";

const SCORE_TOKEN_PREFIX = "score:";
const RATING_TOKEN_PREFIX = "rating:";

const FEATURE_CSS = `
body.${BODY_FEATURE_CLASS} .${CLASS_SENTINEL} {
  display: block;
  width: 100%;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  pointer-events: none;
}
body.${BODY_FEATURE_CLASS} .${CLASS_STATUS} {
  display: block;
  width: 100%;
  margin: 0.75rem 0;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.4;
}
body.${BODY_FEATURE_CLASS} .${CLASS_SEPARATOR} {
  display: block;
  width: 100%;
  margin: 0.75rem 0 0.5rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  opacity: 0.75;
}
body.${BODY_FEATURE_CLASS} .${CLASS_RETRY} {
  margin-left: 0.5rem;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
  font: inherit;
}
body.${BODY_FEATURE_CLASS} .${CLASS_RETRY}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
body.${BODY_FEATURE_CLASS} span.thumb.${CLASS_BLACKLISTED} {
  display: none !important;
}
`.trim();

type ThumbMeta = {
  tags: string[];
  score: number;
  rating: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readInitialNextUrl(): string | null {
  const nextLink = document.querySelector(PAGINATION_NEXT_SELECTOR);
  if (!(nextLink instanceof HTMLAnchorElement)) {
    return null;
  }
  const href = nextLink.getAttribute("href");
  if (href === null || href.length === 0 || href === "#") {
    return null;
  }
  try {
    return new URL(href, window.location.href).href;
  } catch {
    return null;
  }
}

function parseThumbMeta(thumb: Element): ThumbMeta {
  const img = thumb.querySelector(SITE_SELECTORS.previewImage);
  const title = img?.getAttribute("title")?.trim() ?? "";
  const alt = img?.getAttribute("alt")?.trim() ?? "";
  const source = title.length > 0 ? title : alt;
  if (source.length === 0) {
    return { tags: [], score: 0, rating: "" };
  }

  const tags: string[] = [];
  let score = 0;
  let rating = "";
  for (const token of source.split(/\s+/)) {
    if (token.length === 0) {
      continue;
    }
    const lower = token.toLowerCase();
    if (lower.startsWith(SCORE_TOKEN_PREFIX)) {
      const raw = token.slice(SCORE_TOKEN_PREFIX.length);
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        score = parsed;
      }
      continue;
    }
    if (lower.startsWith(RATING_TOKEN_PREFIX)) {
      rating = token.slice(RATING_TOKEN_PREFIX.length);
      continue;
    }
    tags.push(token);
  }
  return { tags, score, rating };
}

function collectExistingThumbIds(): Set<string> {
  const ids = new Set<string>();
  const thumbs = document.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    if (thumb.id.length > 0) {
      ids.add(thumb.id);
    }
  }
  return ids;
}

function applyBlacklist(thumb: Element, list: readonly string[]): void {
  if (!(thumb instanceof HTMLElement)) {
    return;
  }
  const meta = parseThumbMeta(thumb);
  if (isBlacklisted(meta.tags, meta.score, meta.rating, list)) {
    thumb.classList.add(CLASS_BLACKLISTED);
  }
}

function createSeparator(pageNumber: number): HTMLElement {
  const separator = document.createElement("div");
  separator.className = CLASS_SEPARATOR;
  separator.textContent = `${PAGE_LABEL_PREFIX}${String(pageNumber)}`;
  return separator;
}

type BatchResult = {
  readonly nextUrl: string | null;
  /** How many thumbs of the page were new and went into the list. */
  readonly added: number;
};

type ScrollUi = {
  sentinel: HTMLElement;
  status: HTMLElement;
};

function createUi(imageList: Element): ScrollUi {
  const sentinel = document.createElement("div");
  sentinel.className = CLASS_SENTINEL;
  sentinel.setAttribute("aria-hidden", "true");

  const status = document.createElement("div");
  status.className = CLASS_STATUS;
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  imageList.after(sentinel, status);
  return { sentinel, status };
}

function setStatusLoading(status: HTMLElement): void {
  status.replaceChildren();
  status.textContent = TEXT_LOADING;
}

function setStatusEnd(status: HTMLElement): void {
  status.replaceChildren();
  status.textContent = TEXT_END;
}

function setStatusError(status: HTMLElement, onRetry: () => void): void {
  status.replaceChildren();
  const message = document.createElement("span");
  message.textContent = TEXT_ERROR;
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = CLASS_RETRY;
  retry.textContent = TEXT_RETRY;
  retry.addEventListener("click", (event: Event) => {
    event.preventDefault();
    onRetry();
  });
  status.append(message, retry);
}

/** Shown when loading was paused because the pages add nothing to the screen. */
function setStatusStalled(status: HTMLElement, onContinue: () => void): void {
  status.replaceChildren();
  const message = document.createElement("span");
  message.textContent = TEXT_STALLED;
  const more = document.createElement("button");
  more.type = "button";
  more.className = CLASS_RETRY;
  more.textContent = TEXT_LOAD_MORE;
  more.addEventListener("click", (event: Event) => {
    event.preventDefault();
    onContinue();
  });
  status.append(message, more);
}

/** Height of the whole page; 0 where there is no layout to measure. */
function pageHeight(): number {
  return document.documentElement.scrollHeight;
}

function clearStatus(status: HTMLElement): void {
  status.replaceChildren();
}

function prefetchRootMarginPx(): number {
  return PREFETCH_REMAINING_VIEWPORT_HEIGHTS * window.innerHeight;
}

function prefetchRootMarginCss(): string {
  return `${String(prefetchRootMarginPx())}px`;
}

/** True when the sentinel is within the prefetch margin of the viewport (IO may not re-fire). */
function isSentinelNear(sentinel: Element): boolean {
  const rect = sentinel.getBoundingClientRect();
  const marginPx = prefetchRootMarginPx();
  const viewBottom = window.innerHeight + marginPx;
  const viewTop = -marginPx;
  return rect.top < viewBottom && rect.bottom > viewTop;
}

function mountInfiniteScroll(_ctx: FeatureContext): void {
  // The merged feed loads its own pages, from several searches at once.
  if (document.body.classList.contains(FEED_MERGE_BODY_CLASS)) {
    return;
  }
  const imageList = document.querySelector(SITE_SELECTORS.imageList);
  if (imageList === null) {
    log.warn(WARN_MISSING);
    return;
  }

  let nextUrl = readInitialNextUrl();
  if (nextUrl === null) {
    log.warn(WARN_MISSING);
    return;
  }

  const { sentinel, status } = createUi(imageList);
  let inFlight = false;
  let lastRequestAt = 0;
  let pageNumber = 1;
  let ended = false;
  let stalledLoads = 0;
  let observer: IntersectionObserver | null = null;

  const finish = (): void => {
    ended = true;
    nextUrl = null;
    setStatusEnd(status);
    if (observer !== null) {
      observer.disconnect();
      observer = null;
    }
  };

  const appendBatch = async (requestUrl: string): Promise<BatchResult> => {
    // Another tab may have moved the site's AI switch since this page was opened.
    alignSiteAiFilter(currentListScope() ?? AI_SCOPE_POSTS);
    const result = await fetchNextPage(requestUrl);
    let added = 0;
    pageNumber += 1;
    imageList.append(createSeparator(pageNumber));

    const existingIds = collectExistingThumbIds();
    const blacklist = readSiteBlacklist();

    for (const thumb of result.thumbs) {
      if (thumb.id.length > 0 && existingIds.has(thumb.id)) {
        continue;
      }
      const node = document.importNode(thumb, true);
      if (node.id.length > 0) {
        existingIds.add(node.id);
      }
      applyBlacklist(node, blacklist);
      imageList.append(node);
      added += 1;
    }

    notifyThumbsAdded(imageList);
    return { nextUrl: result.nextUrl, added };
  };

  const loadMore = async (options?: {
    bypassRateLimit?: boolean;
    /** Load one page and stop, whatever it adds: the user asked for it. */
    single?: boolean;
  }): Promise<void> => {
    if (ended || inFlight || nextUrl === null) {
      return;
    }
    inFlight = true;
    let bypassRateLimit = options?.bypassRateLimit === true;

    try {
      while (
        !ended &&
        nextUrl !== null &&
        (options?.single === true || isSentinelNear(sentinel))
      ) {
        const elapsed = Date.now() - lastRequestAt;
        if (
          !bypassRateLimit &&
          lastRequestAt > 0 &&
          elapsed < MIN_REQUEST_INTERVAL_MS
        ) {
          await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
          continue;
        }
        bypassRateLimit = false;

        const requestUrl = nextUrl;
        lastRequestAt = Date.now();
        setStatusLoading(status);

        try {
          const heightBefore = pageHeight();
          const batch = await appendBatch(requestUrl);
          nextUrl = batch.nextUrl;
          clearStatus(status);
          if (nextUrl === null) {
            finish();
            return;
          }
          // A page that put nothing on the screen (all its posts hidden, or
          // repeats) leaves the sentinel where it was, and the loop would go
          // on to the next page at once. A few of those in a row and loading
          // waits for the user instead of walking the whole search.
          const grew = heightBefore === 0 || pageHeight() > heightBefore;
          const useful = batch.added > 0 && grew;
          stalledLoads = useful ? 0 : stalledLoads + 1;
          const single = options?.single === true;
          if (stalledLoads >= MAX_STALLED_LOADS || (single && !useful)) {
            stalledLoads = 0;
            setStatusStalled(status, () => {
              void loadMore({ bypassRateLimit: true, single: true });
            });
            return;
          }
          if (single) {
            return;
          }
        } catch (error) {
          log.warn("infinite-scroll: fetch failed", requestUrl, error);
          setStatusError(status, () => {
            void loadMore({ bypassRateLimit: true });
          });
          return;
        }
      }
    } finally {
      inFlight = false;
    }
  };

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }
        void loadMore();
        break;
      }
    },
    { root: null, rootMargin: prefetchRootMarginCss(), threshold: 0 },
  );
  observer.observe(sentinel);
}

export const infiniteScrollFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountInfiniteScroll,
};
