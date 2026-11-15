import { SEARCH_PARAM_TAGS } from "../config/constants";
import { log } from "../log";
import {
  FEED_MENU_ITEM_ID,
  RDW_HASH_FOLLOWING,
} from "../pages/constants";
import {
  buildFeedUrl,
  findFeedGroupIndex,
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
} from "../search/query";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import { ensureThumbAnchor } from "../site/thumb";
import {
  readArtistsMirror,
  writeArtistsMirror,
} from "../storage/artists-mirror";
import {
  getSeenPostId,
  getUpdatesGroupSize,
  listArtistTags,
  reloadFromStorage,
} from "../storage/store";
import { ensureDocumentStyles } from "../ui/cards";
import { mountUpdatesBar } from "../ui/updates-bar";
import { rememberArtistsFromPage } from "./artist-snapshots";
import { FEED_MERGE_CSS, isMergedFeedPage, mountFeedMerge } from "./feed-merge";
import { onThumbsAdded } from "./runtime";
import {
  THUMB_ANCHOR_NAME,
  THUMB_CLASS,
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FEATURE_ID = "feed";
const FEATURE_LABEL = "Feed in site menu";
const FEATURE_PAGES = ["list", "post", "favorites", "other"] as const;

const CONTENT_ID = "content";
const POSTS_LINK_TEXT = "Posts";
const FEED_LINK_TEXT = "Feed";
const CURRENT_PAGE_CLASS = "current-page";
/** Class on thumbs newer than seenPostId (NEW plaque via feature CSS). */
export const FEED_NEW_CLASS = "new";

const NO_ARTISTS_TITLE = "Follow artists to build your feed";
const MISSING_POSTS_WARN = "feed: Posts menu item not found";

/**
 * Followed artists for Feed href / page recognition.
 * Prefers the localStorage mirror (fresh across pages); GM_getValue on bfcache
 * pages can return a frozen snapshot, so reloadFromStorage alone is not enough.
 */
function resolveFollowedArtistTags(): string[] {
  const mirrored = readArtistsMirror();
  if (mirrored !== null && mirrored.length > 0) {
    return [...mirrored];
  }
  return listArtistTags();
}

/**
 * store load/save syncs the mirror from GM. On bfcache pages that GM snapshot
 * is stale and would wipe tags followed on another page — restore afterward.
 */
function reloadStoragePreservingArtistsMirror(): void {
  const mirrored = readArtistsMirror();
  reloadFromStorage();
  if (mirrored !== null && mirrored.length > 0) {
    writeArtistsMirror(mirrored);
  }
}

const NEW_PLAQUE_LEFT_PX = 6;
const NEW_PLAQUE_TOP_PX = 6;
const NEW_PLAQUE_ACCENT = "#2f6fed";

const EVENT_PAGESHOW = "pageshow";
const EVENT_CLICK = "click";

const BODY_CLASS = featureBodyClass(FEATURE_ID);

const FEATURE_CSS = `
body.${BODY_CLASS} span.thumb.${FEED_NEW_CLASS}.${THUMB_CLASS} {
  position: relative;
}
body.${BODY_CLASS} span.thumb.${FEED_NEW_CLASS}.${THUMB_CLASS}::after {
  content: "NEW";
  position: absolute;
  z-index: 4;
  left: ${String(NEW_PLAQUE_LEFT_PX)}px;
  top: ${String(NEW_PLAQUE_TOP_PX)}px;
  background: ${NEW_PLAQUE_ACCENT};
  color: #fff;
  font: 700 9.5px system-ui, Segoe UI, sans-serif;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 9px;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  body.${BODY_CLASS} span.thumb.${FEED_NEW_CLASS}.${THUMB_CLASS}::after {
    position-anchor: ${THUMB_ANCHOR_NAME};
    left: calc(anchor(left) + ${String(NEW_PLAQUE_LEFT_PX)}px);
    top: calc(anchor(top) + ${String(NEW_PLAQUE_TOP_PX)}px);
  }
}
`;

let unsubscribeThumbsAdded: (() => void) | undefined;
let pageshowBound = false;
let boundFeedLink: HTMLAnchorElement | null = null;

/** Clears thumbs/pageshow/click subscriptions (tests). */
export function resetFeedRuntimeState(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    unsubscribeThumbsAdded();
    unsubscribeThumbsAdded = undefined;
  }
  if (pageshowBound) {
    window.removeEventListener(EVENT_PAGESHOW, onPageShow);
    pageshowBound = false;
  }
  if (boundFeedLink !== null) {
    boundFeedLink.removeEventListener(EVENT_CLICK, onFeedClick);
    boundFeedLink = null;
  }
}

function findPostsMenuItem(): HTMLLIElement | null {
  const content = document.getElementById(CONTENT_ID);
  const anchors = document.querySelectorAll("a");
  for (const node of anchors) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    if ((node.textContent?.trim() ?? "") !== POSTS_LINK_TEXT) {
      continue;
    }
    const listItem = node.closest("li");
    if (listItem === null) {
      continue;
    }
    if (content !== null && content.contains(listItem)) {
      continue;
    }
    return listItem;
  }
  return null;
}

function resolveFeedHref(): string {
  const artistTags = resolveFollowedArtistTags();
  if (artistTags.length === 0) {
    return RDW_HASH_FOLLOWING;
  }
  return buildFeedUrl(artistTags, getUpdatesGroupSize());
}

function findFeedLink(): HTMLAnchorElement | null {
  const feedItem = document.getElementById(FEED_MENU_ITEM_ID);
  if (!(feedItem instanceof HTMLLIElement)) {
    return null;
  }
  const feedLink = feedItem.querySelector("a");
  return feedLink instanceof HTMLAnchorElement ? feedLink : null;
}

