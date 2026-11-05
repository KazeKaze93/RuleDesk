import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import {
  searchResultsCache,
  settings,
  SETTINGS_ID,
} from "../../../src/main/db/schema";
import { ProviderSearchError } from "../../../src/main/providers/provider-search-errors";
import type { BooruPost } from "@shared/schemas/booru";
import { buildSearchResultsCacheKey } from "@shared/search-results-cache-key";
import { formatRule34BeforePostIdTag } from "@shared/schemas/search";
import { SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION } from "../../../src/main/config/search-results-cache-constants";
import type Database from "better-sqlite3";
import { eq } from "drizzle-orm";

let activeSqlite: Database.Database | null = null;
let activeDb: ReturnType<typeof createMockDb>["db"] | null = null;

vi.mock("../../../src/main/db/client", () => ({
  getSqliteInstance: () => {
    if (!activeSqlite) {
      throw new Error("Test sqlite instance is not initialized");
    }
    return activeSqlite;
  },
  getDb: () => {
    if (!activeDb) {
      throw new Error("Test db is not initialized");
    }
    return activeDb;
  },
}));

vi.mock("electron", () => ({
  app: { getPath: () => "/tmp" },
  safeStorage: {
    isEncryptionAvailable: () => true,
    decryptString: vi.fn((buffer: Buffer) => buffer.toString()),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      console: { level: false, format: "" },
      file: { level: "info", resolvePathFn: vi.fn() },
      ipc: {},
    },
    errorHandler: {
      startCatching: vi.fn(),
    },
  },
}));

const fetchPostsMock = vi.fn();
const searchTagsMock = vi.fn();

vi.mock("../../../src/main/providers", () => ({
  getProvider: vi.fn(() => ({
    formatTag: (tag: string, type?: string) => {
      const clean = tag.trim().toLowerCase();
      if (type === "uploader") {
        return `user:${clean}`;
      }
      return clean;
    },
    fetchPosts: fetchPostsMock,
    searchTags: searchTagsMock,
  })),
}));

import { SearchController } from "../../../src/main/ipc/controllers/SearchController";
import { resetSearchResultsCacheForTests } from "../../../src/main/services/search-results-cache";

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

function serializeFoundPayload(posts: BooruPost[]): string {
  return JSON.stringify({
    posts: posts.map((post) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
    })),
  });
}

async function invokeSearch(
  controller: SearchController,
  args: {
    tags: string[];
    page?: number;
    beforePostId?: number;
    isRandom?: boolean;
    limit?: number;
  }
): Promise<unknown> {
  const searchMethodUnknown = Reflect.get(controller, "search");
  if (typeof searchMethodUnknown !== "function") {
    throw new Error("SearchController.search method is unavailable");
  }
  return searchMethodUnknown.call(controller, null, {
    tags: args.tags,
    page: args.page ?? 1,
    isRandom: args.isRandom ?? false,
    beforePostId: args.beforePostId,
    limit: args.limit,
  });
}

