import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { settings, SETTINGS_ID } from "../../../src/main/db/schema";
import { ProviderSearchError } from "../../../src/main/providers/provider-search-errors";
import { createAbortError } from "../../../src/main/providers/provider-throttle";
import type Database from "better-sqlite3";
import log from "electron-log";

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
    fetchPostsMock.mockResolvedValue({ posts: [], rawItemCount: 0, rejectedPostIds: [] });

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

  it("rethrows unknown errors from autocomplete fallback attempt", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(new Error("autocomplete fetch exploded"));
    searchTagsMock.mockResolvedValue([
      { id: "alias", label: "alias", value: "alias_tag" },
    ]);

    await expect(invokeSearch(controller, ["missing_tag"])).rejects.toThrow(
      "autocomplete fetch exploded"
    );
    expect(log.error).toHaveBeenCalled();
  });

  it("rethrows ProviderSearchError from autocomplete fallback attempt", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(new ProviderSearchError("rate_limit", undefined, 5000));
    searchTagsMock.mockResolvedValue([
      { id: "alias", label: "alias", value: "alias_tag" },
    ]);

    await expect(invokeSearch(controller, ["missing_tag"])).rejects.toMatchObject({
      name: "ProviderSearchError",
      providerKind: "rate_limit",
    });
  });

  it("continues past abort on autocomplete fallback (same as prior behavior)", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(createAbortError())
      .mockResolvedValue({ posts: [], rawItemCount: 0, rejectedPostIds: [] });
    searchTagsMock.mockResolvedValue([
      { id: "alias", label: "alias", value: "alias_tag" },
    ]);

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
    expect(String(fetchPostsMock.mock.calls[2]?.[0])).toContain("user:");
  });

  it("rethrows unknown errors from user-account fallback attempt", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(new Error("user search exploded"));
    searchTagsMock.mockResolvedValue([]);

    await expect(invokeSearch(controller, ["missing_tag"])).rejects.toThrow(
      "user search exploded"
    );
  });

  it("rethrows ProviderSearchError from user-account fallback attempt", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(new ProviderSearchError("network"));
    searchTagsMock.mockResolvedValue([]);

    await expect(invokeSearch(controller, ["missing_tag"])).rejects.toMatchObject({
      name: "ProviderSearchError",
      providerKind: "network",
    });
  });

  it("continues past abort on user-account fallback (same as prior behavior)", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(createAbortError())
      .mockResolvedValue({ posts: [], rawItemCount: 0, rejectedPostIds: [] });
    searchTagsMock.mockResolvedValue([]);

    const resultUnknown = await invokeSearch(controller, ["sodaglow_artist"]);
    if (
      !resultUnknown ||
      typeof resultUnknown !== "object" ||
      !("posts" in resultUnknown) ||
      !Array.isArray(resultUnknown.posts)
    ) {
      throw new Error("Unexpected search result shape");
    }
    expect(resultUnknown.posts).toEqual([]);
    // Attempt C (artist strip) ran after abort on user: attempt
    expect(
      fetchPostsMock.mock.calls.some(
        (call) => String(call[0]) === "sodaglow"
      )
    ).toBe(true);
  });

  it("rethrows unknown errors from artist-strip fallback attempt", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(new Error("artist strip exploded"));
    searchTagsMock.mockResolvedValue([]);

    await expect(invokeSearch(controller, ["sodaglow_artist"])).rejects.toThrow(
      "artist strip exploded"
    );
  });

  it("rethrows ProviderSearchError from artist-strip fallback attempt", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(new ProviderSearchError("parse"));
    searchTagsMock.mockResolvedValue([]);

    await expect(invokeSearch(controller, ["sodaglow_artist"])).rejects.toMatchObject({
      name: "ProviderSearchError",
      providerKind: "parse",
    });
  });

  it("continues past abort on artist-strip fallback (same as prior behavior)", async () => {
    fetchPostsMock
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockResolvedValueOnce({ posts: [], rawItemCount: 0, rejectedPostIds: [] })
      .mockRejectedValueOnce(createAbortError());
    searchTagsMock.mockResolvedValue([]);

    const resultUnknown = await invokeSearch(controller, ["sodaglow_artist"]);
    if (
      !resultUnknown ||
      typeof resultUnknown !== "object" ||
      !("posts" in resultUnknown) ||
      !Array.isArray(resultUnknown.posts)
    ) {
      throw new Error("Unexpected search result shape");
    }
    expect(resultUnknown.posts).toEqual([]);
  });
});

describe("SearchController.getDecryptedSettings error split", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: SearchController;

  async function invokeGetDecryptedSettings(
    instance: SearchController
  ): Promise<unknown> {
    const methodUnknown = Reflect.get(instance, "getDecryptedSettings");
    if (typeof methodUnknown !== "function") {
      throw new Error("SearchController.getDecryptedSettings is unavailable");
    }
    return methodUnknown.call(instance);
  }

  beforeEach(() => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    controller = new SearchController();
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
  });

  it("returns null when settings row is missing (no credentials)", async () => {
    await expect(invokeGetDecryptedSettings(controller)).resolves.toBeNull();
  });

  it("returns null when encrypted API key cannot be decrypted", async () => {
    const { safeStorage } = await import("electron");
    vi.mocked(safeStorage.decryptString).mockImplementationOnce(() => {
      throw new Error("OS decrypt failed");
    });

    await mockDb.db.insert(settings).values({
      id: SETTINGS_ID,
      userId: "12345",
      encryptedApiKey: Buffer.from("test-api-key").toString("base64"),
      provider: "rule34",
      isSafeMode: false,
      isAdultConfirmed: true,
      isAdultVerified: true,
    });

    // SecureStorage.decrypt catches decryptString throw → null → credentials null → null
    await expect(invokeGetDecryptedSettings(controller)).resolves.toBeNull();
  });

  it("throws when settings DB read fails", async () => {
    activeDb = null;

    await expect(invokeGetDecryptedSettings(controller)).rejects.toThrow(
      "Test db is not initialized"
    );
    expect(log.error).toHaveBeenCalled();
  });
});