/**
 * Recalculate Feed href from current followed artists (bfcache / late follow).
 * Uses the artists mirror first; falls back to a fresh GM read when the mirror
 * is missing or empty (GM alone is unreliable after Follow + Back / bfcache).
 */
export function refreshFeedHref(): void {
  const feedLink = findFeedLink();
  if (feedLink === null) {
    return;
  }
  feedLink.href = resolveFeedHref();
  const artistTags = resolveFollowedArtistTags();
  if (artistTags.length === 0) {
    feedLink.title = NO_ARTISTS_TITLE;
  } else {
    feedLink.removeAttribute("title");
  }
}

function onPageShow(): void {
  refreshFeedHref();
}

function onFeedClick(): void {
  refreshFeedHref();
}

function ensureFeedHrefListeners(feedLink: HTMLAnchorElement): void {
  if (!pageshowBound) {
    pageshowBound = true;
    window.addEventListener(EVENT_PAGESHOW, onPageShow);
  }
  if (boundFeedLink === feedLink) {
    return;
  }
  if (boundFeedLink !== null) {
    boundFeedLink.removeEventListener(EVENT_CLICK, onFeedClick);
  }
  feedLink.addEventListener(EVENT_CLICK, onFeedClick);
  boundFeedLink = feedLink;
}

function ensureFeedMenuItem(): HTMLLIElement | null {
  const existing = document.getElementById(FEED_MENU_ITEM_ID);
  if (existing instanceof HTMLLIElement) {
    const existingLink = existing.querySelector("a");
    if (existingLink instanceof HTMLAnchorElement) {
      refreshFeedHref();
      ensureFeedHrefListeners(existingLink);
    }
    return existing;
  }

  const postsItem = findPostsMenuItem();
  if (postsItem === null) {
    log.warn(MISSING_POSTS_WARN);
    return null;
  }

  const feedItem = document.createElement("li");
  feedItem.id = FEED_MENU_ITEM_ID;
  const feedLink = document.createElement("a");
  feedLink.textContent = FEED_LINK_TEXT;
  feedLink.href = resolveFeedHref();
  if (resolveFollowedArtistTags().length === 0) {
    feedLink.title = NO_ARTISTS_TITLE;
  }
  feedItem.append(feedLink);
  postsItem.after(feedItem);
  ensureFeedHrefListeners(feedLink);
  return feedItem;
}

function isFeedPage(search: string, artistTags: string[]): boolean {
  const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS);
  if (tagsParam === null || tagsParam.trim().length === 0) {
    return false;
  }
  return (
    isFullUpdatesQuery(tagsParam, artistTags) ||
    isPartialUpdatesQuery(tagsParam, artistTags) ||
    findFeedGroupIndex(tagsParam, artistTags, getUpdatesGroupSize()) >= 0
  );
}

function applyCurrentPageHighlight(
  feedItem: HTMLLIElement,
  onFeed: boolean,
  pageKind: FeatureContext["pageKind"],
): void {
  const postsItem = findPostsMenuItem();
  if (onFeed) {
    postsItem?.classList.remove(CURRENT_PAGE_CLASS);
    feedItem.classList.add(CURRENT_PAGE_CLASS);
    return;
  }
  feedItem.classList.remove(CURRENT_PAGE_CLASS);
  // List searches that are not the feed keep the site's Posts current-page.
  if (pageKind === "list") {
    postsItem?.classList.add(CURRENT_PAGE_CLASS);
  }
}

function markNewThumbs(root: ParentNode, seenPostId: number): void {
  if (seenPostId === 0) {
    return;
  }
  ensureDocumentStyles();
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    if (!(thumb instanceof HTMLElement)) {
      continue;
    }
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    const numeric = Number(postId);
    if (!Number.isFinite(numeric) || numeric <= seenPostId) {
      continue;
    }
    ensureThumbAnchor(thumb);
    thumb.classList.add(FEED_NEW_CLASS);
  }
}

function ensureNewThumbsSubscription(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    return;
  }
  unsubscribeThumbsAdded = onThumbsAdded((root) => {
    markNewThumbs(root, getSeenPostId());
  });
}

function mountFeed(ctx: FeatureContext): void {
  const feedItem = ensureFeedMenuItem();
  if (feedItem === null) {
    return;
  }

  // Mirror-first artist list — GM bfcache snapshots must not drive href / recognition.
  const artistTags = resolveFollowedArtistTags();
  reloadStoragePreservingArtistsMirror();
  const onFeed = isFeedPage(ctx.search, artistTags);
  applyCurrentPageHighlight(feedItem, onFeed, ctx.pageKind);

  if (ctx.pageKind === "list") {
    // Cover, count and newest post of followed artists, for the Following page.
    rememberArtistsFromPage(ctx.search);
  }

  if (!onFeed || ctx.pageKind !== "list") {
    return;
  }

  markNewThumbs(document, getSeenPostId());
  ensureNewThumbsSubscription();

  // More artists than one search holds: the page shows the first group only,
  // the other groups are read and merged into the same grid.
  const merged = isMergedFeedPage(ctx.search, artistTags, getUpdatesGroupSize());
  mountUpdatesBar(document, ctx.search, { merged });
  if (merged) {
    mountFeedMerge({
      artistTags,
      groupSize: getUpdatesGroupSize(),
      onChange: () => {
        mountUpdatesBar(document, ctx.search, { merged });
      },
    });
  }
}

export const feedFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: `${FEATURE_CSS}\n${FEED_MERGE_CSS}`,
  mount: mountFeed,
};
