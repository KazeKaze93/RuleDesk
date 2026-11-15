import { describe, expect, it } from "vitest";

import { computeStats } from "../../src/pages/stats-section";
import { createDefaultStorage } from "../../src/storage/schema";

function tile(stats: ReturnType<typeof computeStats>, label: string): number | undefined {
  return stats.tiles.find((entry) => entry.label === label)?.value;
}

describe("computeStats", () => {
  it("counts what is stored and ranks artists by known post count", () => {
    const data = createDefaultStorage();
    data.artists = [
      { tag: "small", postCount: { value: 5, exact: true }, lastPostId: 90 },
      { tag: "big", postCount: { value: 900, exact: false }, lastPostId: 10 },
      { tag: "unknown" },
    ];
    data.collections = [
      { id: "c1", name: "One", tags: [], kind: "posts", postIds: [1, 2, 3] },
      { id: "c2", name: "Two", tags: [], kind: "posts", postIds: [3, 4] },
      { id: "d1", name: "Search", tags: [], kind: "search", query: "cat" },
    ];
    data.marks = { "1": { seen: true }, "2": { seen: true }, "3": {} };

    const stats = computeStats(data, 42, 50);

    expect(tile(stats, "Followed artists")).toBe(3);
    expect(tile(stats, "Artists with new posts")).toBe(1);
    expect(tile(stats, "Custom collections")).toBe(2);
    expect(tile(stats, "Dynamic collections")).toBe(1);
    // Post 3 is in two collections and counts once.
    expect(tile(stats, "Posts in custom collections")).toBe(4);
    expect(tile(stats, "Favorites")).toBe(42);
    expect(tile(stats, "Seen posts")).toBe(2);
    expect(tile(stats, "Stored data")).toBeGreaterThan(0);
    expect(stats.topArtists).toEqual([
      { tag: "big", posts: 900 },
      { tag: "small", posts: 5 },
    ]);
  });

  it("reports no new artists while nothing was marked seen", () => {
    const data = createDefaultStorage();
    data.artists = [{ tag: "a", lastPostId: 90 }];
    expect(tile(computeStats(data, 0, 0), "Artists with new posts")).toBe(0);
    expect(computeStats(data, 0, 0).topArtists).toEqual([]);
  });
});
