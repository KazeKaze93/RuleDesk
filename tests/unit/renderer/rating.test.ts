import { describe, expect, it } from "vitest";
import { getRatingMeta } from "../../../src/renderer/lib/rating";

describe("getRatingMeta", () => {
  it("maps safe rating", () => {
    expect(getRatingMeta("s")).toEqual({
      label: "Safe",
      shortLabel: "Safe",
      badgeVariant: "success",
      textClassName: "text-success",
    });
    expect(getRatingMeta("safe")).toEqual(getRatingMeta("s"));
  });

  it("maps questionable rating", () => {
    expect(getRatingMeta("q")).toEqual({
      label: "Questionable",
      shortLabel: "Quest.",
      badgeVariant: "warning",
      textClassName: "text-warning",
    });
    expect(getRatingMeta("questionable")).toEqual(getRatingMeta("q"));
  });

  it("maps explicit rating", () => {
    expect(getRatingMeta("e")).toEqual({
      label: "Explicit",
      shortLabel: "Explicit",
      badgeVariant: "destructive",
      textClassName: "text-destructive",
    });
    expect(getRatingMeta("explicit")).toEqual(getRatingMeta("e"));
  });

  it("falls back to questionable for unknown without throwing", () => {
    expect(() => getRatingMeta("unknown")).not.toThrow();
    expect(getRatingMeta("unknown")).toEqual(getRatingMeta("q"));
    expect(getRatingMeta(null)).toEqual(getRatingMeta("q"));
    expect(getRatingMeta(undefined)).toEqual(getRatingMeta("q"));
    expect(getRatingMeta("")).toEqual(getRatingMeta("q"));
  });
});
