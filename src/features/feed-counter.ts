import { FEED_MENU_ITEM_ID } from "../pages/constants";
import { fetchNextPage } from "../site/next-page";
import { extractPostIdFromThumb } from "../site/selectors";
import { getSeenPostId, listArtistTags } from "../storage/store";
import { log } from "../log";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

/**
 * A number beside "Feed" in the menu: how many posts of the first page of the
 * feed are newer than the newest you have seen there.
 *
 * This is the one thing the script asks the site for without being told to:
 * one request, of the feed's first page, when a page loads (Kaze's decision).
 * The answer is kept for a while, so going from page to page does not repeat
 * it. With several feed groups only the first is counted.
 */

const FEATURE_ID = "feed-counter";
const FEATURE_LABEL = "New posts counter beside Feed";
export const FEED_COUNT_CLASS = "rdw-feed-count";
/** How long an answer is good for. */
export const FEED_COUNT_TTL_MS = 15 * 60 * 1000;
export const FEED_COUNT_CACHE_KEY = "ruledesk-web.feed-count";
const BODY_CLASS = featureBodyClass(FEATURE_ID);
/** Every post of the page is new: there are more behind it. */
const MORE_MARK = "+";

const FEATURE_CSS = `
body.${BODY_CLASS} .${FEED_COUNT_CLASS} {
  display: inline-block;
  min-width: 16px;
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--rdw-accent);
  /* The site's dark theme colours everything in the menu with a rule stronger
     than this one would be; the number was the link's green on a green pill. */
  color: var(--rdw-surface) !important;
  font: 700 10.5px/16px var(--rdw-font);
  text-align: center;
  vertical-align: middle;
}
body:not(.${BODY_CLASS}) .${FEED_COUNT_CLASS} {
  display: none;
}
`.trim();

export type FeedCount = {
  readonly count: number;
  /** True when every post of the page was new. */
  readonly more: boolean;
};

type CachedCount = FeedCount & {
  readonly at: number;
  readonly seen: number;
  readonly href: string;
};

function isCachedCount(value: unknown): value is CachedCount {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "count" in value &&
    typeof value.count === "number" &&
    "more" in value &&
    typeof value.more === "boolean" &&
    "at" in value &&
    typeof value.at === "number" &&
    "seen" in value &&
    typeof value.seen === "number" &&
    "href" in value &&
    typeof value.href === "string"
  );
}

function readCache(): CachedCount | null {
  try {
    const raw = window.localStorage.getItem(FEED_COUNT_CACHE_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    return isCachedCount(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(value: CachedCount): void {
  try {
    window.localStorage.setItem(FEED_COUNT_CACHE_KEY, JSON.stringify(value));
  } catch {
    // A full or closed storage only means the next page asks again.
  }
}

/** How many of the thumbs are newer than `seenPostId`. */
export function countNewThumbs(thumbs: readonly Element[], seenPostId: number): FeedCount {
  let count = 0;
  for (const thumb of thumbs) {
    const raw = extractPostIdFromThumb(thumb);
    const id = raw === null ? Number.NaN : Number(raw);
    if (Number.isFinite(id) && id > seenPostId) {
      count += 1;
    }
  }
  return { count, more: thumbs.length > 0 && count === thumbs.length };
}

/** "12", "42+", or nothing for none. */
export function feedCountText(value: FeedCount): string {
  if (value.count <= 0) {
    return "";
  }
  return value.more ? `${String(value.count)}${MORE_MARK}` : String(value.count);
}

/** True while a kept answer still stands for this feed and this "seen" mark. */
export function isFreshCount(
  cached: { readonly at: number; readonly seen: number; readonly href: string } | null,
  now: number,
  seen: number,
  href: string,
): boolean {
  return (
    cached !== null &&
    cached.seen === seen &&
    cached.href === href &&
    now - cached.at >= 0 &&
    now - cached.at < FEED_COUNT_TTL_MS
  );
}

function show(link: HTMLAnchorElement, value: FeedCount): void {
  const text = feedCountText(value);
  const existing = link.parentElement?.querySelector(`.${FEED_COUNT_CLASS}`) ?? null;
  if (text.length === 0) {
    existing?.remove();
    return;
  }
  const badge = existing ?? document.createElement("span");
  badge.className = FEED_COUNT_CLASS;
  badge.textContent = text;
  badge.setAttribute("aria-label", `${text} new posts in the feed`);
  if (existing === null) {
    link.append(badge);
  }
}

function sameSearch(a: string, b: string): boolean {
  try {
    return new URL(a, window.location.href).search === new URL(b, window.location.href).search;
  } catch {
    return false;
  }
}

function mountFeedCounter(_ctx: FeatureContext): void {
  const link = document.getElementById(FEED_MENU_ITEM_ID)?.querySelector("a");
  if (!(link instanceof HTMLAnchorElement)) {
    return;
  }
  const seen = getSeenPostId();
  const href = link.href;
  // Nothing to count against before the feed was ever opened, and nothing to
  // ask about without follows or on the feed itself, which shows its new posts.
  if (
    seen <= 0 ||
    listArtistTags().length === 0 ||
    !href.includes("tags=") ||
    sameSearch(href, window.location.href)
  ) {
    return;
  }
  const now = Date.now();
  const cached = readCache();
  if (cached !== null && isFreshCount(cached, now, seen, href)) {
    show(link, cached);
    return;
  }
  fetchNextPage(href)
    .then((page) => {
      const value = countNewThumbs(page.thumbs, seen);
      writeCache({ ...value, at: Date.now(), seen, href });
      show(link, value);
    })
    .catch((error: unknown) => {
      // Kept as "asked just now" so a failing site is not asked on every page.
      writeCache({ count: 0, more: false, at: Date.now(), seen, href });
      log.warn("feed-counter: request failed", error);
    });
}

export const feedCounterFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: ["list", "post", "favorites", "other"],
  defaultEnabled: true,
  settingsCaption:
    "Asks the site for the first page of the feed when a page loads, at most once in 15 minutes. Counts the first feed group only.",
  css: FEATURE_CSS,
  mount: mountFeedCounter,
};
