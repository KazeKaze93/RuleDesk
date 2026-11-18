import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY } from "../../src/config/constants";
import {
  collectionKindsLine,
  computeStats,
  StatsSection,
  STATS_SECTION_CSS,
} from "../../src/pages/stats-section";
import type { FavoriteIndexEntry } from "../../src/storage/favorites-index";
import { createDefaultStorage } from "../../src/storage/schema";
import { clearStorageCache } from "../../src/storage/store";

const READ_AT = new Date(2026, 10, 17, 11, 12).getTime();
const FAVORITE_IDS = [1, 2];
const TOP_TAGS_LIMIT = 20;
const SKELETON_SELECTOR = ".rdw-stats-skeleton";
const SKELETON_ROW_SELECTOR = ".rdw-stats-skeleton > div";
const TAG_ROW_SELECTOR = ".rdw-stats-top:not(.rdw-stats-top--plain) > .rdw-stats-top-row";
const PLAIN_ROW_SELECTOR = ".rdw-stats-top--plain > .rdw-stats-top-row";
const BAR_SELECTOR = ".rdw-stats-top-bar";
const HEADING_SELECTOR = ".rdw-stats-heading";
const PROFILE_HEAD_SELECTOR = ".rdw-stats-profile-head";
const TILE_SELECTOR = ".rdw-stats-tile";

const mocks = vi.hoisted(() => ({
  readFavoriteIndex: vi.fn<() => Promise<FavoriteIndexEntry[]>>(),
  refreshProfileStats: vi.fn(),
}));

vi.mock("../../src/storage/favorites-index", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/storage/favorites-index")>()),
  readFavoriteIndex: mocks.readFavoriteIndex,
}));

vi.mock("../../src/storage/favs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/storage/favs")>()),
  loadFavSet: (): Set<number> => new Set(FAVORITE_IDS),
}));

vi.mock("../../src/site/profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/site/profile")>()),
  // Read a moment ago: the page has no reason to ask the site.
  readStoredProfileStats: () => ({
    joinDate: "2019-08-23",
    level: "Members",
    posts: 2753,
    readAt: READ_AT,
  }),
  refreshProfileStats: mocks.refreshProfileStats,
}));

function tile(stats: ReturnType<typeof computeStats>, label: string): number | undefined {
  return stats.tiles.find((entry) => entry.label === label)?.value;
}

function libraryWithCollections(): ReturnType<typeof createDefaultStorage> {
  const data = createDefaultStorage();
  data.collections = [
    { id: "c1", name: "One", tags: [], kind: "posts", postIds: [1, 2, 3] },
    { id: "c2", name: "Two", tags: [], kind: "posts", postIds: [3, 4] },
    { id: "c3", name: "Empty", tags: [], kind: "posts", postIds: [] },
    {
      id: "d1",
      name: "Search",
      tags: [],
      kind: "search",
      query: "cat",
      postCount: { value: 3_653_399, exact: true },
    },
    { id: "d2", name: "Not opened", tags: [], kind: "search", query: "dog" },
  ];
  return data;
}

describe("computeStats", () => {
  it("counts what is stored and ranks collections by size", () => {
    const data = libraryWithCollections();
    data.artists = [
      { tag: "small", postCount: { value: 5, exact: true }, lastPostId: 90 },
      { tag: "unknown" },
    ];
    data.marks = { "1": { seen: true }, "2": { seen: true }, "3": {} };

    const stats = computeStats(data, 42);

    expect(tile(stats, "Followed artists")).toBe(2);
    expect(tile(stats, "Collections")).toBe(5);
    // Post 3 is in two collections and counts once.
    expect(tile(stats, "Posts in custom collections")).toBe(4);
    expect(tile(stats, "Favorites")).toBe(42);
    expect(tile(stats, "Seen posts")).toBe(2);
    expect(tile(stats, "Stored data")).toBeGreaterThan(0);
    expect(tile(stats, "Artists with new posts")).toBeUndefined();
    expect(stats.customCollections).toBe(3);
    expect(stats.dynamicCollections).toBe(2);
    // Empty and never opened collections have nothing to compare.
    expect(stats.topCollections).toEqual([
      { id: "d1", name: "Search", posts: 3_653_399 },
      { id: "c1", name: "One", posts: 3 },
      { id: "c2", name: "Two", posts: 2 },
    ]);
  });

  it("says the two kinds of collections in the Collections tile, not in a chart", () => {
    expect(collectionKindsLine(3, 8)).toBe("3 custom · 8 dynamic");

    const stats = computeStats(libraryWithCollections(), 0);
    expect(stats.tiles.find((entry) => entry.label === "Collections")?.detail).toBe(
      "3 custom · 2 dynamic",
    );

    const empty = computeStats(createDefaultStorage(), 0);
    expect(empty.tiles.find((entry) => entry.label === "Collections")?.detail).toBeUndefined();
    expect(empty.topCollections).toEqual([]);
  });
});

