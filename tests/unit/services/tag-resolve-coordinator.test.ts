import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { tagMetadata, TAG_TYPES } from "@/main/db/schema";

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
  },
}));

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn(() => ({
    id: "rule34",
    getRequestThrottle: () => ({
      wait: vi.fn().mockResolvedValue(undefined),
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
  resetTagResolveCoordinatorForTests,
  resolveTagMetadataWave,
} from "@/main/services/tag-resolve-coordinator";

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
    const cachedMap = new Map<string, number>();

    const firstWave = resolveTagMetadataWave(
      mockDb.db,
      ["artist_one"],
      cachedMap,
      settings,
      "test-dedup-1"
    );
    const secondWave = resolveTagMetadataWave(
      mockDb.db,
      ["artist_one"],
      cachedMap,
      settings,
      "test-dedup-2"
    );

    resolveFetch?.();
    await Promise.all([firstWave, secondWave]);

    expect(fetchRule34TagMetadataMock).toHaveBeenCalledTimes(1);
    expect(cachedMap.get("artist_one")).toBe(TAG_TYPES.ARTIST);
  });

  it("does not write tag_metadata when rate limited", async () => {
    fetchRule34TagMetadataMock.mockRejectedValue(
      new MockRule34TagRateLimitError(1000)
    );

    const cachedMap = new Map<string, number>();
    await resolveTagMetadataWave(
      mockDb.db,
      ["missing_tag"],
      cachedMap,
      { userId: "1", apiKey: "key" },
      "test-429"
    );

    const rows = mockDb.db.select().from(tagMetadata).all();
    expect(rows).toHaveLength(0);
    expect(cachedMap.has("missing_tag")).toBe(false);
  });

  it("uses in-memory negative cache for confirmed not_found tags", async () => {
    fetchRule34TagMetadataMock.mockResolvedValue({ status: "not_found" });

    const settings = { userId: "1", apiKey: "key" };
    const cachedMap = new Map<string, number>();

    await resolveTagMetadataWave(
      mockDb.db,
      ["ghost_tag"],
      cachedMap,
      settings,
      "test-negative-1"
    );
    await resolveTagMetadataWave(
      mockDb.db,
      ["ghost_tag"],
      cachedMap,
      settings,
      "test-negative-2"
    );

    expect(fetchRule34TagMetadataMock).toHaveBeenCalledTimes(1);
  });
});
