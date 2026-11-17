import { describe, expect, it } from "vitest";

import {
  MEDIA_ALL,
  filterFavoriteIndex,
  parseFavoritesQuery,
  topFavoriteTags,
} from "../../src/features/favorites-search";
import {
  END_CUT,
  END_UNKNOWN,
  END_WHOLE,
  restoreFavoriteTags,
} from "../../src/features/favorites-tags";
import type { FavoriteIndexEntry } from "../../src/storage/favorites-index";

function synced(id: number, tags: string): FavoriteIndexEntry {
  return { id, tags, thumb: "", run: 1, pos: id, cut: true };
}

function starred(id: number, tags: string): FavoriteIndexEntry {
  return { id, tags, thumb: "", run: 2, pos: 0, cut: false };
}

/** As a favorites page gives them: one character gone at each end of the list. */
const ENTRIES: readonly FavoriteIndexEntry[] = [
  synced(1, "i_generated judy_hopps zootopi"),
  synced(2, "udy_hopps zootopia vide"),
  synced(3, "i_generated animated video zoom_i"),
  starred(4, "ai_generated fox solo"),
  synced(5, "at solo zz"),
  starred(6, "cat bat zoom_in"),
];
const IDS = new Set(ENTRIES.map((entry) => entry.id));

function find(text: string): number[] {
  return filterFavoriteIndex(ENTRIES, IDS, parseFavoritesQuery(text), MEDIA_ALL)
    .map((entry) => entry.id)
    .sort((a, b) => a - b);
}

describe("favorites tags: the ends the site cuts", () => {
  it("restores an end from the only whole tag one character longer", () => {
    const [first, second, third] = restoreFavoriteTags(ENTRIES);
    expect(first?.tagList).toEqual(["ai_generated", "judy_hopps", "zootopia"]);
    expect(first?.firstEnd).toBe(END_WHOLE);
    expect(first?.lastEnd).toBe(END_WHOLE);
    expect(second?.tagList).toEqual(["judy_hopps", "zootopia", "video"]);
    expect(third?.tagList[3]).toBe("zoom_in");
  });

  it("leaves an end alone when several tags fit it, or none", () => {
    const fifth = restoreFavoriteTags(ENTRIES)[4];
    // "at" could be "cat" or "bat"; nothing whole is "zz" plus a letter.
    expect(fifth?.tagList).toEqual(["at", "solo", "zz"]);
    expect(fifth?.firstEnd).toBe(END_CUT);
    expect(fifth?.lastEnd).toBe(END_CUT);
  });

  it("does not touch a list that was read whole", () => {
    const fourth = restoreFavoriteTags(ENTRIES)[3];
    expect(fourth?.tagList).toEqual(["ai_generated", "fox", "solo"]);
    expect(fourth?.firstEnd).toBe(END_WHOLE);
  });

  it("judges an entry without the flag by its tags", () => {
    const old: readonly FavoriteIndexEntry[] = [
      { id: 1, tags: "fox solo zootopi", thumb: "", run: 1, pos: 1 },
      { id: 2, tags: "x fox zootopia y", thumb: "", run: 1, pos: 2 },
    ];
    const [first] = restoreFavoriteTags(old);
    // "fox" is a known whole tag with nothing longer: whole. "zootopi" is not
    // known and has one longer spelling: restored.
    expect(first?.tagList).toEqual(["fox", "solo", "zootopia"]);
    expect(first?.firstEnd).toBe(END_WHOLE);
    expect(restoreFavoriteTags(old)[1]?.firstEnd).toBe(END_UNKNOWN);
  });

  it("gives the same answer for the same list without doing the work again", () => {
    expect(restoreFavoriteTags(ENTRIES)).toBe(restoreFavoriteTags(ENTRIES));
  });
});

describe("favorites search over restored tags", () => {
  it("finds the whole tag and no longer the cut spelling", () => {
    expect(find("zootopia")).toEqual([1, 2]);
    expect(find("zootopi")).toEqual([]);
    expect(find("ai_generated")).toEqual([1, 3, 4]);
    expect(find("i_generated")).toEqual([]);
    expect(find("video")).toEqual([2, 3]);
  });

  it("still tries the cut spelling on an end that could not be restored", () => {
    expect(find("cat")).toEqual([5, 6]);
    expect(find("bat")).toEqual([5, 6]);
    expect(find("at")).toEqual([]);
  });

  it("counts restored tags with their whole spelling and leaves cut ones out", () => {
    const top = topFavoriteTags(ENTRIES, IDS, 50);
    const count = (tag: string): number | undefined =>
      top.find((item) => item.tag === tag)?.count;
    expect(count("zootopia")).toBe(2);
    expect(count("zootopi")).toBeUndefined();
    expect(count("ai_generated")).toBe(3);
    expect(count("i_generated")).toBeUndefined();
    expect(count("at")).toBeUndefined();
    expect(count("zz")).toBeUndefined();
  });
});
