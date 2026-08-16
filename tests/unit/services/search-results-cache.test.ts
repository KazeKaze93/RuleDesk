import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { searchResultsCache } from "@/main/db/schema";
import { SEARCH_RESULTS_CACHE_TTL_MS } from "@/main/config/search-results-cache-constants";
import { deleteExpiredSearchResultsCache } from "@/main/db/queries/search-results-cache";
import {
  buildSearchResultsCacheKey,
  type SearchResultsCacheKeyInput,
} from "@/shared/search-results-cache-key";
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
  loadSearchResultsCache,
  parseSearchResultsCachePayload,
  resetSearchResultsCacheForTests,
  resolveCachedSearchPage,
} from "@/main/services/search-results-cache";

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

function baseKeyInput(
  overrides: Partial<SearchResultsCacheKeyInput> = {}
): SearchResultsCacheKeyInput {
  return {
    provider: "rule34",
    tags: "cat",
    page: 1,
    limit: 50,
    ...overrides,
  };
}

describe("buildSearchResultsCacheKey", () => {
  it("isolates provider, tags, page, limit, and cursor — not dead IPC-absent flags", () => {
    const defaultKey = buildSearchResultsCacheKey(baseKeyInput());
    expect(buildSearchResultsCacheKey(baseKeyInput({ page: 2 }))).not.toBe(
      defaultKey
    );
    expect(
      buildSearchResultsCacheKey(baseKeyInput({ tags: "cat video" }))
    ).not.toBe(defaultKey);
    expect(
      buildSearchResultsCacheKey(
        baseKeyInput({ tags: "cat -ai_generated -ai-generated" })
      )
    ).not.toBe(defaultKey);
    expect(
      buildSearchResultsCacheKey(baseKeyInput({ provider: "gelbooru" }))
    ).not.toBe(defaultKey);
    expect(buildSearchResultsCacheKey(baseKeyInput({ limit: 100 }))).not.toBe(
      defaultKey
    );
    expect(
      buildSearchResultsCacheKey(baseKeyInput({ beforePostId: 9001 }))
    ).not.toBe(defaultKey);
  });
});

