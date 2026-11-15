import { describe, expect, it } from "vitest";

import {
  ARTIST_TERM_SEPARATOR,
  COLLECTION_TERM_SEPARATOR,
  filterTerms,
  matchesAnyTerm,
} from "../../src/pages/filter-terms";

describe("filter terms", () => {
  it("splits artist names by spaces and commas", () => {
    expect(filterTerms("  Nyl2, ozmann  bunz ", ARTIST_TERM_SEPARATOR)).toEqual([
      "nyl2",
      "ozmann",
      "bunz",
    ]);
    expect(filterTerms("  ", ARTIST_TERM_SEPARATOR)).toEqual([]);
  });

  it("splits collection names by commas only, keeping their spaces", () => {
    expect(filterTerms("My pics , cr,", COLLECTION_TERM_SEPARATOR)).toEqual(["my pics", "cr"]);
  });

  it("shows a card when any term is part of its name", () => {
    const terms = filterTerms("nyl ozm", ARTIST_TERM_SEPARATOR);
    expect(matchesAnyTerm(["nyl2"], terms)).toBe(true);
    expect(matchesAnyTerm(["0zmann"], terms)).toBe(false);
    expect(matchesAnyTerm(["Ozmann"], terms)).toBe(true);
    expect(matchesAnyTerm(["bustybunz"], terms)).toBe(false);
    expect(matchesAnyTerm(["anything"], [])).toBe(true);
  });
});
