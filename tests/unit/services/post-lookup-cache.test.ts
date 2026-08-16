import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { postLookupCache } from "@/main/db/schema";
import { POST_LOOKUP_NOT_FOUND_TTL_MS } from "@/main/config/post-lookup-constants";
import { deleteExpiredNotFoundPostLookupCache } from "@/main/db/queries/post-lookup-cache";
import type { BooruPost } from "@/shared/schemas/booru";
import { ProviderSearchError } from "@/main/providers/provider-search-errors";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  loadPostLookupCache,
  resetPostLookupCacheForTests,
  resolvePostLookup,
} from "@/main/services/post-lookup-cache";

function makePost(id: number): BooruPost {
  return {
    id,
    fileUrl: `https://example.com/${id}.jpg`,
    previewUrl: `https://example.com/${id}_p.jpg`,
    sampleUrl: `https://example.com/${id}_s.jpg`,
    tags: ["cat"],
    rating: "s",
    score: 0,
    source: "",
    width: 100,
    height: 100,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("post-lookup-cache", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    resetPostLookupCacheForTests();
    mockDb = createMockDb();
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // Ignore close errors in tests.
    }
  });

  it("persists confirmed empty lookup as not_found and skips HTTP within TTL", async () => {
    const fetchFromProvider = vi.fn().mockResolvedValue([]);

    const first = await resolvePostLookup(
      mockDb.db,
      "rule34",
      42,
      fetchFromProvider
    );
    expect(first).toEqual({ status: "not_found" });
    expect(fetchFromProvider).toHaveBeenCalledTimes(1);

    const rows = mockDb.db.select().from(postLookupCache).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.postId).toBe(42);
    expect(rows[0]?.provider).toBe("rule34");
    expect(rows[0]?.status).toBe("not_found");

    resetPostLookupCacheForTests();
    fetchFromProvider.mockClear();

    const cached = loadPostLookupCache(mockDb.db, "rule34", 42);
    expect(cached.status).toBe("not_found");

    const second = await resolvePostLookup(
      mockDb.db,
      "rule34",
      42,
      fetchFromProvider
    );
    expect(second).toEqual({ status: "not_found" });
    expect(fetchFromProvider).not.toHaveBeenCalled();
  });

  it("does not persist 429 as not_found", async () => {
    const fetchFromProvider = vi
      .fn()
      .mockRejectedValue(new ProviderSearchError("rate_limit", "slow down", 1000));

    await expect(
      resolvePostLookup(mockDb.db, "rule34", 7, fetchFromProvider)
    ).rejects.toBeInstanceOf(ProviderSearchError);

    expect(mockDb.db.select().from(postLookupCache).all()).toHaveLength(0);
    expect(loadPostLookupCache(mockDb.db, "rule34", 7).status).toBe("miss");
  });

  it("does not persist network failures as not_found", async () => {
    const fetchFromProvider = vi
      .fn()
      .mockRejectedValue(new ProviderSearchError("network"));

    await expect(
      resolvePostLookup(mockDb.db, "gelbooru", 9, fetchFromProvider)
    ).rejects.toBeInstanceOf(ProviderSearchError);

    expect(mockDb.db.select().from(postLookupCache).all()).toHaveLength(0);
  });

  it("persists found and does not skip a later HTTP (body is not in this table)", async () => {
    const post = makePost(100);
    const fetchFromProvider = vi.fn().mockResolvedValue([post]);

    const first = await resolvePostLookup(
      mockDb.db,
      "rule34",
      100,
      fetchFromProvider
    );
    expect(first.status).toBe("found");
    if (first.status === "found") {
      expect(first.post.id).toBe(100);
    }
    expect(fetchFromProvider).toHaveBeenCalledTimes(1);

    const row = mockDb.db.select().from(postLookupCache).all()[0];
    expect(row?.status).toBe("found");

    const second = await resolvePostLookup(
      mockDb.db,
      "rule34",
      100,
      fetchFromProvider
    );
    expect(second.status).toBe("found");
    expect(fetchFromProvider).toHaveBeenCalledTimes(2);
  });

  it("treats expired not_found as miss and re-looks up", async () => {
    const expiredAt = new Date(
      Date.now() - POST_LOOKUP_NOT_FOUND_TTL_MS - 1_000
    );
    mockDb.db
      .insert(postLookupCache)
      .values({
        provider: "rule34",
        postId: 55,
        status: "not_found",
        resolvedAt: expiredAt,
      })
      .run();

    expect(loadPostLookupCache(mockDb.db, "rule34", 55).status).toBe("miss");

    const post = makePost(55);
    const fetchFromProvider = vi.fn().mockResolvedValue([post]);
    const result = await resolvePostLookup(
      mockDb.db,
      "rule34",
      55,
      fetchFromProvider
    );

    expect(fetchFromProvider).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("found");
    const row = mockDb.db.select().from(postLookupCache).all()[0];
    expect(row?.status).toBe("found");
  });

  it("deduplicates concurrent lookups for the same provider+postId", async () => {
    let resolveFetch: (() => void) | undefined;
    const fetchGate = new Promise<void>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchFromProvider = vi.fn().mockImplementation(async () => {
      await fetchGate;
      return [makePost(3)];
    });

    const first = resolvePostLookup(
      mockDb.db,
      "rule34",
      3,
      fetchFromProvider
    );
    const second = resolvePostLookup(
      mockDb.db,
      "rule34",
      3,
      fetchFromProvider
    );
    resolveFetch?.();
    const [a, b] = await Promise.all([first, second]);

    expect(fetchFromProvider).toHaveBeenCalledTimes(1);
    expect(a.status).toBe("found");
    expect(b.status).toBe("found");
  });

  it("maintenance DELETE keeps fresh Drizzle not_found and removes expired (ms units aligned)", async () => {
    const fetchFromProvider = vi.fn().mockResolvedValue([]);
    await resolvePostLookup(mockDb.db, "rule34", 1, fetchFromProvider);

    const rawFresh = mockDb.sqlite
      .prepare(
        "SELECT resolved_at FROM post_lookup_cache WHERE provider = ? AND post_id = ?"
      )
      .get("rule34", 1) as { resolved_at: number } | undefined;
    expect(rawFresh?.resolved_at).toBeGreaterThan(1_000_000_000_000);

    expect(deleteExpiredNotFoundPostLookupCache(mockDb.sqlite)).toBe(0);
    expect(
      mockDb.db
        .select()
        .from(postLookupCache)
        .all()
        .some((row) => row.postId === 1)
    ).toBe(true);

    const expiredAt = new Date(
      Date.now() - POST_LOOKUP_NOT_FOUND_TTL_MS - 60_000
    );
    mockDb.db
      .insert(postLookupCache)
      .values({
        provider: "rule34",
        postId: 2,
        status: "not_found",
        resolvedAt: expiredAt,
      })
      .run();

    expect(deleteExpiredNotFoundPostLookupCache(mockDb.sqlite)).toBe(1);
    const remaining = mockDb.db.select().from(postLookupCache).all();
    expect(remaining.some((row) => row.postId === 1)).toBe(true);
    expect(remaining.some((row) => row.postId === 2)).toBe(false);
  });
});
