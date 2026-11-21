import {
  FEED_COUNT_CACHE_KEY,
  FEED_COUNT_CLASS,
  feedCountText,
  readFeedCountCache,
  sameSearch,
  showFeedCount,
  writeFeedCountCache,
  type FeedCount,
} from "../boot/feed-count";
import { FEED_MENU_ITEM_ID } from "../pages/constants";
import { fetchNextPage } from "../site/next-page";
import { extractPostIdFromThumb } from "../site/selectors";
import { getSeenPostId, listArtistTags } from "../storage/store";
import { log } from "../log";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";
import { AI_SCOPE_FEED, withSiteAiFilter } from "./ai-scope";

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
export { FEED_COUNT_CACHE_KEY, FEED_COUNT_CLASS, feedCountText, type FeedCount };
/** How long an answer is good for. */
export const FEED_COUNT_TTL_MS = 15 * 60 * 1000;
const BODY_CLASS = featureBodyClass(FEATURE_ID);

/**
 * The look of the number is in the menu's own stylesheet (boot/feed-count.ts),
 * which is in the page before the first paint. Here only: no number while the
 * feature is off.
 */
const FEATURE_CSS = `
body:not(.${BODY_CLASS}) .${FEED_COUNT_CLASS} {
  display: none;
}
`.trim();

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
    // A number the menu put in from an earlier answer does not belong here.
    showFeedCount(link, { count: 0, more: false });
    return;
  }
  const now = Date.now();
  const cached = readFeedCountCache();
  if (cached !== null && isFreshCount(cached, now, seen, href)) {
    showFeedCount(link, cached);
    return;
  }
  // The feed has its own choice for AI posts, whatever page the counter is read from.
  withSiteAiFilter(AI_SCOPE_FEED, () => fetchNextPage(href))
    .then((page) => {
      const value = countNewThumbs(page.thumbs, seen);
      writeFeedCountCache({ ...value, at: Date.now(), seen, href });
      showFeedCount(link, value);
    })
    .catch((error: unknown) => {
      // Kept as "asked just now" so a failing site is not asked on every page.
      writeFeedCountCache({ count: 0, more: false, at: Date.now(), seen, href });
      showFeedCount(link, { count: 0, more: false });
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
