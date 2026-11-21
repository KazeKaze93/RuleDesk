import { rememberFavoritesUser } from "../boot/favorites-user";
import { NAV_DUE_CLASS, applyHeaderLayout, markFavoritesCurrent } from "../boot/header-layout";
import { currentBackupStatus } from "../storage/history";
import {
  FAVORITES_PAGE,
  FAVORITES_SECTION_VIEW,
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
} from "../config/constants";
import { resolveFavoritesUserId } from "../site/favorites-sync";
import { getSyncState, setSyncState } from "../storage/favs";
import type { FavsSyncState } from "../storage/schema";
import { getFeatureEnabled } from "../storage/store";
import {
  CURRENT_PAGE_CLASS,
  FEED_MENU_ITEM_ID,
  HEADER_SELECTOR,
  MENU_ITEM_ID,
  MENU_LABEL,
  MY_FAVORITES_CONTAINER_ID,
  NAVBAR_SELECTOR,
  POSTS_LINK_TEXT,
  RDW_HASH_COLLECTIONS,
  RDW_HASH_FOLLOWING,
  RDW_HASH_SETTINGS,
  RDW_HASH_STATS,
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_STATS,
  STATS_MENU_SETTING_ID,
  type RdwRoute,
} from "./constants";

const CONTENT_ID = "content";
/** Stub pids when persisting userId with no prior sync blob. */
const FAVORITES_USER_ID_STUB_PID = 0;

let savedSiteCurrent: HTMLLIElement | null = null;
let siteCurrentCaptured = false;

function isHeaderMenuListItem(listItem: Element, content: Element | null): boolean {
  if (content !== null && content.contains(listItem)) {
    return false;
  }
  return true;
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
    if (listItem === null || !(listItem instanceof HTMLLIElement)) {
      continue;
    }
    if (!isHeaderMenuListItem(listItem, content)) {
      continue;
    }
    return listItem;
  }
  return null;
}

function findNavbar(): HTMLUListElement | null {
  const navbar = document.querySelector(NAVBAR_SELECTOR);
  return navbar instanceof HTMLUListElement ? navbar : null;
}

function findHeader(): HTMLElement | null {
  const header = document.querySelector(HEADER_SELECTOR);
  return header instanceof HTMLElement ? header : null;
}

/**
 * Persist favorites owner id on the favs sync blob (Package E shape).
 * Creates a finished stub when no sync exists so the UI does not show Resume.
 */
export function persistFavoritesUserId(userId: number): void {
  if (!Number.isFinite(userId) || userId <= 0) {
    return;
  }
  const normalized = Math.trunc(userId);
  // For the menu built before the first paint on a page without the site's link.
  rememberFavoritesUser(normalized);
  const existing = getSyncState();
  if (existing?.userId === normalized) {
    return;
  }
  if (existing !== undefined) {
    const next: FavsSyncState = { ...existing, userId: normalized };
    setSyncState(next);
    return;
  }
  const now = new Date().toISOString();
  setSyncState({
    nextPid: FAVORITES_USER_ID_STUB_PID,
    lastPid: FAVORITES_USER_ID_STUB_PID,
    startedAt: now,
    finishedAt: now,
    userId: normalized,
  });
}

function buildFavoritesHrefFromUserId(userId: number): string {
  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
  params.set(SEARCH_PARAM_SECTION, FAVORITES_SECTION_VIEW);
  params.set(SEARCH_PARAM_ID, String(userId));
  return `${SEARCH_PATH}?${params.toString()}`;
}

/**
 * Favorites → site page; null when user id is unknown.
 * Sources (Package E): menu link → favorites URL id → saved sync userId.
 * Always persists a resolved id.
 */
export function resolveFavoritesHref(
  root: ParentNode = document,
  search: string = window.location.search,
): string | null {
  const userId = resolveFavoritesUserId(
    root,
    search,
    getSyncState()?.userId,
  );
  if (userId === null || userId <= 0) {
    return null;
  }
  persistFavoritesUserId(userId);
  return buildFavoritesHrefFromUserId(userId);
}

function ensureMenuLink(
  id: string,
  label: string,
  href: string,
): HTMLLIElement {
  const existing = document.getElementById(id);
  if (existing instanceof HTMLLIElement) {
    const anchor = existing.querySelector("a");
    if (anchor instanceof HTMLAnchorElement) {
      anchor.textContent = label;
      anchor.href = href;
    }
    return existing;
  }
  const item = document.createElement("li");
  item.id = id;
  const anchor = document.createElement("a");
  anchor.textContent = label;
  anchor.href = href;
  item.append(anchor);
  return item;
}

function hideNativeMyFavorites(): void {
  const container = document.getElementById(MY_FAVORITES_CONTAINER_ID);
  if (container instanceof HTMLLIElement) {
    container.hidden = true;
  }
}

function insertionAnchorAfterFeedOrPosts(): HTMLLIElement | null {
  const feed = document.getElementById(FEED_MENU_ITEM_ID);
  if (feed instanceof HTMLLIElement) {
    return feed;
  }
  return findPostsMenuItem();
}

/**
 * Navbar: after Posts/Feed → Collections, Following, Favorites; end → RuleDesk.
 * No-op when div#header / ul#navbar missing.
 */