describe("SearchController search_results_cache wiring", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: SearchController;

  beforeEach(async () => {
    resetSearchResultsCacheForTests();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    await mockDb.db.insert(settings).values({
      id: SETTINGS_ID,
      userId: "12345",
      encryptedApiKey: Buffer.from("test-api-key").toString("base64"),
      provider: "gelbooru",
      isSafeMode: false,
      isAdultConfirmed: true,
      isAdultVerified: true,
    });
    controller = new SearchController();
    fetchPostsMock.mockReset();
    searchTagsMock.mockReset();
    searchTagsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // Ignore close errors in tests.
      }
    }
    activeSqlite = null;
    activeDb = null;
    resetSearchResultsCacheForTests();
  });

  it("head page (no beforePostId) ignores a fresh found cache row, fetches provider, and does not write cache", async () => {
    const headKey = buildSearchResultsCacheKey({
      provider: "rule34",
      tags: "cat",
      page: 1,
      limit: 50,
    });
    mockDb.db.insert(searchResultsCache).values({
      cacheKey: headKey,
      status: "found",
      payloadSchemaVersion: SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION,
      responsePayload: serializeFoundPayload([makePost(11)]),
      resolvedAt: new Date(),
    }).run();

    fetchPostsMock.mockResolvedValue({
      posts: [makePost(99)],
      rawItemCount: 1,
      rejectedPostIds: [],
    });

    const resultUnknown = await invokeSearch(controller, { tags: ["cat"], page: 1 });
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);

    if (
      typeof resultUnknown !== "object" ||
      resultUnknown === null ||
      !("posts" in resultUnknown)
    ) {
      throw new Error("expected SearchBooruPageResult");
    }
    const postsUnknown = Reflect.get(resultUnknown, "posts");
    if (!Array.isArray(postsUnknown) || postsUnknown.length !== 1) {
      throw new Error("expected one post from provider");
    }
    const firstPost = postsUnknown[0];
    if (
      typeof firstPost !== "object" ||
      firstPost === null ||
      !("postId" in firstPost)
    ) {
      throw new Error("expected mapped post with postId");
    }
    expect(Reflect.get(firstPost, "postId")).toBe(99);

    const rows = mockDb.db
      .select()
      .from(searchResultsCache)
      .where(eq(searchResultsCache.cacheKey, headKey))
      .all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.responsePayload).toContain('"id":11');
    expect(rows[0]?.responsePayload).not.toContain('"id":99');

    fetchPostsMock.mockClear();
    fetchPostsMock.mockResolvedValue({
      posts: [makePost(100)],
      rawItemCount: 1,
      rejectedPostIds: [],
    });
    await invokeSearch(controller, { tags: ["cat"], page: 1 });
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
  });

  it("cursor page (beforePostId) serves from SQLite without HTTP", async () => {
    const beforePostId = 500;
    const cursorTag = formatRule34BeforePostIdTag(beforePostId);
    const cursorKey = buildSearchResultsCacheKey({
      provider: "rule34",
      tags: `cat ${cursorTag}`,
      page: 1,
      limit: 50,
      beforePostId,
    });
    mockDb.db.insert(searchResultsCache).values({
      cacheKey: cursorKey,
      status: "found",
      payloadSchemaVersion: SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION,
      responsePayload: serializeFoundPayload([makePost(42)]),
      resolvedAt: new Date(),
    }).run();

    fetchPostsMock.mockResolvedValue({
      posts: [makePost(999)],
      rawItemCount: 1,
      rejectedPostIds: [],
    });

    const resultUnknown = await invokeSearch(controller, {
      tags: ["cat"],
      page: 2,
      beforePostId,
    });
    expect(fetchPostsMock).not.toHaveBeenCalled();

    if (
      typeof resultUnknown !== "object" ||
      resultUnknown === null ||
      !("posts" in resultUnknown)
    ) {
      throw new Error("expected SearchBooruPageResult");
    }
    const postsUnknown = Reflect.get(resultUnknown, "posts");
    if (!Array.isArray(postsUnknown) || postsUnknown.length !== 1) {
      throw new Error("expected one cached post");
    }
    const firstPost = postsUnknown[0];
    if (
      typeof firstPost !== "object" ||
      firstPost === null ||
      !("postId" in firstPost)
    ) {
      throw new Error("expected mapped post with postId");
    }
    expect(Reflect.get(firstPost, "postId")).toBe(42);
  });

  it("isRandom bypasses cache", async () => {
    fetchPostsMock.mockResolvedValue({
      posts: [makePost(7)],
      rawItemCount: 1,
      rejectedPostIds: [],
    });
    await invokeSearch(controller, { tags: ["cat"], isRandom: true });
    await invokeSearch(controller, { tags: ["cat"], isRandom: true });
    expect(fetchPostsMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache a 429 as an empty page", async () => {
    fetchPostsMock.mockRejectedValue(
      new ProviderSearchError("rate_limit", "rate limited", 2000)
    );

    await expect(
      invokeSearch(controller, { tags: ["cat"], page: 1 })
    ).rejects.toBeTruthy();
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);

    fetchPostsMock.mockReset();
    fetchPostsMock.mockResolvedValue({
      posts: [makePost(12)],
      rawItemCount: 1,
      rejectedPostIds: [],
    });
    await invokeSearch(controller, { tags: ["cat"], page: 1 });
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
  });

  it("offset page 2 empty is not persisted (only cursor pages use the cache)", async () => {
    fetchPostsMock.mockResolvedValue({
      posts: [],
      rawItemCount: 0,
      rejectedPostIds: [],
    });

    await invokeSearch(controller, { tags: [], page: 2 });
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
    fetchPostsMock.mockClear();
    await invokeSearch(controller, { tags: [], page: 2 });
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);

    const rowCount = mockDb.db.select().from(searchResultsCache).all().length;
    expect(rowCount).toBe(0);
  });
});
