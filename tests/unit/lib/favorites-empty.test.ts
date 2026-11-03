import { describe, expect, it } from "vitest";
import {
  resolveFavoritesEmptyKind,
  FAVORITES_EMPTY_KIND,
} from "@/lib/favorites-empty";

describe("resolveFavoritesEmptyKind", () => {
  it("returns none when no filter is active", () => {
    expect(
      resolveFavoritesEmptyKind({
        hasActiveFilter: false,
      })
    ).toBe(FAVORITES_EMPTY_KIND.NONE);
  });

  it("returns filtered when a filter is active", () => {
    expect(
      resolveFavoritesEmptyKind({
        hasActiveFilter: true,
      })
    ).toBe(FAVORITES_EMPTY_KIND.FILTERED);
  });
});