export function installSiteMenu(): void {
  if (findHeader() === null) {
    return;
  }
  const navbar = findNavbar();
  if (navbar === null) {
    return;
  }

  const anchor = insertionAnchorAfterFeedOrPosts();
  if (anchor === null) {
    return;
  }

  const collections = ensureMenuLink(
    MENU_ITEM_ID.collections,
    MENU_LABEL.collections,
    RDW_HASH_COLLECTIONS,
  );
  const following = ensureMenuLink(
    MENU_ITEM_ID.following,
    MENU_LABEL.following,
    RDW_HASH_FOLLOWING,
  );

  if (collections.parentElement !== navbar) {
    anchor.after(collections);
  } else if (collections.previousElementSibling !== anchor) {
    anchor.after(collections);
  }
  if (following.previousElementSibling !== collections) {
    collections.after(following);
  }

  const favoritesHref = resolveFavoritesHref();
  const existingFavorites = document.getElementById(MENU_ITEM_ID.favorites);
  if (favoritesHref === null) {
    if (existingFavorites !== null) {
      existingFavorites.remove();
    }
  } else {
    const favorites = ensureMenuLink(
      MENU_ITEM_ID.favorites,
      MENU_LABEL.favorites,
      favoritesHref,
    );
    if (favorites.previousElementSibling !== following) {
      following.after(favorites);
    }
  }

  // Statistics sits after Favorites (or Following) unless switched off in settings.
  const existingStats = document.getElementById(MENU_ITEM_ID.stats);
  if (getFeatureEnabled(STATS_MENU_SETTING_ID, true)) {
    const stats = ensureMenuLink(MENU_ITEM_ID.stats, MENU_LABEL.stats, RDW_HASH_STATS);
    const before = document.getElementById(MENU_ITEM_ID.favorites) ?? following;
    if (stats.previousElementSibling !== before) {
      before.after(stats);
    }
  } else if (existingStats !== null) {
    existingStats.remove();
  }

  hideNativeMyFavorites();

  const settings = ensureMenuLink(
    MENU_ITEM_ID.settings,
    MENU_LABEL.settings,
    RDW_HASH_SETTINGS,
  );
  if (settings.parentElement !== navbar || navbar.lastElementChild !== settings) {
    navbar.append(settings);
  }
  // Items added here (Favorites, Statistics) join the header layout.
  applyHeaderLayout(navbar);
  markBackupDue();
}

const BACKUP_DUE_TITLE = "RuleDesk: time to export a backup (Data)";

/** A dot on the RuleDesk item while a backup is due; gone once one is made. */
export function markBackupDue(): void {
  const item = document.getElementById(MENU_ITEM_ID.settings);
  if (item === null) {
    return;
  }
  const due = currentBackupStatus().due;
  item.classList.toggle(NAV_DUE_CLASS, due);
  const link = item.querySelector("a");
  if (link !== null) {
    link.title = due ? BACKUP_DUE_TITLE : MENU_LABEL.settings;
  }
}

function menuItemIdForRoute(route: RdwRoute): string {
  if (route === RDW_ROUTE_COLLECTIONS) {
    return MENU_ITEM_ID.collections;
  }
  if (route === RDW_ROUTE_FOLLOWING) {
    return MENU_ITEM_ID.following;
  }
  if (route === RDW_ROUTE_STATS) {
    return MENU_ITEM_ID.stats;
  }
  return MENU_ITEM_ID.settings;
}

function captureSiteCurrentIfNeeded(): void {
  if (siteCurrentCaptured) {
    return;
  }
  siteCurrentCaptured = true;
  const navbar = findNavbar();
  if (navbar === null) {
    savedSiteCurrent = null;
    return;
  }
  const current = navbar.querySelector(`li.${CURRENT_PAGE_CLASS}`);
  savedSiteCurrent =
    current instanceof HTMLLIElement &&
    !Object.values<string>(MENU_ITEM_ID).includes(current.id)
      ? current
      : null;
}

function clearAllOwnCurrent(): void {
  for (const id of Object.values(MENU_ITEM_ID)) {
    const item = document.getElementById(id);
    if (item instanceof HTMLLIElement) {
      item.classList.remove(CURRENT_PAGE_CLASS);
    }
  }
}

/** Mark the own-page nav item; remember site current-page for restore. */
export function setOwnPageCurrentHighlight(route: RdwRoute): void {
  captureSiteCurrentIfNeeded();
  const navbar = findNavbar();
  if (navbar !== null) {
    for (const child of navbar.querySelectorAll(`li.${CURRENT_PAGE_CLASS}`)) {
      child.classList.remove(CURRENT_PAGE_CLASS);
    }
  }
  clearAllOwnCurrent();
  const item = document.getElementById(menuItemIdForRoute(route));
  if (item instanceof HTMLLIElement) {
    item.classList.add(CURRENT_PAGE_CLASS);
  }
}

/** Restore site current-page after leaving #rdw/ routes. */
export function clearOwnPageCurrentHighlight(): void {
  clearAllOwnCurrent();
  if (savedSiteCurrent !== null && savedSiteCurrent.isConnected) {
    savedSiteCurrent.classList.add(CURRENT_PAGE_CLASS);
  }
  savedSiteCurrent = null;
  siteCurrentCaptured = false;
  const navbar = findNavbar();
  if (navbar !== null) {
    markFavoritesCurrent(navbar);
  }
}
