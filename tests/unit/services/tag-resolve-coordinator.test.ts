import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { tagMetadata, TAG_TYPES } from "@/main/db/schema";
import { TAG_RESOLVE_NOT_FOUND_TTL_MS } from "@/main/config/tag-resolve-constants";

const { fetchRule34TagMetadataMock, MockRule34TagRateLimitError } = vi.hoisted(
  () => {
    class MockRule34TagRateLimitError extends Error {
      readonly retryAfterMs: number;

      constructor(retryAfterMs: number) {
        super(`rate limited (${retryAfterMs}ms)`);
        this.name = "Rule34TagRateLimitError";
        this.retryAfterMs = retryAfterMs;
      }
    }

    return {
      fetchRule34TagMetadataMock: vi.fn(),
      MockRule34TagRateLimitError,
    };
  }
);

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn(() => ({
    id: "rule34",
    getRequestThrottle: () => ({
      wait: vi.fn().mockResolvedValue(undefined),
      notifyRateLimited: vi.fn(),
      resetRateLimitGateForTests: vi.fn(),
    }),
    getRequestHeaders: () => ({
      "User-Agent": "test",
      Accept: "application/json",
    }),
  })),
}));

vi.mock("@/main/providers/rule34-tag-metadata", () => ({
  fetchRule34TagMetadata: (...args: unknown[]) =>
    fetchRule34TagMetadataMock(...args),
  Rule34TagRateLimitError: MockRule34TagRateLimitError,
}));

import {
  loadTagMetadataCache,
  resetTagResolveCoordinatorForTests,
  resolveTagMetadataWave,
} from "@/main/services/tag-resolve-coordinator";
import { deleteExpiredNotFoundTagMetadata } from "@/main/db/queries/tag-metadata";

