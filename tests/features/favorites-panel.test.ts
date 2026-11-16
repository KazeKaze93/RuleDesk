import { afterEach, describe, expect, it } from "vitest";

import {
  HEADER_LAYOUT_CSS,
  applyHeaderLayout,
  syncAriaCurrent,
} from "../../src/boot/header-layout";
import { STALE_SYNC_DAYS, syncAge } from "../../src/features/favorites-bulk";
import {
  FIT_ATTRIBUTE,
  favoritesFilterSummary,
  fitControlsRow,
} from "../../src/features/favorites-browser";
import { MEDIA_ALL, MEDIA_IMAGES } from "../../src/features/favorites-search";
import { SITE_DARK_PALETTE, SITE_DEFAULT_PALETTE, contrastRatio } from "../../src/skin/theme";
import {
  CONTRAST_RATIO_TEXT_MIN,
  DARK_PALETTE,
  LIGHT_PALETTE,
  type TokenPalette,
} from "../../src/ui/tokens";

const DAY_MS = 86_400_000;
const NOW = Date.parse("2026-11-16T12:00:00Z");
/** The least contrast of a chosen option against the track it lies on. */
const SEGMENT_FILL_MIN = 1.5;

function at(daysAgo: number): string {
  return new Date(NOW - daysAgo * DAY_MS).toISOString();
}

describe("favorites panel: sync age", () => {
  it("says today, one day, several days", () => {
    expect(syncAge(at(0), NOW)).toEqual({ text: "Synced today.", stale: false });
    expect(syncAge(at(1), NOW)).toEqual({ text: "Synced 1 day ago.", stale: false });
    expect(syncAge(at(3), NOW).text).toBe("Synced 3 days ago.");
  });

  it("calls a sync stale only past the limit, and a missing one always", () => {
    expect(syncAge(at(STALE_SYNC_DAYS), NOW).stale).toBe(false);
    expect(syncAge(at(STALE_SYNC_DAYS + 1), NOW).stale).toBe(true);
    expect(syncAge(undefined, NOW)).toEqual({ text: "Never synced.", stale: true });
    expect(syncAge("not a date", NOW).stale).toBe(true);
  });
});

describe("favorites panel: what the list is narrowed to", () => {
  it("joins the query and the type, and leaves out what is not set", () => {
    expect(favoritesFilterSummary("  cat* -video ", MEDIA_IMAGES)).toBe("cat* -video · Images");
    expect(favoritesFilterSummary("cat", MEDIA_ALL)).toBe("cat");
    expect(favoritesFilterSummary("", MEDIA_ALL)).toBe("");
  });
});

describe("favorites panel: the row is squeezed by what fits, not by window width", () => {
  /** A row whose content is `widths[step]` wide at each step of squeezing. */
  function rowOf(clientWidth: number, widths: readonly number[]): HTMLElement {
    const row = document.createElement("div");
    Object.defineProperty(row, "clientWidth", { get: () => clientWidth });
    Object.defineProperty(row, "scrollWidth", {
      get: () => widths[Number(row.getAttribute(FIT_ATTRIBUTE) ?? "0")] ?? 0,
    });
    return row;
  }

  it("stops at the first step that fits", () => {
    expect(fitControlsRow(rowOf(1000, [900, 800, 700, 600]))).toBe(0);
    expect(fitControlsRow(rowOf(850, [900, 800, 700, 600]))).toBe(1);
    expect(fitControlsRow(rowOf(750, [900, 800, 700, 600]))).toBe(2);
  });

  it("wraps only when nothing else fits, and says so on the row", () => {
    const row = rowOf(500, [900, 800, 700, 500]);
    expect(fitControlsRow(row)).toBe(3);
    expect(row.getAttribute(FIT_ATTRIBUTE)).toBe("3");
  });

  it("goes back to the full row when there is room again", () => {
    let width = 500;
    const row = document.createElement("div");
    Object.defineProperty(row, "clientWidth", { get: () => width });
    Object.defineProperty(row, "scrollWidth", { get: () => 900 });
    expect(fitControlsRow(row)).toBe(3);
    width = 1000;
    expect(fitControlsRow(row)).toBe(0);
  });
});

