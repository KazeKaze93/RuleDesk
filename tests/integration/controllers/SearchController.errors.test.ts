import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { settings, SETTINGS_ID } from "@/main/db/schema";
import { ProviderSearchError } from "@/main/providers/provider-search-errors";
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

async function invokeSearch(
  controller: SearchController,
  tags: string[]
): Promise<unknown> {
  const searchMethodUnknown = Reflect.get(controller, "search");
  if (typeof searchMethodUnknown !== "function") {
    throw new Error("SearchController.search method is unavailable");
  }
  return searchMethodUnknown.call(controller, null, {
    tags,
    page: 1,
    isRandom: false,
  });
}

describe("SearchController empty result vs transport failure", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: SearchController;

  beforeEach(async () => {
    container.clear();
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
  });

  it("does not run autocomplete/user:/strip heuristics when fetchPosts throws network", async () => {
    fetchPostsMock.mockRejectedValueOnce(new ProviderSearchError("network"));

    await expect(invokeSearch(controller, ["missing_tag"])).rejects.toMatchObject({
      name: "ProviderSearchError",
      code: "NETWORK_ERROR",
      providerKind: "network",
    });

    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
    expect(searchTagsMock).not.toHaveBeenCalled();
  });

  it("still runs autocomplete and user: fallbacks on a genuine empty API page", async () => {
    fetchPostsMock.mockResolvedValue([]);

    const resultUnknown = await invokeSearch(controller, ["missing_tag"]);
    if (
      !resultUnknown ||
      typeof resultUnknown !== "object" ||
      !("posts" in resultUnknown) ||
      !Array.isArray(resultUnknown.posts)
    ) {
      throw new Error("Unexpected search result shape");
    }

    expect(resultUnknown.posts).toEqual([]);
    expect(searchTagsMock).toHaveBeenCalledTimes(1);
    expect(fetchPostsMock.mock.calls.length).toBeGreaterThan(1);
    expect(String(fetchPostsMock.mock.calls[1]?.[0])).toContain("user:");
  });
});
