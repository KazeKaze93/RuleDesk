import { describe, expect, it } from "vitest";

import {
  RESULT_TAGS_LIMIT,
  appendWord,
  describeEmptyResult,
  resultTags,
  replaceWord,
  toSuggestList,
} from "../../src/features/favorites-browser";
import type { TagCount } from "../../src/features/favorites-search";
import {
  EXCLUDE_HEADING,
  GROUP_INSIDE,
  GROUP_STARTS,
  closestTag,
  completeWord,
  queryChips,
  removeChip,
  toggleChip,
  suggestFor,
  unknownWords,
  wordAtCaret,
} from "../../src/features/favorites-suggest";
import { suggestBox } from "../../src/ui/kit/search-field";

const TAGS: readonly TagCount[] = [
  { tag: "zootopia", count: 5 },
  { tag: "zootopia_(franchise)", count: 31 },
  { tag: "zoom_in", count: 12 },
  { tag: "pet_zoo", count: 2 },
  { tag: "judy_hopps", count: 4 },
  { tag: "hopping", count: 1 },
  { tag: "cat", count: 9 },
  { tag: "catgirl", count: 40 },
  { tag: "sortie", count: 1 },
];

function labels(text: string, caret = text.length): string[] {
  return suggestFor(TAGS, wordAtCaret(text, caret))?.items.map((item) => item.label) ?? [];
}

describe("favorites suggestions: the word under the caret", () => {
  it("takes the word the caret is in or right after", () => {
    expect(wordAtCaret("cat zoo", 7)).toEqual({ start: 4, end: 7, body: "zoo", negated: false });
    expect(wordAtCaret("cat zoo", 2)?.body).toBe("cat");
    expect(wordAtCaret("cat -Zoo dog", 6)).toEqual({ start: 4, end: 8, body: "zoo", negated: true });
  });

  it("has no word after a space", () => {
    expect(wordAtCaret("cat ", 4)).toBeNull();
    expect(wordAtCaret("", 0)).toBeNull();
  });
});

describe("favorites suggestions: the list", () => {
  it("puts the tags that begin with the word first, by count, then those that hold it", () => {
    expect(labels("zoo")).toEqual(["zootopia_(franchise)", "zoom_in", "zootopia", "pet_zoo"]);
    const found = suggestFor(TAGS, wordAtCaret("zoo", 3));
    expect(found?.items.map((item) => item.group)).toEqual([
      GROUP_STARTS,
      GROUP_STARTS,
      GROUP_STARTS,
      GROUP_INSIDE,
    ]);
    expect(found?.heading).toBeNull();
  });

  it("puts an exact tag first, whatever its count, so that Enter takes it", () => {
    expect(labels("cat")).toEqual(["cat", "catgirl"]);
  });

  it("says where the typed part is in the tag", () => {
    const inside = suggestFor(TAGS, wordAtCaret("hop", 3))?.items.find(
      (item) => item.label === "judy_hopps",
    );
    expect(inside?.matchStart).toBe(5);
    expect(inside?.matchLength).toBe(3);
  });

  it("keeps the minus and says the tag will be excluded", () => {
    const found = suggestFor(TAGS, wordAtCaret("zootopia -hop", 13));
    expect(found?.heading).toBe(EXCLUDE_HEADING);
    expect(found?.items.map((item) => item.insert)).toEqual(["-hopping", "-judy_hopps"]);
    expect(found?.items[1]?.matchStart).toBe(6);
  });

  it("offers tags only: the order has its own switch on the page", () => {
    expect(labels("sort:")).toEqual([]);
    expect(labels("sort")).toEqual(["sortie"]);
  });

  it("offers nothing for grammar, a star, a whole tag with nothing longer, or no match", () => {
    expect(labels("(")).toEqual([]);
    expect(labels("zoo*")).toEqual([]);
    expect(labels("judy_hopps")).toEqual([]);
    expect(labels("zzqx")).toEqual([]);
  });
});

describe("favorites suggestions: putting one into the query", () => {
  it("replaces the word and leaves the caret ready for the next one", () => {
    const word = wordAtCaret("cat zoo", 7);
    if (word === null) {
      throw new Error("no word");
    }
    expect(completeWord("cat zoo", word, "zootopia")).toEqual({ text: "cat zootopia ", caret: 13 });
  });

  it("does not double the space before the next word", () => {
    const word = wordAtCaret("zoo cat", 3);
    if (word === null) {
      throw new Error("no word");
    }
    expect(completeWord("zoo cat", word, "zootopia")).toEqual({ text: "zootopia cat", caret: 9 });
  });
});

