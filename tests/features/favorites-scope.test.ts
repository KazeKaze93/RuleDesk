import { describe, expect, it } from "vitest";

import {
  COLLECTION_ANY,
  COLLECTION_NONE,
  collectionChoices,
  collectionScope,
  followedInFavorites,
  queryHasTag,
  toggleQueryTag,
} from "../../src/features/favorites-scope";
import type { ArtistEntry, Collection } from "../../src/storage/schema";

const collections: Collection[] = [
  { id: "w", name: "wallpapers", tags: [], kind: "posts", postIds: [1, 2] },
  { id: "a", name: "animated", tags: [], kind: "posts", postIds: [2, 3] },
  { id: "s", name: "saved search", tags: [], kind: "search", query: "cat" },
];

describe("favorites: the collection filter", () => {
  it("offers any, none, then the collections of posts by name", () => {
    expect(collectionChoices(collections).map((option) => option.label)).toEqual([
      "Any",
      "Not in any collection",
      "animated",
      "wallpapers",
    ]);
  });

  it("lets everything through for any, and for a collection that is gone", () => {
    expect(collectionScope(collections, COLLECTION_ANY)).toBeNull();
    expect(collectionScope(collections, "id:gone")).toBeNull();
    expect(collectionScope(collections, "id:s")).toBeNull();
  });

  it("keeps the posts of the chosen collection", () => {
    const value = collectionChoices(collections).find((option) => option.label === "animated")?.value;
    const scope = collectionScope(collections, value ?? "");
    expect([1, 2, 3, 4].filter((id) => scope?.(id) === true)).toEqual([2, 3]);
  });

  it("keeps the posts that are in no collection", () => {
    const scope = collectionScope(collections, COLLECTION_NONE);
    expect([1, 2, 3, 4].filter((id) => scope?.(id) === true)).toEqual([4]);
  });
});

describe("favorites: the followed among the favorites", () => {
  const followed: ArtistEntry[] = [
    { tag: "zed" },
    { tag: "Abe", kind: "character" },
    { tag: "nobody" },
    { tag: "kim", kind: "copyright" },
  ];
  const tags = [
    { tag: "cat", count: 9 },
    { tag: "abe", count: 4 },
    { tag: "kim", count: 4 },
    { tag: "zed", count: 7 },
  ];

  it("lists those some favorites carry, the most favorited first", () => {
    expect(followedInFavorites(followed, tags)).toEqual([
      { tag: "zed", kind: "artist", count: 7 },
      { tag: "abe", kind: "character", count: 4 },
      { tag: "kim", kind: "copyright", count: 4 },
    ]);
  });

  it("adds a tag to the query and takes it out again", () => {
    expect(toggleQueryTag("", "zed")).toBe("zed");
    expect(toggleQueryTag("cat ", "zed")).toBe("cat zed");
    expect(toggleQueryTag("cat zed dog", "zed")).toBe("cat dog");
    expect(queryHasTag("cat zed", "zed")).toBe(true);
  });

  it("includes a tag the query excludes, instead of naming it twice", () => {
    expect(queryHasTag("-zed", "zed")).toBe(false);
    expect(toggleQueryTag("cat -zed", "zed")).toBe("cat zed");
  });
});