describe("search-results-cache", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    resetSearchResultsCacheForTests();
    mockDb = createMockDb();
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // Ignore close errors in tests.
    }
  });

  it("writes found on first fetch and serves SQLite on repeat without calling the provider", async () => {
    const cacheKey = buildSearchResultsCacheKey(baseKeyInput());
    const fetchFromProvider = vi.fn(async () => [makePost(42)]);

    const first = await resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );
    expect(first).toHaveLength(1);
    expect(first[0]?.id).toBe(42);
    expect(fetchFromProvider).toHaveBeenCalledTimes(1);

    const rows = mockDb.db.select().from(searchResultsCache).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("found");

    resetSearchResultsCacheForTests();
    fetchFromProvider.mockClear();

    const second = await resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );
    expect(second).toHaveLength(1);
    expect(second[0]?.id).toBe(42);
    expect(fetchFromProvider).not.toHaveBeenCalled();
  });

  it("does not persist 429 as found or not_found (unresolved ≠ miss)", async () => {
    const cacheKey = buildSearchResultsCacheKey(baseKeyInput({ tags: "flaky" }));
    const fetchFromProvider = vi.fn(async () => {
      throw new ProviderSearchError("rate_limit", "rate limited", 1000);
    });

    await expect(
      resolveCachedSearchPage(mockDb.db, cacheKey, fetchFromProvider, {
        persistEmpty: true,
      })
    ).rejects.toMatchObject({ kind: "rate_limit" });

    expect(mockDb.db.select().from(searchResultsCache).all()).toHaveLength(0);
    expect(loadSearchResultsCache(mockDb.db, cacheKey).status).toBe("miss");
  });

  it("does not persist network failures as not_found", async () => {
    const cacheKey = buildSearchResultsCacheKey(
      baseKeyInput({ tags: "network_miss" })
    );
    const fetchFromProvider = vi.fn(async () => {
      throw new ProviderSearchError("network");
    });

    await expect(
      resolveCachedSearchPage(mockDb.db, cacheKey, fetchFromProvider, {
        persistEmpty: true,
      })
    ).rejects.toMatchObject({ kind: "network" });

    expect(mockDb.db.select().from(searchResultsCache).all()).toHaveLength(0);
  });

  it("persists confirmed empty as not_found and skips the next fetch", async () => {
    const cacheKey = buildSearchResultsCacheKey(
      baseKeyInput({ tags: "ghost_tag" })
    );
    const fetchFromProvider = vi.fn(async () => []);

    const first = await resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );
    expect(first).toEqual([]);
    expect(fetchFromProvider).toHaveBeenCalledTimes(1);

    const rows = mockDb.db.select().from(searchResultsCache).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("not_found");
    expect(rows[0]?.responsePayload).toBeNull();

    fetchFromProvider.mockClear();
    const second = await resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );
    expect(second).toEqual([]);
    expect(fetchFromProvider).not.toHaveBeenCalled();
  });

  it("does not persist empty when persistEmpty is false (untagged page-1 blip)", async () => {
    const cacheKey = buildSearchResultsCacheKey(baseKeyInput({ tags: "" }));
    const fetchFromProvider = vi.fn(async () => []);

    const posts = await resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: false }
    );
    expect(posts).toEqual([]);
    expect(mockDb.db.select().from(searchResultsCache).all()).toHaveLength(0);
  });

  it("persists untagged page 2+ empty as not_found so repeat end-of-feed skips HTTP", async () => {
    const cacheKey = buildSearchResultsCacheKey(
      baseKeyInput({ tags: "", page: 2 })
    );
    const fetchFromProvider = vi.fn(async () => []);

    const first = await resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );
    expect(first).toEqual([]);
    expect(fetchFromProvider).toHaveBeenCalledTimes(1);

    const row = mockDb.db.select().from(searchResultsCache).all()[0];
    expect(row?.status).toBe("not_found");

    fetchFromProvider.mockClear();
    const second = await resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );
    expect(second).toEqual([]);
    expect(fetchFromProvider).not.toHaveBeenCalled();
  });

  it("does not store empty posts as a found payload", async () => {
    const cacheKey = buildSearchResultsCacheKey(
      baseKeyInput({ tags: "empty_found_guard" })
    );
    await resolveCachedSearchPage(mockDb.db, cacheKey, async () => [], {
      persistEmpty: true,
    });

    const row = mockDb.db.select().from(searchResultsCache).all()[0];
    expect(row?.status).toBe("not_found");
    expect(row?.responsePayload).toBeNull();
  });

  it("treats expired rows as cache-miss and re-fetches", async () => {
    const cacheKey = buildSearchResultsCacheKey(
      baseKeyInput({ tags: "stale_page" })
    );
    const expiredAt = new Date(Date.now() - SEARCH_RESULTS_CACHE_TTL_MS - 1_000);
    mockDb.db
      .insert(searchResultsCache)
      .values({
        cacheKey,
        status: "found",
        payloadSchemaVersion: 1,
        responsePayload: JSON.stringify({
          posts: [
            {
              ...makePost(7),
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
        resolvedAt: expiredAt,
      })
      .run();

    const fetchFromProvider = vi.fn(async () => [makePost(8)]);
    const posts = await resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );

    expect(fetchFromProvider).toHaveBeenCalledTimes(1);
    expect(posts[0]?.id).toBe(8);
  });

  it("deduplicates concurrent fetches for the same cache key", async () => {
    const cacheKey = buildSearchResultsCacheKey(
      baseKeyInput({ tags: "dedup" })
    );
    let resolveFetch: (() => void) | undefined;
    const fetchGate = new Promise<void>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchFromProvider = vi.fn(async () => {
      await fetchGate;
      return [makePost(9)];
    });

    const first = resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );
    const second = resolveCachedSearchPage(
      mockDb.db,
      cacheKey,
      fetchFromProvider,
      { persistEmpty: true }
    );

    resolveFetch?.();
    const [a, b] = await Promise.all([first, second]);

    expect(fetchFromProvider).toHaveBeenCalledTimes(1);
    expect(a[0]?.id).toBe(9);
    expect(b[0]?.id).toBe(9);
  });

  it("unknown payload schema version is a miss, not not_found", () => {
    const parsed = parseSearchResultsCachePayload(
      99,
      JSON.stringify({ posts: [makePost(1)] })
    );
    expect(parsed).toBeNull();
  });

  it("maintenance DELETE keeps fresh Drizzle rows and removes expired (ms units aligned)", async () => {
    const freshKey = buildSearchResultsCacheKey(
      baseKeyInput({ tags: "fresh_page" })
    );
    await resolveCachedSearchPage(
      mockDb.db,
      freshKey,
      async () => [makePost(1)],
      { persistEmpty: true }
    );

    const rawFresh = mockDb.sqlite
      .prepare(
        "SELECT resolved_at FROM search_results_cache WHERE cache_key = ?"
      )
      .get(freshKey) as { resolved_at: number } | undefined;
    expect(rawFresh?.resolved_at).toBeGreaterThan(1_000_000_000_000);

    const deletedFresh = deleteExpiredSearchResultsCache(mockDb.sqlite);
    expect(deletedFresh).toBe(0);

    const expiredKey = buildSearchResultsCacheKey(
      baseKeyInput({ tags: "expired_page" })
    );
    const expiredAt = new Date(Date.now() - SEARCH_RESULTS_CACHE_TTL_MS - 60_000);
    mockDb.db
      .insert(searchResultsCache)
      .values({
        cacheKey: expiredKey,
        status: "not_found",
        payloadSchemaVersion: 1,
        responsePayload: null,
        resolvedAt: expiredAt,
      })
      .run();

    const deletedExpired = deleteExpiredSearchResultsCache(mockDb.sqlite);
    expect(deletedExpired).toBe(1);
    const remaining = mockDb.db.select().from(searchResultsCache).all();
    expect(remaining.some((row) => row.cacheKey === freshKey)).toBe(true);
    expect(remaining.some((row) => row.cacheKey === expiredKey)).toBe(false);
  });
});