describe("favorites suggestions: nothing found", () => {
  it("names the word that is no tag and offers the nearest tag", () => {
    expect(unknownWords("cat zootop -dog ( a ~ b ) zo* sort:id:asc", TAGS)).toEqual([
      "zootop",
      "a",
      "b",
    ]);
    // The shortest tag that begins with the word, not the most used one.
    expect(closestTag(TAGS, "zootop")).toEqual({ tag: "zootopia", count: 5 });
    expect(closestTag(TAGS, "hopp")).toEqual({ tag: "hopping", count: 1 });
    expect(closestTag(TAGS, "_zoo")).toEqual({ tag: "pet_zoo", count: 2 });
    const empty = describeEmptyResult("cat zootop", TAGS);
    expect(empty.title).toBe("No favorites tagged “zootop”");
    expect(empty.offer).toEqual({ word: "zootop", tag: "zootopia", count: 5 });
  });

  it("says so when no tag is near, and when every word is a tag", () => {
    expect(describeEmptyResult("zzqx", TAGS).offer).toBeNull();
    expect(describeEmptyResult("zzqx", TAGS).note).toContain("no tag in your favorites");
    expect(describeEmptyResult("cat zootopia", TAGS).title).toBe("No favorites match this search");
  });

  it("puts the offered tag in place of the word", () => {
    expect(replaceWord("cat Zootop  dog", "zootop", "zootopia")).toBe("cat zootopia dog");
  });
});

describe("favorites suggestions: the list as the field draws it", () => {
  it("gives a count, what to read out, and a rule before the tags that only hold the word", () => {
    const list = toSuggestList(suggestFor(TAGS, wordAtCaret("zoo", 3)));
    expect(list?.items.map((item) => item.trailing)).toEqual(["31", "12", "5", "2"]);
    expect(list?.items[2]?.announce).toBe("zootopia, 5 posts");
    expect(list?.items.map((item) => item.divider)).toEqual([false, false, false, true]);
    expect(toSuggestList(null)).toBeNull();
  });

  it("is at least 320 and at most 480 wide and stays in the window", () => {
    expect(suggestBox(20, 80, 250, 1920)).toEqual({ top: 84, left: 20, width: 320 });
    expect(suggestBox(20, 80, 560, 1920).width).toBe(480);
    expect(suggestBox(900, 80, 250, 1000)).toEqual({ top: 84, left: 672, width: 320 });
  });
});

describe("favorites search: the query as chips", () => {
  it("makes a chip of every word and one chip of a group", () => {
    const chips = queryChips("cat -dog ( bird ~ fox ~ owl ) rating:safe");
    expect(chips.map((chip) => [chip.label, chip.excluded, chip.group])).toEqual([
      ["cat", false, false],
      ["dog", true, false],
      ["Any of 3 tags", false, true],
      ["rating:safe", false, false],
    ]);
    // A group still being typed is one chip too.
    expect(queryChips("cat ( bird ~").map((chip) => chip.label)).toEqual(["cat", "Any of 1 tag"]);
    expect(queryChips("  ")).toEqual([]);
  });

  it("excludes a word and includes it again; leaves a group alone", () => {
    const text = "cat -dog ( bird ~ fox )";
    const [cat, dog, group] = queryChips(text);
    if (cat === undefined || dog === undefined || group === undefined) {
      throw new Error("no chips");
    }
    expect(toggleChip(text, cat)).toBe("-cat -dog ( bird ~ fox )");
    expect(toggleChip(text, dog)).toBe("cat dog ( bird ~ fox )");
    expect(toggleChip(text, group)).toBe(text);
  });

  it("takes a chip out, a whole group at once", () => {
    const text = "cat -dog ( bird ~ fox ) solo";
    const [cat, , group] = queryChips(text);
    if (cat === undefined || group === undefined) {
      throw new Error("no chips");
    }
    expect(removeChip(text, cat)).toBe("-dog ( bird ~ fox ) solo");
    expect(removeChip(text, group)).toBe("cat -dog solo");
  });
});

describe("favorites: the tags of what is shown", () => {
  const index = [
    { id: 1, tags: "cat solo zootopia", thumb: "", run: 1, pos: 1, cut: false },
    { id: 2, tags: "cat dog zootopia", thumb: "", run: 1, pos: 2, cut: false },
    { id: 3, tags: "bird dog", thumb: "", run: 1, pos: 3, cut: false },
  ];

  it("lists the most frequent tags of the shown posts, most frequent first", () => {
    expect(resultTags(index, new Set([1, 2, 3]), "")).toEqual([
      { tag: "cat", count: 2 },
      { tag: "dog", count: 2 },
      { tag: "zootopia", count: 2 },
      { tag: "bird", count: 1 },
      { tag: "solo", count: 1 },
    ]);
  });

  it("counts only the shown posts and leaves out what the query already names", () => {
    expect(resultTags(index, new Set([1, 2]), "zootopia -dog")).toEqual([
      { tag: "cat", count: 2 },
      { tag: "solo", count: 1 },
    ]);
  });

  it("lists no more than the limit", () => {
    const many = [
      {
        id: 1,
        tags: Array.from({ length: 80 }, (_, at) => `tag_${String(at)}`).join(" "),
        thumb: "",
        run: 1,
        pos: 1,
        cut: false,
      },
    ];
    expect(resultTags(many, new Set([1]), "")).toHaveLength(RESULT_TAGS_LIMIT);
  });

  it("adds a word to the end of the query", () => {
    expect(appendWord("", "cat")).toBe("cat");
    expect(appendWord("dog ", "-cat")).toBe("dog -cat");
  });
});
