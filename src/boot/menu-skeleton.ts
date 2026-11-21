import {
  FAVORITES_PAGE,
  FAVORITES_SECTION_VIEW,
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
} from "../config/constants";
import {
  FEED_MENU_ITEM_ID,
  MENU_ITEM_ID,
  MENU_LABEL,
  MY_FAVORITES_CONTAINER_ID,
  NAVBAR_SELECTOR,
  POSTS_LINK_TEXT,
  RDW_HASH_COLLECTIONS,
  RDW_HASH_FOLLOWING,
  RDW_HASH_SETTINGS,
  RDW_HASH_STATS,
  STATS_MENU_SETTING_ID,
} from "../pages/constants";
import {
  peekSeenPostId,
  resolveFeatureEnabled,
  type BootLayoutSettings,
} from "./cheap-appearance";
import { readFavoritesUser } from "./favorites-user";
import { readFeedCountCache, sameSearch, showFeedCount } from "./feed-count";
import { applyHeaderLayout } from "./header-layout";
import {
  STICKY_HEADER_DEFAULT,
  STICKY_HEADER_SETTING_ID,
  applyStickyHeader,
} from "./sticky-header";

/**
 * Puts the script's items into the site menu as soon as the menu is parsed,
 * before the page is first painted. Without this the site's own items show
 * first and the script's ones push in between them a moment later.
 *
 * Only what is cheap is done here: the items, their labels and addresses that
 * need no storage. The menu code and the Feed feature find the items by id
 * later and finish them (the Feed address, the current-page mark), and take
 * out an item that turns out not to belong.
 *
 * Nothing heavy may be imported here: this runs before the first paint.
 */

const FEED_FEATURE_ID = "feed";
const FEED_COUNTER_FEATURE_ID = "feed-counter";
const FEED_LABEL = "Feed";
const MY_FAVORITES_LINK_SELECTOR = `li#${MY_FAVORITES_CONTAINER_ID} a[href*="page=favorites"]`;
const POSITIVE_INT = /^[1-9]\d*$/;

function findPostsItem(navbar: Element): HTMLLIElement | null {
  for (const anchor of navbar.querySelectorAll("li > a")) {
    if ((anchor.textContent?.trim() ?? "") === POSTS_LINK_TEXT) {
      const item = anchor.parentElement;
      return item instanceof HTMLLIElement ? item : null;
    }
  }
  return null;
}

function makeItem(id: string, label: string, href: string): HTMLLIElement {
  const item = document.createElement("li");
  item.id = id;
  const anchor = document.createElement("a");
  anchor.textContent = label;
  anchor.href = href;
  item.append(anchor);
  return item;
}

/** The id in the site's own menu link, or null when the page has no such link. */
function userIdFromSiteLink(): string | null {
  const link = document.querySelector(MY_FAVORITES_LINK_SELECTOR);
  const href = link?.getAttribute("href");
  if (href === null || href === undefined) {
    return null;
  }
  try {
    const userId = new URL(href, window.location.href).searchParams.get(SEARCH_PARAM_ID);
    return userId !== null && POSITIVE_INT.test(userId) ? userId : null;
  } catch {
    return null;
  }
}

/**
 * The address of the user's favorites: from the site's own menu link, and on a
 * page that has none (Comments) from the id kept by the menu code.
 */
function favoritesHref(): string | null {
  const userId = userIdFromSiteLink() ?? readFavoritesUser();
  if (userId === null) {
    return null;
  }
  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
  params.set(SEARCH_PARAM_SECTION, FAVORITES_SECTION_VIEW);
  params.set(SEARCH_PARAM_ID, userId);
  return `${SEARCH_PATH}?${params.toString()}`;
}

/**
 * The number beside "Feed", from the answer the feed counter kept on an earlier
 * page. Put in here so that it is there at the first paint: put in by the
 * feature, after the paint, it pushed every item after "Feed" to the right.
 * Only an answer for the present "seen" mark is shown; the feature checks its
 * age afterwards and changes the number in place.
 */
function showKeptFeedCount(): void {
  const link = document.getElementById(FEED_MENU_ITEM_ID)?.querySelector("a");
  const kept = readFeedCountCache();
  if (!(link instanceof HTMLAnchorElement) || kept === null) {
    return;
  }
  // On the feed itself the counter shows nothing: the page shows its new posts.
  if (kept.seen !== peekSeenPostId() || sameSearch(kept.href, window.location.href)) {
    return;
  }
  showFeedCount(link, kept);
}

/**
 * Inserts the items that are not there yet. Safe to call again. Returns false
 * while the menu is not in the page.
 */
export function installMenuSkeleton(layout: BootLayoutSettings): boolean {
  const navbar = document.querySelector(NAVBAR_SELECTOR);
  if (navbar === null) {
    return false;
  }
  const posts = findPostsItem(navbar);
  if (posts === null) {
    return false;
  }

  let last: Element = posts;
  const place = (id: string, label: string, href: string): void => {
    const existing = document.getElementById(id);
    if (existing !== null) {
      last = existing;
      return;
    }
    const item = makeItem(id, label, href);
    last.after(item);
    last = item;
  };

  // The Feed feature sets the real address when it mounts.
  if (resolveFeatureEnabled(layout, FEED_FEATURE_ID, true)) {
    place(FEED_MENU_ITEM_ID, FEED_LABEL, RDW_HASH_FOLLOWING);
    if (resolveFeatureEnabled(layout, FEED_COUNTER_FEATURE_ID, true)) {
      showKeptFeedCount();
    }
  }
  place(MENU_ITEM_ID.collections, MENU_LABEL.collections, RDW_HASH_COLLECTIONS);
  place(MENU_ITEM_ID.following, MENU_LABEL.following, RDW_HASH_FOLLOWING);

  const favorites = favoritesHref();
  if (favorites !== null) {
    place(MENU_ITEM_ID.favorites, MENU_LABEL.favorites, favorites);
    const native = document.getElementById(MY_FAVORITES_CONTAINER_ID);
    if (native instanceof HTMLElement) {
      native.hidden = true;
    }
  }
  if (layout.features[STATS_MENU_SETTING_ID] !== false) {
    place(MENU_ITEM_ID.stats, MENU_LABEL.stats, RDW_HASH_STATS);
  }
  if (document.getElementById(MENU_ITEM_ID.settings) === null) {
    navbar.append(makeItem(MENU_ITEM_ID.settings, MENU_LABEL.settings, RDW_HASH_SETTINGS));
  }
  applyHeaderLayout(navbar);
  if ((layout.features[STICKY_HEADER_SETTING_ID] ?? STICKY_HEADER_DEFAULT) === true) {
    applyStickyHeader(true);
  }
  return true;
}
