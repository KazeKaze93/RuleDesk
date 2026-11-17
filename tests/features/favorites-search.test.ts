import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FAVORITES_BROWSING_BODY_CLASS,
  RESULTS_CHUNK,
  buildFavoriteCell,
  favoritesGridRoot,
  hideFavoriteResults,
  resetFavoritesBrowserState,
  showFavoriteResults,
} from "../../src/features/favorites-browser";
import {
  MEDIA_ALL,
  MEDIA_IMAGES,
  MEDIA_VIDEOS,
  filterFavoriteIndex,
  isEmptyFavoritesQuery,
  parseFavoritesQuery,
} from "../../src/features/favorites-search";
import { readFavoriteIndexEntries } from "../../src/site/favorites-index-read";
import { listFavoriteThumbEntries } from "../../src/site/favorites-page";
import type { FavoriteIndexEntry } from "../../src/storage/favorites-index";

function entry(id: number, tags: string, run = 1000, pos = 0): FavoriteIndexEntry {
  return {
    id,
    tags,
    thumb: `https://wimg.rule34.xxx/thumbnails//1/thumbnail_${String(id)}.jpg?${String(id)}`,
    run,
    pos,
  };
}

function ids(entries: readonly FavoriteIndexEntry[]): number[] {
  return entries.map((item) => item.id);
}

const ENTRIES = [
  entry(1, "girls cat catgirl solo", 1000, 2),
  entry(2, "boy cat_ears sound video", 1000, 0),
  entry(3, "girls dog solo", 1000, 1),
  entry(4, "girls cat animated", 2000, 5),
];
const ALL_FAVORITES = new Set([1, 2, 3, 4]);

describe("favorites search", () => {
  afterEach(() => {
    resetFavoritesBrowserState();
    document.body.replaceChildren();
    document.body.className = "";
    vi.unstubAllGlobals();
  });

  it("needs every tag, drops excluded ones, and takes a star as any characters", () => {
    const find = (text: string): number[] =>
      ids(filterFavoriteIndex(ENTRIES, ALL_FAVORITES, parseFavoritesQuery(text), MEDIA_ALL));
    expect(find("cat")).toEqual([4, 1]);
    expect(find("CAT solo")).toEqual([1]);
    expect(find("cat*")).toEqual([4, 2, 1]);
    expect(find("girls -cat")).toEqual([3]);
    expect(find("-girls")).toEqual([2]);
    expect(find("nothing_like_this")).toEqual([]);
    expect(isEmptyFavoritesQuery(parseFavoritesQuery("  "))).toBe(true);
  });

  it("keeps the site's order: the newest sync run first, then the place in the list", () => {
    const all = filterFavoriteIndex(ENTRIES, ALL_FAVORITES, parseFavoritesQuery(""), MEDIA_ALL);
    expect(ids(all)).toEqual([4, 2, 3, 1]);
  });

  it("splits by media and leaves out what is no longer a favorite", () => {
    const empty = parseFavoritesQuery("");
    expect(ids(filterFavoriteIndex(ENTRIES, ALL_FAVORITES, empty, MEDIA_VIDEOS))).toEqual([2]);
    expect(ids(filterFavoriteIndex(ENTRIES, ALL_FAVORITES, empty, MEDIA_IMAGES))).toEqual([4, 3, 1]);
    expect(ids(filterFavoriteIndex(ENTRIES, new Set([3]), empty, MEDIA_ALL))).toEqual([3]);
  });

  it("reads index entries from a favorites page of the site", () => {
    const page = new DOMParser().parseFromString(
      `<div class="image-list">
        <span><span class="thumb"><a id="p19337851" href="#"><img src="https://wimg.rule34.xxx/thumbnails//231/thumbnail_a.jpg?19337851" title="i_generated animated vide" alt="image_thumb"></a></span></span>
        <span><span class="thumb"><a id="p5" href="#"><img src="https://example.test/x.jpg" title="girls solo" alt="image_thumb"></a></span></span>
      </div>`,
      "text/html",
    );
    expect(readFavoriteIndexEntries(page, 7000, 50, "https://rule34.xxx/")).toEqual([
      {
        id: 19337851,
        tags: "i_generated animated vide",
        thumb: "https://wimg.rule34.xxx/thumbnails//231/thumbnail_a.jpg?19337851",
        run: 7000,
        pos: 50,
        cut: true,
      },
      // An address that is not the site's is not kept.
      { id: 5, tags: "girls solo", thumb: "", run: 7000, pos: 51, cut: true },
    ]);
  });

  it("draws results with the site's cell markup, a chunk at a time", () => {
    const siteList = document.createElement("div");
    siteList.className = "image-list";
    document.body.append(siteList);
    const many = Array.from({ length: RESULTS_CHUNK + 20 }, (_, index) =>
      entry(index + 1, "girls solo", 1000, index),
    );

    showFavoriteResults(many);
    expect(document.body.classList.contains(FAVORITES_BROWSING_BODY_CLASS)).toBe(true);
    const results = favoritesGridRoot();
    expect(results).not.toBe(document);
    expect(listFavoriteThumbEntries(results)).toHaveLength(RESULTS_CHUNK);

    const more = document.querySelector("button.rdw-fav-more");
    if (!(more instanceof HTMLButtonElement)) {
      throw new Error("no Show more button");
    }
    expect(more.hidden).toBe(false);
    more.click();
    expect(listFavoriteThumbEntries(results)).toHaveLength(RESULTS_CHUNK + 20);
    expect(more.hidden).toBe(true);

    hideFavoriteResults();
    expect(document.body.classList.contains(FAVORITES_BROWSING_BODY_CLASS)).toBe(false);
    expect(favoritesGridRoot()).toBe(document);
  });

  it("builds a cell the rest of the script reads like a site cell", () => {
    const cell = buildFavoriteCell(entry(42, "boy sound video"));
    const link = cell.querySelector("span.thumb > a");
    expect(link?.id).toBe("p42");
    expect(link?.getAttribute("href")).toBe("index.php?page=post&s=view&id=42");
    expect(cell.querySelector("span.thumb > a > img")?.getAttribute("title")).toBe(
      "boy sound video",
    );
    expect(cell.querySelector(":scope > a[onclick]")?.getAttribute("onclick")).toContain(
      "s=delete&id=42",
    );
  });
});
