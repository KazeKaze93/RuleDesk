/**
 * The number beside "Feed" in the menu: what is kept of it between pages and
 * how it is drawn. Kept apart from the feature (features/feed-counter.ts)
 * because the menu is built before the first paint, and nothing heavy may be
 * imported there: the feature asks the site, this file only reads what the
 * feature left in the site's localStorage.
 */

export const FEED_COUNT_CLASS = "rdw-feed-count";
export const FEED_COUNT_CACHE_KEY = "ruledesk-web.feed-count";
/** Every post of the page is new: there are more behind it. */
const MORE_MARK = "+";

export type FeedCount = {
  readonly count: number;
  /** True when every post of the page was new. */
  readonly more: boolean;
};

export type CachedFeedCount = FeedCount & {
  readonly at: number;
  readonly seen: number;
  readonly href: string;
};

/**
 * Drawn from the menu's own stylesheet, which is in the page before the first
 * paint. From the feature's stylesheet, which comes after the paint, a number
 * put in early would stand unstyled for a moment and then change its width.
 */
export const FEED_COUNT_CSS = `
.${FEED_COUNT_CLASS} {
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
`.trim();

function isCachedFeedCount(value: unknown): value is CachedFeedCount {
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

export function readFeedCountCache(): CachedFeedCount | null {
  try {
    const raw = window.localStorage.getItem(FEED_COUNT_CACHE_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    return isCachedFeedCount(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeFeedCountCache(value: CachedFeedCount): void {
  try {
    window.localStorage.setItem(FEED_COUNT_CACHE_KEY, JSON.stringify(value));
  } catch {
    // A full or closed storage only means the next page asks again.
  }
}

/** "12", "42+", or nothing for none. */
export function feedCountText(value: FeedCount): string {
  if (value.count <= 0) {
    return "";
  }
  return value.more ? `${String(value.count)}${MORE_MARK}` : String(value.count);
}

/** True when both addresses are the same search of the site. */
export function sameSearch(a: string, b: string): boolean {
  try {
    return new URL(a, window.location.href).search === new URL(b, window.location.href).search;
  } catch {
    return false;
  }
}

/** Puts the number into the Feed link, changes the one there, or takes it out for none. */
export function showFeedCount(link: HTMLAnchorElement, value: FeedCount): void {
  const text = feedCountText(value);
  const existing = link.parentElement?.querySelector(`.${FEED_COUNT_CLASS}`) ?? null;
  if (text.length === 0) {
    existing?.remove();
    return;
  }
  const badge = existing ?? document.createElement("span");
  badge.className = FEED_COUNT_CLASS;
  if (badge.textContent !== text) {
    badge.textContent = text;
  }
  badge.setAttribute("aria-label", `${text} new posts in the feed`);
  if (existing === null) {
    link.append(badge);
  }
}
