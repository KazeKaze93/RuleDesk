import { describe, expect, it } from "vitest";

import { buildLiveEntry, readPostPageTags } from "../../src/features/favorites-index-live";
import { shuffleBySeed, topFavoriteTags } from "../../src/features/favorites-search";
import {
  SORT_CREATED,
  SORT_NAME,
  SORT_SIZE,
  sortCollections,
} from "../../src/pages/collections-page";
import type { Collection } from "../../src/storage/schema";
import type { FavoriteIndexEntry } from "../../src/storage/favorites-index";

function entry(id: number, tags: string): FavoriteIndexEntry {
  return { id, tags, thumb: "", run: 1, pos: id };
}

describe("favorites: index at the star, top tags, shuffle", () => {
  it("builds the entry of a new favorite so that it sorts first", () => {
    expect(
      buildLiveEntry(
        "42",
        ["1girl", "solo"],
        "https://wimg.rule34.xxx/thumbnails/1/thumbnail_a.jpg?42",
        5000,
      ),
    ).toEqual({
      id: 42,
      tags: "1girl solo",
      thumb: "https://wimg.rule34.xxx/thumbnails/1/thumbnail_a.jpg?42",
      run: 5000,
      pos: 0,
      cut: false,
    });
    // An address that is not the site's is not kept; a post without tags is not indexed.
    expect(buildLiveEntry("42", ["solo"], "https://example.test/a.jpg", 1)?.thumb).toBe("");
    expect(buildLiveEntry("42", [], null, 1)).toBeNull();
    expect(buildLiveEntry("abc", ["solo"], null, 1)).toBeNull();
  });

  it("reads the tags of a post page from its sidebar links", () => {
    document.body.innerHTML = `
<ul id="tag-sidebar">
  <li><h6>Artist</h6></li>
  <li class="tag-type-artist tag"><a href="index.php?page=wiki&query=nyx_x">?</a> <a href="index.php?page=post&s=list&tags=nyx_x">nyx x</a> <span class="tag-count">9</span></li>
  <li class="tag-type-general tag"><a href="index.php?page=wiki&query=1girl">?</a> <a href="index.php?page=post&s=list&tags=1girl">1girl</a></li>
</ul>`;
    expect(readPostPageTags()).toEqual(["nyx_x", "1girl"]);
    document.body.replaceChildren();
  });

  it("counts a tag once per favorite and ranks by count", () => {
    const entries = [entry(1, "cat solo cat"), entry(2, "cat dog"), entry(3, "dog bird")];
    expect(topFavoriteTags(entries, new Set([1, 2, 3]), 2)).toEqual([
      { tag: "cat", count: 2 },
      { tag: "dog", count: 2 },
    ]);
    // A post that is no longer a favorite does not count.
    expect(topFavoriteTags(entries, new Set([3]), 5)).toEqual([
      { tag: "bird", count: 1 },
      { tag: "dog", count: 1 },
    ]);
  });

  it("shuffles the same way for the same seed and keeps every item", () => {
    const items = Array.from({ length: 50 }, (_, index) => index);
    const first = shuffleBySeed(items, 12345);
    expect(shuffleBySeed(items, 12345)).toEqual(first);
    expect(first).not.toEqual(items);
    expect([...first].sort((a, b) => a - b)).toEqual(items);
    expect(shuffleBySeed(items, 54321)).not.toEqual(first);
  });
});

describe("collections: sorting", () => {
  const collections: Collection[] = [
    { id: "a", name: "zeta", tags: [], kind: "posts", postIds: [1, 2] },
    { id: "b", name: "Alpha", tags: [], kind: "search", query: "cat", postCount: { value: 900, exact: true } },
    { id: "c", name: "beta 10", tags: [], kind: "posts", postIds: [] },
    { id: "d", name: "beta 2", tags: [], kind: "search", query: "dog" },
  ];
  const ids = (list: readonly Collection[]): string[] => list.map((item) => item.id);

  it("keeps the stored order, or sorts by name or by size", () => {
    expect(ids(sortCollections(collections, SORT_CREATED))).toEqual(["a", "b", "c", "d"]);
    // Names ignore case and compare numbers as numbers.
    expect(ids(sortCollections(collections, SORT_NAME))).toEqual(["b", "d", "c", "a"]);
    // A dynamic collection whose count is unknown counts as empty; ties go by name.
    expect(ids(sortCollections(collections, SORT_SIZE))).toEqual(["b", "a", "d", "c"]);
  });
});