describe("tag-resolve-coordinator", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    resetTagResolveCoordinatorForTests();
    fetchRule34TagMetadataMock.mockReset();
    mockDb = createMockDb();
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // Ignore close errors in tests.
    }
  });

  it("does not persist 429 give-up as not_found (unresolved ≠ miss)", async () => {
    fetchRule34TagMetadataMock.mockRejectedValue(
      new MockRule34TagRateLimitError(1000)
    );

    const cache = loadTagMetadataCache(mockDb.db, ["colored_skin"]);
    await resolveTagMetadataWave(
      mockDb.db,
      ["colored_skin"],
      cache,
      { userId: "1", apiKey: "key" },
      "test-429-not-not-found"
    );

    const rows = mockDb.db.select().from(tagMetadata).all();
    expect(rows).toHaveLength(0);
    expect(cache.foundTypes.has("colored_skin")).toBe(false);
    expect(cache.activeNotFound.has("colored_skin")).toBe(false);

    resetTagResolveCoordinatorForTests();
    fetchRule34TagMetadataMock.mockReset();
    fetchRule34TagMetadataMock.mockResolvedValue({
      status: "found",
      entry: { name: "colored_skin", type: TAG_TYPES.GENERAL },
    });

    const cacheAfterRestart = loadTagMetadataCache(mockDb.db, ["colored_skin"]);
    await resolveTagMetadataWave(
      mockDb.db,
      ["colored_skin"],
      cacheAfterRestart,
      { userId: "1", apiKey: "key" },
      "test-429-retry-next-session"
    );

    expect(fetchRule34TagMetadataMock).toHaveBeenCalledTimes(1);
    expect(cacheAfterRestart.foundTypes.get("colored_skin")).toBe(
      TAG_TYPES.GENERAL
    );
  });

  it("does not persist network failures as not_found", async () => {
    fetchRule34TagMetadataMock.mockRejectedValue(new Error("socket hang up"));

    const cache = loadTagMetadataCache(mockDb.db, ["flaky_tag"]);
    await resolveTagMetadataWave(
      mockDb.db,
      ["flaky_tag"],
      cache,
      { userId: "1", apiKey: "key" },
      "test-network-unresolved"
    );

    expect(mockDb.db.select().from(tagMetadata).all()).toHaveLength(0);
    expect(cache.activeNotFound.has("flaky_tag")).toBe(false);
  });

  it("deduplicates concurrent lookups for the same tag", async () => {
    let resolveFetch: (() => void) | undefined;
    const fetchGate = new Promise<void>((resolve) => {
      resolveFetch = resolve;
    });

    fetchRule34TagMetadataMock.mockImplementation(async () => {
      await fetchGate;
      return {
        status: "found",
        entry: { name: "artist_one", type: TAG_TYPES.ARTIST },
      };
    });

    const settings = { userId: "1", apiKey: "key" };
    const cache = loadTagMetadataCache(mockDb.db, ["artist_one"]);

    const firstWave = resolveTagMetadataWave(
      mockDb.db,
      ["artist_one"],
      cache,
      settings,
      "test-dedup-1"
    );
    const secondWave = resolveTagMetadataWave(
      mockDb.db,
      ["artist_one"],
      cache,
      settings,
      "test-dedup-2"
    );

    resolveFetch?.();
    await Promise.all([firstWave, secondWave]);

    expect(fetchRule34TagMetadataMock).toHaveBeenCalledTimes(1);
    expect(cache.foundTypes.get("artist_one")).toBe(TAG_TYPES.ARTIST);
  });

  it("persists confirmed not_found in SQLite and survives coordinator reset", async () => {
    fetchRule34TagMetadataMock.mockResolvedValue({ status: "not_found" });

    const settings = { userId: "1", apiKey: "key" };
    const firstCache = loadTagMetadataCache(mockDb.db, ["ghost_tag"]);

    await resolveTagMetadataWave(
      mockDb.db,
      ["ghost_tag"],
      firstCache,
      settings,
      "test-not-found-persist-1"
    );

    const rows = mockDb.db.select().from(tagMetadata).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("ghost_tag");
    expect(rows[0]?.status).toBe("not_found");
    expect(firstCache.activeNotFound.has("ghost_tag")).toBe(true);
    expect(firstCache.foundTypes.has("ghost_tag")).toBe(false);

    resetTagResolveCoordinatorForTests();
    fetchRule34TagMetadataMock.mockClear();

    const secondCache = loadTagMetadataCache(mockDb.db, ["ghost_tag"]);
    expect(secondCache.activeNotFound.has("ghost_tag")).toBe(true);

    await resolveTagMetadataWave(
      mockDb.db,
      ["ghost_tag"],
      secondCache,
      settings,
      "test-not-found-persist-2"
    );

    expect(fetchRule34TagMetadataMock).not.toHaveBeenCalled();
  });

  it("treats expired not_found as cache-miss and re-resolves", async () => {
    const expiredAt = new Date(Date.now() - TAG_RESOLVE_NOT_FOUND_TTL_MS - 1_000);
    mockDb.db
      .insert(tagMetadata)
      .values({
        name: "stale_ghost",
        type: TAG_TYPES.GENERAL,
        status: "not_found",
        resolvedAt: expiredAt,
      })
      .run();

    fetchRule34TagMetadataMock.mockResolvedValue({
      status: "found",
      entry: { name: "stale_ghost", type: TAG_TYPES.CHARACTER },
    });

    const cache = loadTagMetadataCache(mockDb.db, ["stale_ghost"]);
    expect(cache.activeNotFound.has("stale_ghost")).toBe(false);
    expect(cache.foundTypes.has("stale_ghost")).toBe(false);

    await resolveTagMetadataWave(
      mockDb.db,
      ["stale_ghost"],
      cache,
      { userId: "1", apiKey: "key" },
      "test-expired-not-found"
    );

    expect(fetchRule34TagMetadataMock).toHaveBeenCalledTimes(1);
    expect(cache.foundTypes.get("stale_ghost")).toBe(TAG_TYPES.CHARACTER);

    const row = mockDb.db
      .select()
      .from(tagMetadata)
      .all()
      .find((entry) => entry.name === "stale_ghost");
    expect(row?.status).toBe("found");
  });

  it("migration defaults existing rows to status=found", () => {
    mockDb.db
      .insert(tagMetadata)
      .values({
        name: "legacy_artist",
        type: TAG_TYPES.ARTIST,
      })
      .run();

    const row = mockDb.db.select().from(tagMetadata).all()[0];
    expect(row?.status).toBe("found");
    expect(row?.resolvedAt).toBeInstanceOf(Date);
  });

  it("maintenance DELETE keeps fresh Drizzle not_found and removes expired (ms units aligned)", async () => {
    fetchRule34TagMetadataMock.mockResolvedValue({ status: "not_found" });

    const freshCache = loadTagMetadataCache(mockDb.db, ["fresh_miss"]);
    await resolveTagMetadataWave(
      mockDb.db,
      ["fresh_miss"],
      freshCache,
      { userId: "1", apiKey: "key" },
      "test-maintenance-fresh"
    );

    const rawFresh = mockDb.sqlite
      .prepare("SELECT resolved_at FROM tag_metadata WHERE name = ?")
      .get("fresh_miss") as { resolved_at: number } | undefined;
    expect(rawFresh?.resolved_at).toBeGreaterThan(1_000_000_000_000);

    const deletedFresh = deleteExpiredNotFoundTagMetadata(mockDb.sqlite);
    expect(deletedFresh).toBe(0);
    expect(
      mockDb.db.select().from(tagMetadata).all().some((row) => row.name === "fresh_miss")
    ).toBe(true);

    const expiredAt = new Date(Date.now() - TAG_RESOLVE_NOT_FOUND_TTL_MS - 60_000);
    mockDb.db
      .insert(tagMetadata)
      .values({
        name: "expired_miss",
        type: TAG_TYPES.GENERAL,
        status: "not_found",
        resolvedAt: expiredAt,
      })
      .run();

    const deletedExpired = deleteExpiredNotFoundTagMetadata(mockDb.sqlite);
    expect(deletedExpired).toBe(1);
    const remaining = mockDb.db.select().from(tagMetadata).all();
    expect(remaining.some((row) => row.name === "fresh_miss")).toBe(true);
    expect(remaining.some((row) => row.name === "expired_miss")).toBe(false);
  });
});
