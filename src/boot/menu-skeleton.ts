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
import { resolveFeatureEnabled, type BootLayoutSettings } from "./cheap-appearance";
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

/** The address of the user's favorites, from the site's own menu link. */
function favoritesHref(): string | null {
  const link = document.querySelector(MY_FAVORITES_LINK_SELECTOR);
  const href = link?.getAttribute("href");
  if (href === null || href === undefined) {
    return null;
  }
  let userId: string | null;
  try {
    userId = new URL(href, window.location.href).searchParams.get(SEARCH_PARAM_ID);
  } catch {
    return null;
  }
  if (userId === null || !POSITIVE_INT.test(userId)) {
    return null;
  }
  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
  params.set(SEARCH_PARAM_SECTION, FAVORITES_SECTION_VIEW);
  params.set(SEARCH_PARAM_ID, userId);
  return `${SEARCH_PATH}?${params.toString()}`;
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
