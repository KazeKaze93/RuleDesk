import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { settings, SETTINGS_ID } from "@/main/db/schema";
import { ProviderSearchError } from "@/main/providers/provider-search-errors";
import type { BooruPost } from "@/shared/schemas/booru";
import type Database from "better-sqlite3";

let activeSqlite: Database.Database | null = null;

vi.mock("@/main/db/client", () => ({
  getSqliteInstance: () => {
    if (!activeSqlite) {
      throw new Error("Test sqlite instance is not initialized");
    }
    return activeSqlite;
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

vi.mock("@/main/providers", () => ({
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

import { SearchController } from "@/main/ipc/controllers/SearchController";
import { resetSearchResultsCacheForTests } from "@/main/services/search-results-cache";

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

async function invokeSearch(
  controller: SearchController,
  tags: string[],
  page = 1
): Promise<unknown> {
  const searchMethodUnknown = Reflect.get(controller, "search");
  if (typeof searchMethodUnknown !== "function") {
    throw new Error("SearchController.search method is unavailable");
  }
  return searchMethodUnknown.call(controller, null, {
    tags,
    page,
    isRandom: false,
  });
}

describe("SearchController search_results_cache wiring", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: SearchController;

  beforeEach(async () => {
    container.clear();
    resetSearchResultsCacheForTests();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
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
    container.clear();
    resetSearchResultsCacheForTests();
  });

  it("serves the second identical tags+page from SQLite without HTTP", async () => {
    fetchPostsMock.mockResolvedValue([makePost(11)]);

    await invokeSearch(controller, ["cat"], 1);
    await invokeSearch(controller, ["cat"], 1);

    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
  });

  it("does not reuse cache across different tags", async () => {
    fetchPostsMock.mockResolvedValue([makePost(11)]);

    await invokeSearch(controller, ["cat"], 1);
    await invokeSearch(controller, ["dog"], 1);

    expect(fetchPostsMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache a 429 as an empty page", async () => {
    fetchPostsMock.mockRejectedValue(
      new ProviderSearchError("rate_limit", "rate limited", 2000)
    );

    await expect(invokeSearch(controller, ["cat"], 1)).rejects.toBeTruthy();
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);

    fetchPostsMock.mockReset();
    fetchPostsMock.mockResolvedValue([makePost(12)]);
    await invokeSearch(controller, ["cat"], 1);
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
  });

  it("caches untagged page 2 empty as not_found; untagged page 1 empty is not persisted", async () => {
    fetchPostsMock.mockResolvedValue([]);

    await invokeSearch(controller, [], 1);
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
    fetchPostsMock.mockClear();
    await invokeSearch(controller, [], 1);
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);

    fetchPostsMock.mockClear();
    await invokeSearch(controller, [], 2);
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
    fetchPostsMock.mockClear();
    await invokeSearch(controller, [], 2);
    expect(fetchPostsMock).not.toHaveBeenCalled();
  });
});
