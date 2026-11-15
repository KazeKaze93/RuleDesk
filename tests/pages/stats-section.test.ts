import { describe, expect, it } from "vitest";

import { computeStats, ringPercent } from "../../src/pages/stats-section";
import { createDefaultStorage } from "../../src/storage/schema";

function tile(stats: ReturnType<typeof computeStats>, label: string): number | undefined {
  return stats.tiles.find((entry) => entry.label === label)?.value;
}

describe("computeStats", () => {
  it("counts what is stored and ranks collections by size", () => {
    const data = createDefaultStorage();
    data.artists = [
      { tag: "small", postCount: { value: 5, exact: true }, lastPostId: 90 },
      { tag: "unknown" },
    ];
    data.collections = [
      { id: "c1", name: "One", tags: [], kind: "posts", postIds: [1, 2, 3] },
      { id: "c2", name: "Two", tags: [], kind: "posts", postIds: [3, 4] },
      { id: "c3", name: "Empty", tags: [], kind: "posts", postIds: [] },
      {
        id: "d1",
        name: "Search",
        tags: [],
        kind: "search",
        query: "cat",
        postCount: { value: 2711, exact: true },
      },
      { id: "d2", name: "Not opened", tags: [], kind: "search", query: "dog" },
    ];
    data.marks = { "1": { seen: true }, "2": { seen: true }, "3": {} };

    const stats = computeStats(data, 42);

    expect(tile(stats, "Followed artists")).toBe(2);
    expect(tile(stats, "Collections")).toBe(5);
    // Post 3 is in two collections and counts once.
    expect(tile(stats, "Posts in custom collections")).toBe(4);
    expect(tile(stats, "Favorites")).toBe(42);
    expect(tile(stats, "Seen posts")).toBe(2);
    expect(tile(stats, "Stored data")).toBeGreaterThan(0);
    expect(tile(stats, "Artists with new posts")).toBeUndefined();
    expect(stats.customCollections).toBe(3);
    expect(stats.dynamicCollections).toBe(2);
    // Empty and never opened collections have nothing to compare.
    expect(stats.topCollections).toEqual([
      { id: "d1", name: "Search", posts: 2711 },
      { id: "c1", name: "One", posts: 3 },
      { id: "c2", name: "Two", posts: 2 },
    ]);
  });

  it("gives the ring a whole percentage and nothing for an empty library", () => {
    expect(ringPercent(1, 4)).toBe(20);
    expect(ringPercent(3, 0)).toBe(100);
    expect(ringPercent(0, 0)).toBe(0);
    expect(computeStats(createDefaultStorage(), 0).topCollections).toEqual([]);
  });
});
