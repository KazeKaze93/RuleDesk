import { describe, expect, it } from "vitest";
import {
  selectMediaCacheFilesToEvict,
  type MediaCacheFileEntry,
} from "@/main/lib/media-cache-eviction";

function entry(
  name: string,
  size: number,
  lastAccessedMs: number,
): MediaCacheFileEntry {
  return { fullPath: `/cache/${name}`, size, lastAccessedMs };
}

describe("selectMediaCacheFilesToEvict", () => {
  it("returns nothing when total size is within the cap", () => {
    const files = [entry("a.bin", 40, 1), entry("b.bin", 40, 2)];
    expect(selectMediaCacheFilesToEvict(files, 100, new Set())).toEqual([]);
  });

  it("evicts least-recently-accessed files, not the oldest-created stand-in", () => {
    const createdLongAgoPlayedYesterday = entry("old-played.bin", 60, 1_000);
    const createdYesterdayNeverPlayed = entry("fresh-junk.bin", 60, 100);
    const files = [createdLongAgoPlayedYesterday, createdYesterdayNeverPlayed];

    const toEvict = selectMediaCacheFilesToEvict(files, 100, new Set());

    expect(toEvict.map((f) => f.fullPath)).toEqual([
      createdYesterdayNeverPlayed.fullPath,
    ]);
  });

  it("keeps recently accessed files when several exceed the cap", () => {
    const files = [
      entry("stale.bin", 50, 10),
      entry("mid.bin", 50, 20),
      entry("hot.bin", 50, 30),
    ];

    const toEvict = selectMediaCacheFilesToEvict(files, 80, new Set());

    expect(toEvict.map((f) => f.fullPath)).toEqual([
      "/cache/stale.bin",
      "/cache/mid.bin",
    ]);
  });

  it("does not select a file that is currently open", () => {
    const openLru = entry("open-lru.bin", 60, 1);
    const closed = entry("closed.bin", 60, 2);
    const skip = new Set([openLru.fullPath]);

    const toEvict = selectMediaCacheFilesToEvict(
      [openLru, closed],
      100,
      skip,
    );

    expect(toEvict.map((f) => f.fullPath)).toEqual([closed.fullPath]);
  });

  it("leaves the cache over cap when every remaining candidate is open", () => {
    const a = entry("a.bin", 80, 1);
    const b = entry("b.bin", 80, 2);
    const skip = new Set([a.fullPath, b.fullPath]);

    expect(selectMediaCacheFilesToEvict([a, b], 100, skip)).toEqual([]);
  });
});