describe("header: the current item", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    document.body.replaceChildren();
  });

  function buildNavbar(): Element {
    document.body.innerHTML = `
<div id="header"><h2 id="site-title"><a href="/">Rule 34</a></h2><ul id="navbar">
  <li><a href="index.php?page=post&s=list">Posts</a></li>
  <li id="rdw-nav-favorites"><a href="index.php?page=favorites&s=view&id=1">Favorites</a></li>
  <li id="my-favorites-container" hidden><a href="index.php?page=favorites&s=view&id=1">My Favorites</a></li>
</ul></div>`;
    const navbar = document.querySelector("ul#navbar");
    if (navbar === null) {
      throw new Error("no navbar");
    }
    return navbar;
  }

  it("marks Favorites on the Favorites page, with aria-current", () => {
    window.history.replaceState(null, "", "/index.php?page=favorites&s=view&id=1");
    const navbar = buildNavbar();
    applyHeaderLayout(navbar);

    const item = document.getElementById("rdw-nav-favorites");
    expect(item?.classList.contains("current-page")).toBe(true);
    expect(item?.querySelector("a")?.getAttribute("aria-current")).toBe("page");
    expect(
      document.getElementById("my-favorites-container")?.classList.contains("current-page"),
    ).toBe(false);
  });

  it("leaves the menu alone on other pages", () => {
    window.history.replaceState(null, "", "/index.php?page=post&s=list");
    const navbar = buildNavbar();
    applyHeaderLayout(navbar);
    expect(navbar.querySelector("li.current-page")).toBeNull();
    expect(navbar.querySelector("[aria-current]")).toBeNull();
  });

  it("moves aria-current with the current item", () => {
    const navbar = buildNavbar();
    const posts = navbar.querySelector("li");
    posts?.classList.add("current-page");
    syncAriaCurrent(navbar);
    expect(posts?.querySelector("a")?.getAttribute("aria-current")).toBe("page");
    posts?.classList.remove("current-page");
    syncAriaCurrent(navbar);
    expect(navbar.querySelector("[aria-current]")).toBeNull();
  });

  it("puts the title in the row of the menu only when the header is title plus menu", () => {
    expect(HEADER_LAYOUT_CSS).toContain(
      "div#header:has(> #site-title):has(> ul#navbar) > #site-title",
    );
  });
});

describe("contrast of secondary text and of the switch of options", () => {
  const PALETTES: readonly (readonly [string, TokenPalette])[] = [
    ["Light", LIGHT_PALETTE],
    ["Dark", DARK_PALETTE],
    ["Site default", SITE_DEFAULT_PALETTE],
    ["Site dark", SITE_DARK_PALETTE],
  ];

  function ratio(a: string, b: string): number {
    return contrastRatio(a, b) ?? 0;
  }

  /** A transparent track shows the page behind it. */
  function track(palette: TokenPalette): string {
    return palette.segTrack === "transparent" ? palette.bg : palette.segTrack;
  }

  it.each(PALETTES)("%s: secondary text reads on the page and on a card", (_name, palette) => {
    expect(ratio(palette.muted, palette.bg)).toBeGreaterThanOrEqual(CONTRAST_RATIO_TEXT_MIN);
    expect(ratio(palette.muted, palette.surface)).toBeGreaterThanOrEqual(CONTRAST_RATIO_TEXT_MIN);
  });

  it.each(PALETTES)("%s: the chosen option stands out from the track", (_name, palette) => {
    expect(ratio(palette.segOn, track(palette))).toBeGreaterThanOrEqual(SEGMENT_FILL_MIN);
  });

  it.each(PALETTES)("%s: both texts of the switch read", (_name, palette) => {
    expect(ratio(palette.segOnText, palette.segOn)).toBeGreaterThanOrEqual(CONTRAST_RATIO_TEXT_MIN);
    expect(ratio(palette.segText, track(palette))).toBeGreaterThanOrEqual(CONTRAST_RATIO_TEXT_MIN);
  });
});
