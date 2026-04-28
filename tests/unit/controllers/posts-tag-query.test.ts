import { describe, expect, it } from "vitest";
import { parseTagFilterQuery } from "@/main/ipc/controllers/posts-tag-query";

describe("parseTagFilterQuery", () => {
  it("marks -token as exclude token", () => {
    const parsed = parseTagFilterQuery("-cat dog");
    expect(parsed).toEqual([
      {
        exclude: true,
        terms: [{ value: "cat", mode: "exact" }],
      },
      {
        exclude: false,
        terms: [{ value: "dog", mode: "exact" }],
      },
    ]);
  });

  it("parses OR groups with wildcard and fuzzy terms", () => {
    const parsed = parseTagFilterQuery("cat|dog*|night~");
    expect(parsed).toEqual([
      {
        exclude: false,
        terms: [
          { value: "cat", mode: "exact" },
          { value: "dog*", mode: "wildcard" },
          { value: "night", mode: "fuzzy" },
        ],
      },
    ]);
  });

  it("parses exclude OR groups", () => {
    const parsed = parseTagFilterQuery("-(wolf|fox)");
    expect(parsed).toEqual([
      {
        exclude: true,
        terms: [
          { value: "wolf", mode: "exact" },
          { value: "fox", mode: "exact" },
        ],
      },
    ]);
  });

  it("parses OR groups with leading/trailing spaces", () => {
    const parsed = parseTagFilterQuery("  cat|dog*|night~  ");
    expect(parsed).toEqual([
      {
        exclude: false,
        terms: [
          { value: "cat", mode: "exact" },
          { value: "dog*", mode: "wildcard" },
          { value: "night", mode: "fuzzy" },
        ],
      },
    ]);
  });

  it("combines include and exclude groups in one query", () => {
    const parsed = parseTagFilterQuery("cat -dog -(wolf|fox) hero*");
    expect(parsed).toEqual([
      {
        exclude: false,
        terms: [{ value: "cat", mode: "exact" }],
      },
      {
        exclude: true,
        terms: [{ value: "dog", mode: "exact" }],
      },
      {
        exclude: true,
        terms: [
          { value: "wolf", mode: "exact" },
          { value: "fox", mode: "exact" },
        ],
      },
      {
        exclude: false,
        terms: [{ value: "hero*", mode: "wildcard" }],
      },
    ]);
  });
});
