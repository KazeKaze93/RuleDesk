import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSearchQuery, useSearchStore } from "@/renderer/store/searchStore";

vi.mock("electron-log/renderer", () => ({
  default: {
    warn: vi.fn(),
  },
}));

describe("searchStore parseSearchQuery", () => {
  it("splits include and exclude tags", () => {
    const parsed = parseSearchQuery("cat -dog wolf -bird");
    expect(parsed.includeTags).toEqual(["cat", "wolf"]);
    expect(parsed.excludeTags).toEqual(["dog", "bird"]);
  });

  it("ignores standalone minus token", () => {
    const parsed = parseSearchQuery("cat - dog");
    expect(parsed.includeTags).toEqual(["cat", "dog"]);
    expect(parsed.excludeTags).toEqual([]);
  });
});

describe("searchStore addIncludeTag", () => {
  beforeEach(() => {
    useSearchStore.setState({
      includeTags: [],
      excludeTags: [],
    });
  });

  it("routes -tag to excludeTags", () => {
    useSearchStore.getState().addIncludeTag("-night");

    const state = useSearchStore.getState();
    expect(state.includeTags).toEqual([]);
    expect(state.excludeTags).toEqual(["night"]);
  });
});
