import { describe, expect, it } from "vitest";

import { FEATURES } from "../../src/features/registry";

describe("FEATURES registry", () => {
  it("registers modules in order and omits removed ones", () => {
    const ids = FEATURES.map((feature) => feature.id);
    expect(ids).toEqual([
      "feed",
      "menu-cleanup",
      "tag-groups",
      "search-tools",
      "seen-dim",
      "playlist-menu",
      "playlist-bar",
      "blacklist-hide",
      "infinite-scroll",
      "post-actions",
      "grid-density",
      "thumb-tooltip",
      "favorites-bulk",
      "video-player",
      "video-preview",
      "cdn-fallback",
      "downloads",
      "image-zoom",
      "gif-post",
      "sidebar-right",
      "motion",
      "feed-counter",
    ]);
    expect(ids).not.toContain("top-bar");
    expect(ids).not.toContain("dark-theme");
    expect(ids).not.toContain("pager");
    expect(ids).not.toContain("followed-badge");
    expect(ids).not.toContain("search-tokens");
  });

  it("exposes favorites-bulk for the favorites page after first paint", () => {
    const feature = FEATURES.find((entry) => entry.id === "favorites-bulk");
    expect(feature).toBeDefined();
    expect(feature?.pages).toEqual(["favorites"]);
    expect(feature?.defaultEnabled).toBe(true);
  });
});

