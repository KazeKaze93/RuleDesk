import { describe, expect, it } from "vitest";

import { postsLabel, unsupportedNotice } from "../../src/features/favorites-browser";
import {
  MEDIA_ALL,
  SORT_ID_ASC,
  SORT_ID_DESC,
  filterFavoriteIndex,
  isEmptyFavoritesQuery,
  parseFavoritesQuery,
} from "../../src/features/favorites-search";
import type { FavoriteIndexEntry } from "../../src/storage/favorites-index";

function entry(id: number, tags: string, pos: number): FavoriteIndexEntry {
  return { id, tags, thumb: "", run: 1, pos };
}

/** In the site's order: 30, 10, 40, 20. */
const ENTRIES: readonly FavoriteIndexEntry[] = [
  entry(10, "cat solo", 1),
  entry(20, "dog video re:zero", 3),
  entry(30, "bird catgirl", 0),
  entry(40, "cat dog", 2),
];
const ALL: ReadonlySet<number> = new Set(ENTRIES.map((item) => item.id));

function find(text: string): number[] {
  return filterFavoriteIndex(ENTRIES, ALL, parseFavoritesQuery(text), MEDIA_ALL).map(
    (item) => item.id,
  );
}

describe("favorites search: groups of or", () => {
  it("finds posts with either tag of a group", () => {
    expect(find("( bird ~ solo )")).toEqual([30, 10]);
    expect(find("( bird ~ solo ~ video )")).toEqual([30, 10, 20]);
  });

  it("combines a group with plain and excluded tags", () => {
    expect(find("cat ( dog ~ solo )")).toEqual([10, 40]);
    expect(find("( cat ~ dog ) -solo")).toEqual([40, 20]);
    expect(find("( cat ~ bird ) ( dog ~ catgirl )")).toEqual([30, 40]);
  });

  it("takes stars inside a group", () => {
    expect(find("( cat* ~ video )")).toEqual([30, 10, 40, 20]);
  });

  it("counts a group that is still being typed", () => {
    expect(find("( bird ~ solo")).toEqual([30, 10]);
    expect(isEmptyFavoritesQuery(parseFavoritesQuery("( "))).toBe(true);
  });

  it("needs the spaces: a bracket glued to a tag is part of the tag", () => {
    expect(find("(bird ~ solo)")).toEqual([]);
  });
});

describe("favorites search: order", () => {
  it("sorts by post id both ways", () => {
    expect(find("sort:id:asc")).toEqual([10, 20, 30, 40]);
    expect(find("sort:id:desc")).toEqual([40, 30, 20, 10]);
    expect(find("cat sort:id:asc")).toEqual([10, 40]);
  });

  it("reads the order off the query, and an order alone is a query", () => {
    expect(parseFavoritesQuery("sort:id:asc").sort).toBe(SORT_ID_ASC);
    expect(parseFavoritesQuery("sort:id").sort).toBe(SORT_ID_DESC);
    expect(parseFavoritesQuery("cat").sort).toBeNull();
    expect(isEmptyFavoritesQuery(parseFavoritesQuery("sort:id:asc"))).toBe(false);
  });

  it("does not take sort:random: a random order is the Shuffle button", () => {
    const query = parseFavoritesQuery("cat sort:random");
    expect(query.sort).toBeNull();
    expect(query.unsupported).toEqual(["sort:random"]);
    expect(find("sort:random")).toEqual([30, 10, 40, 20]);
  });
});

describe("favorites search: what the index cannot answer", () => {
  it("sets the site's other metatags aside instead of searching them as tags", () => {
    const query = parseFavoritesQuery("cat rating:safe score:>=10 -rating:explicit sort:score");
    expect(query.unsupported).toEqual([
      "rating:safe",
      "score:>=10",
      "-rating:explicit",
      "sort:score",
    ]);
    expect(query.include).toHaveLength(1);
    expect(find("cat rating:safe")).toEqual([10, 40]);
  });

  it("sets the fuzzy search aside too", () => {
    expect(parseFavoritesQuery("night~").unsupported).toEqual(["night~"]);
  });

  it("keeps a tag with a colon a tag", () => {
    const query = parseFavoritesQuery("re:zero");
    expect(query.unsupported).toEqual([]);
    expect(find("re:zero")).toEqual([20]);
  });

  it("does not call a query of unsupported terms alone a search", () => {
    expect(isEmptyFavoritesQuery(parseFavoritesQuery("rating:safe"))).toBe(true);
  });

  it("names the terms in the notice, and says nothing when there are none", () => {
    expect(unsupportedNotice(["rating:safe", "night~"])).toBe(
      "Not searched here: rating:safe, night~. See the ? in the search field.",
    );
    expect(unsupportedNotice([])).toBe("");
  });
});

describe("favorites: the count in the row", () => {
  it("says one post, many posts and none", () => {
    expect(postsLabel(1)).toBe("1 post");
    expect(postsLabel(11962)).toBe("11,962 posts");
    expect(postsLabel(0)).toBe("0 posts");
  });
});
