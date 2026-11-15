import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  drainMerged,
  FEED_MERGE_BODY_CLASS,
  isMergedFeedPage,
  mountFeedMerge,
  type MergeSource,
} from "../../src/features/feed-merge";
import { buildUpdatesSearchUrl, findFeedGroupIndex } from "../../src/search/query";
import { fetchNextPage } from "../../src/site/next-page";

vi.mock("../../src/site/next-page", () => ({
  fetchNextPage: vi.fn(),
}));

const ARTISTS = ["a_one", "b_two", "c_three", "d_four"];
const GROUP_SIZE = 2;
const FIRST_GROUP = "( a_one ~ b_two )";
const SECOND_GROUP = "( c_three ~ d_four )";

function search(tags: string, extra = ""): string {
  return `?page=post&s=list&tags=${encodeURIComponent(tags)}${extra}`;
}

function thumb(id: number): HTMLElement {
  const node = document.createElement("span");
  node.className = "thumb";
  node.id = `s${String(id)}`;
  return node;
}

function gridIds(): string[] {
  return Array.from(document.querySelectorAll(".image-list span.thumb")).map(
    (node) => node.id,
  );
}

function source(ids: number[], nextUrl: string | null): MergeSource<number> {
  return { buffer: [...ids], nextUrl };
}

const sameId = (value: number): number => value;

describe("drainMerged", () => {
  it("orders the items of exhausted groups newest first and drops duplicates", () => {
    const sources = [source([9, 5, 1], null), source([8, 5, 2], null)];
    const result = drainMerged(sources, sameId, new Set());
    expect(result.emitted).toEqual([9, 8, 5, 2, 1]);
    expect(result.starving).toBeNull();
  });

  it("stops at the first group that has pages left but nothing buffered", () => {
    const sources = [source([9, 5], "next-a"), source([8, 7], "next-b")];
    const seen = new Set<number>();
    const result = drainMerged(sources, sameId, seen);
    // 5 cannot be shown: the second group's next page may hold 6.
    expect(result.emitted).toEqual([9, 8, 7]);
    expect(result.starving).toBe(1);
    expect(sources[0]?.buffer).toEqual([5]);

    const second = sources[1];
    if (second !== undefined) {
      second.buffer.push(6, 4);
      second.nextUrl = null;
    }
    const rest = drainMerged(sources, sameId, seen);
    expect(rest.emitted).toEqual([6, 5]);
    expect(rest.starving).toBe(0);
  });

  it("asks for an unread group before showing anything", () => {
    const sources = [source([9, 5], null), source([], "first-page")];
    const result = drainMerged(sources, sameId, new Set());
    expect(result.emitted).toEqual([]);
    expect(result.starving).toBe(1);
  });
});

describe("feed group recognition", () => {
  it("finds the group a results page shows, only when there are several groups", () => {
    expect(findFeedGroupIndex(FIRST_GROUP, ARTISTS, GROUP_SIZE)).toBe(0);
    expect(findFeedGroupIndex("( b_two ~ a_one )", ARTISTS, GROUP_SIZE)).toBe(0);
    expect(findFeedGroupIndex(SECOND_GROUP, ARTISTS, GROUP_SIZE)).toBe(1);
    expect(findFeedGroupIndex("cat", ARTISTS, GROUP_SIZE)).toBe(-1);
    expect(findFeedGroupIndex(`${FIRST_GROUP} id:>5`, ARTISTS, GROUP_SIZE)).toBe(-1);
    expect(findFeedGroupIndex("( a_one ~ b_two )", ["a_one", "b_two"], GROUP_SIZE)).toBe(-1);
  });

  it("merges only on the first page of the first group", () => {
    expect(isMergedFeedPage(search(FIRST_GROUP), ARTISTS, GROUP_SIZE)).toBe(true);
    expect(isMergedFeedPage(search(FIRST_GROUP, "&pid=0"), ARTISTS, GROUP_SIZE)).toBe(true);
    expect(isMergedFeedPage(search(FIRST_GROUP, "&pid=42"), ARTISTS, GROUP_SIZE)).toBe(false);
    expect(isMergedFeedPage(search(SECOND_GROUP), ARTISTS, GROUP_SIZE)).toBe(false);
  });
});

describe("mountFeedMerge", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    vi.mocked(fetchNextPage).mockReset();
  });

  afterEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
  });

  it("returns false without a grid and leaves the page alone", () => {
    const mounted = mountFeedMerge({
      artistTags: ARTISTS,
      groupSize: GROUP_SIZE,
      onChange: () => {},
    });
    expect(mounted).toBe(false);
    expect(document.body.classList.contains(FEED_MERGE_BODY_CLASS)).toBe(false);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("reads the second group once and shows both groups as one list, newest first", async () => {
    const list = document.createElement("div");
    list.className = "image-list";
    list.append(thumb(10), thumb(7));
    document.body.append(list);
    vi.mocked(fetchNextPage).mockResolvedValue({
      thumbs: [thumb(9), thumb(8), thumb(7)],
      nextUrl: null,
    });
    const onChange = vi.fn();

    const mounted = mountFeedMerge({
      artistTags: ARTISTS,
      groupSize: GROUP_SIZE,
      onChange,
    });

    expect(mounted).toBe(true);
    expect(document.body.classList.contains(FEED_MERGE_BODY_CLASS)).toBe(true);
    await vi.waitFor(() => {
      expect(document.querySelector(".rdw-feed-merge-status")?.textContent).toBe(
        "End of feed",
      );
    });
    expect(gridIds()).toEqual(["s10", "s9", "s8", "s7"]);
    expect(document.querySelector(".rdw-feed-merge-pending")).toBeNull();
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(fetchNextPage).toHaveBeenCalledWith(buildUpdatesSearchUrl(SECOND_GROUP));
    expect(onChange).toHaveBeenCalled();
  });

  it("keeps the page's own posts hidden and offers Retry when a group fails to load", async () => {
    const list = document.createElement("div");
    list.className = "image-list";
    list.append(thumb(10));
    document.body.append(list);
    vi.mocked(fetchNextPage)
      .mockRejectedValueOnce(new Error("HTTP 429"))
      .mockResolvedValue({ thumbs: [thumb(11)], nextUrl: null });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mountFeedMerge({ artistTags: ARTISTS, groupSize: GROUP_SIZE, onChange: () => {} });

    const retry = await vi.waitFor(() => {
      const button = document.querySelector(".rdw-feed-merge-retry");
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error("retry button missing");
      }
      return button;
    });
    expect(document.querySelectorAll(".rdw-feed-merge-pending")).toHaveLength(1);
    retry.click();

    await vi.waitFor(() => {
      expect(gridIds()).toEqual(["s11", "s10"]);
    });
    expect(document.querySelector(".rdw-feed-merge-pending")).toBeNull();
    vi.restoreAllMocks();
  });
});
