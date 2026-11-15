import { afterEach, describe, expect, it, vi } from "vitest";

import type { BootLayoutSettings } from "../../src/boot/cheap-appearance";
import { reserveSearchTools } from "../../src/boot/layout";
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
    .map((item) => item.textContent?.trim() ?? "");
}

describe("menu skeleton", () => {
  afterEach(() => {
    document.body.replaceChildren();
    window.localStorage.clear();
  });

  it("does nothing while the menu is not in the page", () => {
    expect(installMenuSkeleton(LAYOUT)).toBe(false);
  });

  it("puts the script's items after Posts and RuleDesk at the end", () => {
    buildHeader(true);
    expect(installMenuSkeleton(LAYOUT)).toBe(true);
    expect(menuLabels()).toEqual([
      "My Account",
      "Posts",
      "Feed",
      "Collections",
      "Following",
      "Favorites",
      "Statistics",
      "Comments",
      "RuleDesk",
    ]);
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
      "My Account",
      "Posts",
      "Collections",
      "Following",
      "Comments",
      "RuleDesk",
    ]);
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
