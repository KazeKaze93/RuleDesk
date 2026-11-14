import { describe, expect, it } from "vitest";

import {
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
} from "../src/config/constants";
import {
  buildPlaylistQueries,
  buildSearchUrl,
  parsePlaylistQuery,
  parseTags,
  queriesMatchIgnoringSortRandom,
  queryHasSortRandom,
  serialize,
  withSortRandom,
  withoutSortRandom,
} from "../src/search/query";
import type { TagEntry } from "../src/storage/schema";

describe("parseTags", () => {
  it("parses include and exclude tokens", () => {
    expect(parseTags("cat -dog bird")).toEqual([
      { tag: "cat", type: TAG_TYPE_INCLUDE },
      { tag: "dog", type: TAG_TYPE_EXCLUDE },
      { tag: "bird", type: TAG_TYPE_INCLUDE },
    ]);
  });

  it("returns empty array for empty or whitespace-only input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ")).toEqual([]);
  });

  it("collapses repeated whitespace", () => {
    expect(parseTags("  a   -b\tc  ")).toEqual([
      { tag: "a", type: TAG_TYPE_INCLUDE },
      { tag: "b", type: TAG_TYPE_EXCLUDE },
      { tag: "c", type: TAG_TYPE_INCLUDE },
    ]);
  });

  it("keeps special characters inside tags", () => {
    expect(parseTags("artist:foo_(bar) score:>=10")).toEqual([
      { tag: "artist:foo_(bar)", type: TAG_TYPE_INCLUDE },
      { tag: "score:>=10", type: TAG_TYPE_INCLUDE },
    ]);
  });

  it("keeps a lone minus token as include", () => {
    expect(parseTags("-")).toEqual([{ tag: "-", type: TAG_TYPE_INCLUDE }]);
  });
});

describe("serialize / parseTags round-trip", () => {
  it("restores the original tag entries", () => {
    const tags: TagEntry[] = [
      { tag: "cat", type: TAG_TYPE_INCLUDE },
      { tag: "dog", type: TAG_TYPE_EXCLUDE },
      { tag: "artist:foo_(bar)", type: TAG_TYPE_INCLUDE },
      { tag: "score:>=10", type: TAG_TYPE_EXCLUDE },
    ];
    expect(parseTags(serialize(tags))).toEqual(tags);
  });
});

describe("buildSearchUrl", () => {
  it("builds a list search URL with + separators and encoded tags", () => {
    const tags: TagEntry[] = [
      { tag: "foo bar", type: TAG_TYPE_INCLUDE },
      { tag: "baz", type: TAG_TYPE_EXCLUDE },
      { tag: "a+b", type: TAG_TYPE_INCLUDE },
    ];
    expect(buildSearchUrl(tags)).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=foo%20bar+-baz+a%2Bb",
    );
  });
});

describe("buildPlaylistQueries / parsePlaylistQuery", () => {
  it("formats a single id without parentheses", () => {
    expect(buildPlaylistQueries([19335574], 40)).toEqual(["id:19335574"]);
    expect(parsePlaylistQuery("id:19335574")).toEqual([19335574]);
  });

  it("formats an or-group and sorts ids descending", () => {
    expect(buildPlaylistQueries([10, 30, 20], 40)).toEqual([
      "( id:30 ~ id:20 ~ id:10 )",
    ]);
    expect(parsePlaylistQuery("( id:30 ~ id:20 ~ id:10 )")).toEqual([
      30, 20, 10,
    ]);
  });

  it("chunks by chunkSize", () => {
    expect(buildPlaylistQueries([5, 4, 3, 2, 1], 2)).toEqual([
      "( id:5 ~ id:4 )",
      "( id:3 ~ id:2 )",
      "id:1",
    ]);
  });

  it("rejects non-playlist queries", () => {
    expect(parsePlaylistQuery("")).toBeNull();
    expect(parsePlaylistQuery("cat")).toBeNull();
    expect(parsePlaylistQuery("id:>10")).toBeNull();
    expect(parsePlaylistQuery("( id:1 ~ cat )")).toBeNull();
    expect(parsePlaylistQuery("( id:1 ~ id:2 ) id:3")).toBeNull();
    expect(parsePlaylistQuery("( id:1 ~ id:1 )")).toBeNull();
  });

  it("round-trips chunk queries", () => {
    const queries = buildPlaylistQueries([9, 8, 7, 6, 5], 3);
    expect(queries.map((query) => parsePlaylistQuery(query))).toEqual([
      [9, 8, 7],
      [6, 5],
    ]);
  });
});

describe("queriesMatchIgnoringSortRandom", () => {
  it("matches the same tokens in any order", () => {
    expect(queriesMatchIgnoringSortRandom("cat dog", "dog cat")).toBe(true);
    expect(queriesMatchIgnoringSortRandom("cat -dog", "-dog cat")).toBe(true);
  });

  it("ignores sort:random and repeated whitespace", () => {
    expect(
      queriesMatchIgnoringSortRandom("cat dog sort:random", "dog cat"),
    ).toBe(true);
    expect(
      queriesMatchIgnoringSortRandom("sort:random cat sort:random", "cat"),
    ).toBe(true);
    expect(queriesMatchIgnoringSortRandom("  cat   dog  ", "dog cat")).toBe(
      true,
    );
    expect(queriesMatchIgnoringSortRandom("sort:random", "")).toBe(true);
  });

  it("treats other tokens as significant, including duplicates and grouping", () => {
    expect(queriesMatchIgnoringSortRandom("cat dog", "cat")).toBe(false);
    expect(queriesMatchIgnoringSortRandom("cat cat", "cat")).toBe(false);
    expect(queriesMatchIgnoringSortRandom("cat -dog", "cat dog")).toBe(false);
    expect(queriesMatchIgnoringSortRandom("cat sort:score", "cat")).toBe(
      false,
    );
    expect(queriesMatchIgnoringSortRandom("( cat )", "cat")).toBe(false);
    expect(queriesMatchIgnoringSortRandom("Cat", "cat")).toBe(false);
  });

  it("adds, detects, and removes sort:random without reordering other tokens", () => {
    expect(queryHasSortRandom("dog sort:random cat")).toBe(true);
    expect(queryHasSortRandom("dog cat")).toBe(false);
    expect(withSortRandom("dog cat")).toBe("dog cat sort:random");
    expect(withSortRandom("dog sort:random cat")).toBe("dog sort:random cat");
    expect(withoutSortRandom("dog sort:random cat sort:random")).toBe(
      "dog cat",
    );
  });
});