describe("StatsSection", () => {
  let host: HTMLElement;
  let giveIndex: (entries: FavoriteIndexEntry[]) => void = () => undefined;

  beforeEach(() => {
    clearStorageCache();
    const data = libraryWithCollections();
    vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown): unknown =>
      key === STORAGE_KEY ? data : defaultValue,
    );
    vi.stubGlobal("GM_setValue", (): void => undefined);
    mocks.readFavoriteIndex.mockReset();
    mocks.refreshProfileStats.mockReset();
    mocks.readFavoriteIndex.mockImplementation(
      () =>
        new Promise<FavoriteIndexEntry[]>((resolve) => {
          giveIndex = resolve;
        }),
    );
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(READ_AT);
    host = document.createElement("div");
    document.body.append(host);
  });

  afterEach(() => {
    render(null, host);
    host.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    clearStorageCache();
  });

  async function mount(): Promise<void> {
    await act(async () => {
      render(h(StatsSection, {}), host);
      await Promise.resolve();
    });
  }

  function texts(selector: string): string[] {
    return Array.from(host.querySelectorAll(selector), (node) => node.textContent ?? "");
  }

  it("keeps the room of Top tags with grey rows until the tags are counted", async () => {
    await mount();

    expect(texts(HEADING_SELECTOR)).toContain("Top tags in favorites");
    expect(host.querySelectorAll(SKELETON_ROW_SELECTOR)).toHaveLength(TOP_TAGS_LIMIT);
    expect(host.querySelector(SKELETON_SELECTOR)?.getAttribute("role")).toBe("status");

    await act(async () => {
      giveIndex([
        { id: 1, tags: "cat long_hair", thumb: "", run: 1, pos: 0, cut: false },
        { id: 2, tags: "cat", thumb: "", run: 1, pos: 1, cut: false },
      ]);
      await Promise.resolve();
    });

    expect(host.querySelector(SKELETON_SELECTOR)).toBeNull();
    expect(texts(TAG_ROW_SELECTOR)).toEqual(["cat2", "long hair1"]);
  });

  it("gives a grey row the height of a real one and moves it only when motion is welcome", () => {
    const rowHeight = /\.rdw-stats-top-row \{[^}]*min-height: (\d+)px/.exec(STATS_SECTION_CSS)?.[1];
    const greyHeight = /\.rdw-stats-skeleton > div \{[^}]*height: (\d+)px/.exec(
      STATS_SECTION_CSS,
    )?.[1];
    expect(rowHeight).toBeDefined();
    expect(greyHeight).toBe(rowHeight);

    const animated = STATS_SECTION_CSS.indexOf("animation:");
    const motionGate = STATS_SECTION_CSS.indexOf("@media (prefers-reduced-motion: no-preference)");
    expect(motionGate).toBeGreaterThanOrEqual(0);
    expect(animated).toBeGreaterThan(motionGate);
    expect(STATS_SECTION_CSS.indexOf("animation:", animated + 1)).toBe(-1);
  });

  it("lists the collections by posts as numbers, largest first, without bars", async () => {
    await mount();

    expect(texts(PLAIN_ROW_SELECTOR)).toEqual(["Search3,653,399", "One3", "Two2"]);
    const rows = Array.from(host.querySelectorAll(PLAIN_ROW_SELECTOR));
    expect(rows.every((row) => row.querySelector(BAR_SELECTOR) === null)).toBe(true);
    expect(host.textContent).not.toContain("Collections by type");
    expect(host.querySelector("svg")).toBeNull();
  });

  it("writes the kinds in the Collections tile and the account age under its start", async () => {
    await mount();

    const tiles = texts(TILE_SELECTOR);
    expect(tiles).toContain("5Collections3 custom · 2 dynamic");
    expect(tiles).toContain("Since Aug 20197 years 2 months");
    expect(tiles).toContain("MembersLevel");
  });

  it("heads the profile as the other blocks, the button to the right, the time in one format", async () => {
    await mount();

    expect(texts(HEADING_SELECTOR)).toEqual([
      "Collections by posts",
      "Site profile",
      "Top tags in favorites",
    ]);
    const head = host.querySelector(PROFILE_HEAD_SELECTOR);
    expect(head?.firstElementChild?.textContent).toBe("Site profile");
    expect(head?.lastElementChild?.querySelector("button")?.textContent).toBe("Refresh profile");
    expect(head?.textContent).toContain("Read on 17 Nov 2026, 11:12");
    // Read a moment ago: opening the page asks the site nothing.
    expect(mocks.refreshProfileStats).not.toHaveBeenCalled();
  });
});
