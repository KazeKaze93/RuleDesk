import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearRawStorageCache, type BootLayoutSettings } from "../../src/boot/cheap-appearance";
import {
  FAVORITES_USER_KEY,
  readFavoritesUser,
  rememberFavoritesUser,
} from "../../src/boot/favorites-user";
import { FEED_COUNT_CACHE_KEY, FEED_COUNT_CLASS } from "../../src/boot/feed-count";
import { HEADER_LAYOUT_CSS } from "../../src/boot/header-layout";
import { installMenuSkeleton } from "../../src/boot/menu-skeleton";
import { FEED_MENU_ITEM_ID, MENU_ITEM_ID } from "../../src/pages/constants";

/**
 * What used to come into the menu after the first paint and push the items
 * after it to the right (seen on the site, 21.11.2026): "Favorites" on a page
 * without the site's own link, and the number beside "Feed".
 */

const LAYOUT: BootLayoutSettings = { tweaksEnabled: true, features: {}, featureChoice: {} };
const SEEN = 500;
const FEED_HREF = "https://rule34.xxx/index.php?page=post&s=list&tags=artist_a";

function buildHeader(siteFavoritesLink: boolean): void {
  document.body.innerHTML = `
<div id="header"><ul id="navbar">
  <li><a href="index.php?page=account&s=home">My Account</a></li>
  <li><a href="index.php?page=post&s=list">Posts</a></li>
  <li><a href="index.php?page=comment&s=list">Comments</a></li>
  ${
    siteFavoritesLink
      ? '<li id="my-favorites-container"><a href="index.php?page=favorites&s=view&id=77">My Favorites</a></li>'
      : ""
  }
</ul></div><div id="content"></div>`;
}

function stubStorage(seenPostId: number): void {
  vi.stubGlobal("GM_getValue", () => ({ version: 1, updates: { seenPostId } }));
  clearRawStorageCache();
}

function keepCount(value: { count: number; more: boolean; seen: number; href?: string }): void {
  window.localStorage.setItem(
    FEED_COUNT_CACHE_KEY,
    JSON.stringify({ at: Date.now(), href: FEED_HREF, ...value }),
  );
}

function favoritesLink(): HTMLAnchorElement | null {
  const link = document.getElementById(MENU_ITEM_ID.favorites)?.querySelector("a") ?? null;
  return link instanceof HTMLAnchorElement ? link : null;
}

function feedBadge(): Element | null {
  return document.getElementById(FEED_MENU_ITEM_ID)?.querySelector(`.${FEED_COUNT_CLASS}`) ?? null;
}

describe("menu items that must be there at the first paint", () => {
  beforeEach(() => {
    window.localStorage.clear();
    stubStorage(SEEN);
  });

  afterEach(() => {
    document.body.replaceChildren();
    document.head.replaceChildren();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    window.localStorage.clear();
    vi.unstubAllGlobals();
    clearRawStorageCache();
  });

  it("puts Favorites in from the kept id on a page without the site's link", () => {
    rememberFavoritesUser(77);
    buildHeader(false);
    expect(installMenuSkeleton(LAYOUT)).toBe(true);
    const link = favoritesLink();
    expect(link).not.toBeNull();
    expect(new URL(link?.href ?? "", "https://rule34.xxx/").searchParams.get("id")).toBe("77");
  });

  it("leaves Favorites out when there is neither the site's link nor a kept id", () => {
    buildHeader(false);
    installMenuSkeleton(LAYOUT);
    expect(favoritesLink()).toBeNull();
  });

  it("takes the id of the site's own link before the kept one", () => {
    rememberFavoritesUser(5);
    buildHeader(true);
    installMenuSkeleton(LAYOUT);
    const link = favoritesLink();
    expect(new URL(link?.href ?? "", "https://rule34.xxx/").searchParams.get("id")).toBe("77");
  });

  it("keeps only an id that is a positive whole number", () => {
    rememberFavoritesUser(0);
    rememberFavoritesUser(1.5);
    expect(readFavoritesUser()).toBeNull();
    window.localStorage.setItem(FAVORITES_USER_KEY, "12abc");
    expect(readFavoritesUser()).toBeNull();
    rememberFavoritesUser(12);
    expect(readFavoritesUser()).toBe("12");
  });

  it("shows the kept number beside Feed", () => {
    keepCount({ count: 38, more: false, seen: SEEN });
    buildHeader(true);
    installMenuSkeleton(LAYOUT);
    expect(feedBadge()?.textContent).toBe("38");
  });

  it("does not repeat the number when the menu is built again", () => {
    keepCount({ count: 42, more: true, seen: SEEN });
    buildHeader(true);
    installMenuSkeleton(LAYOUT);
    installMenuSkeleton(LAYOUT);
    const badges = document.querySelectorAll(`.${FEED_COUNT_CLASS}`);
    expect(badges).toHaveLength(1);
    expect(badges[0]?.textContent).toBe("42+");
  });

  it("shows no number kept for another seen mark", () => {
    keepCount({ count: 38, more: false, seen: SEEN - 1 });
    buildHeader(true);
    installMenuSkeleton(LAYOUT);
    expect(feedBadge()).toBeNull();
  });

  it("shows no number for none, on the feed itself, or with the counter off", () => {
    keepCount({ count: 0, more: false, seen: SEEN });
    buildHeader(true);
    installMenuSkeleton(LAYOUT);
    expect(feedBadge()).toBeNull();

    keepCount({ count: 38, more: false, seen: SEEN, href: window.location.href });
    buildHeader(true);
    installMenuSkeleton(LAYOUT);
    expect(feedBadge()).toBeNull();

    keepCount({ count: 38, more: false, seen: SEEN });
    buildHeader(true);
    installMenuSkeleton({ ...LAYOUT, features: { "feed-counter": false } });
    expect(feedBadge()).toBeNull();
  });

  it("styles the number from the menu's own stylesheet, with no body class in the way", () => {
    expect(HEADER_LAYOUT_CSS).toContain(`\n.${FEED_COUNT_CLASS} {`);
  });
});
