import { describe, expect, it, vi } from "vitest";
import type { SearchResults } from "@/main/providers/types";
import {
  ARTIST_AUTOCOMPLETE_RESOLVE_LIMIT,
  applyArtistOnlyAutocompleteFilter,
  filterGelbooruArtistTags,
  selectTopAutocompleteByPostCount,
} from "@/main/lib/filter-artist-autocomplete";

function tag(
  value: string,
  label: string,
  type?: string
): SearchResults {
  return { id: value, value, label, type };
}

describe("filterGelbooruArtistTags", () => {
  it("keeps only SearchResults.type === artist", () => {
    const results = [
      tag("wlop", "wlop", "artist"),
      tag("hatsune_miku", "hatsune miku", "character"),
      tag("genshin_impact", "genshin impact", "copyright"),
      tag("solo", "solo", "tag"),
    ];
    expect(filterGelbooruArtistTags(results).map((item) => item.value)).toEqual([
      "wlop",
    ]);
  });
});

describe("selectTopAutocompleteByPostCount", () => {
  it("sorts by label count and caps at N=5", () => {
    const results = [
      tag("a", "a (10)"),
      tag("b", "b (500)"),
      tag("c", "c (3)"),
      tag("d", "d (80)"),
      tag("e", "e (40)"),
      tag("f", "f (200)"),
      tag("g", "g (1)"),
    ];
    const top = selectTopAutocompleteByPostCount(results);
    expect(top).toHaveLength(ARTIST_AUTOCOMPLETE_RESOLVE_LIMIT);
    expect(top.map((item) => item.value)).toEqual(["b", "f", "d", "e", "a"]);
  });
});

describe("applyArtistOnlyAutocompleteFilter", () => {
  it("Gelbooru: same-RT category filter, no resolve call", async () => {
    const resolveArtistNames = vi.fn();
    const filtered = await applyArtistOnlyAutocompleteFilter(
      "gelbooru",
      [
        tag("wlop", "wlop", "artist"),
        tag("hatsune_miku", "hatsune miku", "character"),
      ],
      resolveArtistNames
    );
    expect(filtered.map((item) => item.value)).toEqual(["wlop"]);
    expect(resolveArtistNames).not.toHaveBeenCalled();
  });

  it("Rule34: resolves only top-N and keeps artist matches", async () => {
    const resolveArtistNames = vi.fn().mockResolvedValue(["wlop"]);
    const results = [
      tag("hatsune_miku", "hatsune_miku (39720)"),
      tag("wlop", "wlop (16)"),
      tag("other_artist", "other_artist (9)"),
      tag("char_a", "char_a (100)"),
      tag("char_b", "char_b (50)"),
      tag("char_c", "char_c (40)"),
      tag("low_artist", "low_artist (2)"),
    ];
    const filtered = await applyArtistOnlyAutocompleteFilter(
      "rule34",
      results,
      resolveArtistNames
    );
    expect(resolveArtistNames).toHaveBeenCalledTimes(1);
    const resolved = resolveArtistNames.mock.calls[0][0];
    expect(resolved).toHaveLength(ARTIST_AUTOCOMPLETE_RESOLVE_LIMIT);
    expect(resolved).toEqual([
      "hatsune_miku",
      "char_a",
      "char_b",
      "char_c",
      "wlop",
    ]);
    expect(resolved).not.toContain("low_artist");
    expect(filtered.map((item) => item.value)).toEqual(["wlop"]);
  });

  it("Rule34: empty list when top-N has no artist matches (no unfiltered fallback)", async () => {
    const resolveArtistNames = vi.fn().mockResolvedValue([]);
    const filtered = await applyArtistOnlyAutocompleteFilter(
      "rule34",
      [
        tag("hatsune_miku", "hatsune_miku (39720)"),
        tag("hatsune_miku_(cosplay)", "hatsune_miku_(cosplay) (588)"),
      ],
      resolveArtistNames
    );
    expect(filtered).toEqual([]);
  });
});
