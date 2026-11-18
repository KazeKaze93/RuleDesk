import { afterEach, describe, expect, it, vi } from "vitest";

import type { BootLayoutSettings } from "../../src/boot/cheap-appearance";
import { reserveSearchTools } from "../../src/boot/layout";
import { HEADER_LAYOUT_CSS } from "../../src/boot/header-layout";
import { installMenuSkeleton } from "../../src/boot/menu-skeleton";
import {
  SEARCH_TOOLS_AI_ROW_BODY_CLASS,
  SEARCH_TOOLS_HEIGHT_KEY,
  readSearchToolsReserveHeight,
  rememberSearchToolsHeight,
} from "../../src/boot/search-tools-reserve";

const LAYOUT: BootLayoutSettings = { tweaksEnabled: true, features: {}, featureChoice: {} };

function buildHeader(withFavorites: boolean): void {
  document.body.innerHTML = `
<div id="header"><ul id="navbar">
  <li><a href="index.php?page=account&s=home">My Account</a></li>
  <li><a href="index.php?page=post&s=list">Posts</a></li>
  <li><a href="index.php?page=comment&s=list">Comments</a></li>
  ${
    withFavorites
      ? '<li id="my-favorites-container"><a href="index.php?page=favorites&s=view&id=77">My Favorites</a></li>'
      : ""
  }
</ul></div><div id="content"></div>`;
}

function menuLabels(): string[] {
  return [...document.querySelectorAll("#navbar > li")]
    .filter((item) => !(item instanceof HTMLElement && item.hidden))
    .map((item) => item.querySelector(":scope > a, :scope > button")?.textContent?.trim() ?? "");
}

describe("menu skeleton", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    window.localStorage.clear();
  });

  it("does nothing while the menu is not in the page", () => {
    expect(installMenuSkeleton(LAYOUT)).toBe(false);
  });

  it("puts the script's items after Posts and RuleDesk at the end", () => {
    buildHeader(true);
    expect(installMenuSkeleton(LAYOUT)).toBe(true);
    // The markup follows the look, so that Tab goes left to right: the site
    // has My Account first, and it is drawn among the icons at the right end.
    expect(menuLabels()).toEqual([
      "Posts",
      "Feed",
      "Collections",
      "Following",
      "Favorites",
      "More",
      "Statistics",
      "My Account",
      "RuleDesk",
    ]);
    // The rare sections sit inside "More", closed until it is pressed.
    const more = document.getElementById("rdw-nav-more");
    const list = more?.querySelector("ul");
    // Under the heading of its group.
    expect([...(list?.children ?? [])].map((item) => item.textContent?.trim())).toEqual([
      "Community",
      "Comments",
    ]);
    expect(list?.hidden).toBe(true);
    more?.querySelector("button")?.click();
    expect(list?.hidden).toBe(false);
    expect(more?.querySelector("button")?.getAttribute("aria-expanded")).toBe("true");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(list?.hidden).toBe(true);
    // Statistics, My Account and RuleDesk are icons with the label as a tooltip.
    expect(document.querySelector("li.rdw-nav-account > a")?.getAttribute("title")).toBe(
      "My Account",
    );
    expect(document.querySelectorAll("#navbar > li.rdw-nav-icon")).toHaveLength(3);
    const favorites = document.querySelector("#rdw-nav-favorites a");
    expect(favorites?.getAttribute("href")).toBe("/index.php?page=favorites&s=view&id=77");
  });

  it("adds nothing twice", () => {
    buildHeader(true);
    installMenuSkeleton(LAYOUT);
    installMenuSkeleton(LAYOUT);
    expect(document.querySelectorAll("#rdw-nav-collections")).toHaveLength(1);
    expect(document.querySelectorAll("#rdw-feed-menu")).toHaveLength(1);
    expect(document.querySelectorAll("#rdw-nav-settings")).toHaveLength(1);
  });

  it("leaves out what is switched off or unknown", () => {
    buildHeader(false);
    installMenuSkeleton({
      tweaksEnabled: true,
      features: { feed: false, "stats-menu": false },
      featureChoice: {},
    });
    expect(menuLabels()).toEqual([
      "Posts",
      "Collections",
      "Following",
      "More",
      "My Account",
      "RuleDesk",
    ]);
  });

  it("marks the links of the second row on Posts and makes the uploads buttons", () => {
    buildHeader(false);
    document
      .getElementById("header")
      ?.insertAdjacentHTML(
        "beforeend",
        '<ul id="subnavbar" class="flat-list"><li><a href="#">Video</a></li><li><a href="#">Upload</a></li><li><a href="#">Upload Video</a></li><li><a href="#">Random</a></li><li><a href="#">Edit</a></li></ul>',
      );
    installMenuSkeleton(LAYOUT);
    const classes = [...document.querySelectorAll("#subnavbar > li")].map((item) => item.className);
    // The uploads are drawn at the right end of the row and stand last in the markup too.
    expect(classes).toEqual([
      "rdw-subnav-video",
      "rdw-subnav-random",
      "",
      "rdw-subnav-upload rdw-subnav-action",
      "rdw-subnav-upload-video rdw-subnav-action",
    ]);
  });

  it("keeps the header and the sidebar in place unless the setting is off", () => {
    buildHeader(false);
    installMenuSkeleton({
      tweaksEnabled: true,
      features: { "sticky-header": false },
      featureChoice: {},
    });
    expect(document.documentElement.classList.contains("rdw-sticky-header")).toBe(false);
    document.body.replaceChildren();
    buildHeader(false);
    installMenuSkeleton(LAYOUT);
    expect(document.documentElement.classList.contains("rdw-sticky-header")).toBe(true);
    expect(HEADER_LAYOUT_CSS).toContain(
      "html.rdw-sticky-header div#post-list > div.sidebar,",
    );
    expect(HEADER_LAYOUT_CSS).toContain("overflow-y: auto");
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
  });

  it("hides the site's Filter AI row before the panel mounts", () => {
    window.history.replaceState(null, "", "?page=post&s=list&tags=cat");
    vi.stubGlobal("GM_getValue", (_key: string, fallback?: unknown): unknown => fallback);
    document.body.innerHTML =
      '<div class="tag-search"><form><input name="tags" type="text"></form></div>';
    expect(reserveSearchTools()).toBe(true);
    expect(document.body.classList.contains(SEARCH_TOOLS_AI_ROW_BODY_CLASS)).toBe(true);
    expect(document.getElementById("rdw-search-tools")).not.toBeNull();
    document.body.className = "";
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
  });

  it("reserves the remembered height of the search panel, or a default", () => {
    expect(readSearchToolsReserveHeight()).toBe(168);
    rememberSearchToolsHeight(351.4);
    expect(window.localStorage.getItem(SEARCH_TOOLS_HEIGHT_KEY)).toBe("351");
    expect(readSearchToolsReserveHeight()).toBe(351);
    window.localStorage.setItem(SEARCH_TOOLS_HEIGHT_KEY, "nonsense");
    expect(readSearchToolsReserveHeight()).toBe(168);
    rememberSearchToolsHeight(0);
    expect(readSearchToolsReserveHeight()).toBe(168);
  });
});
