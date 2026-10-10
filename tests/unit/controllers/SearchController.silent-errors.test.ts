import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { TAG_TYPES } from "@/main/db/schema";
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
      startCatching: () => undefined,
    },
  },
}));

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn(() => ({
    id: "rule34",
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: vi.fn().mockResolvedValue([]),
    searchTags: vi.fn().mockResolvedValue([]),
  })),
  PROVIDER_IDS: ["rule34", "gelbooru"],
}));

vi.mock("@/main/services/tag-resolve-coordinator", () => ({
  loadTagMetadataCache: vi.fn(() => {
    throw new Error("DB exploded while loading tag metadata");
  }),
  resolveTagMetadataWave: vi.fn(),
}));

import { SearchController } from "@/main/ipc/controllers/SearchController";

type SearchControllerInternals = {
  setup: () => void;
  resolveTagsForType: (
    tags: string[],
    tagType: number,
    context: string
  ) => Promise<string[]>;
};

describe("SearchController.resolveTagsForType DB errors", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: SearchControllerInternals;

  beforeEach(() => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
    controller = new SearchController() as unknown as SearchControllerInternals;
    controller.setup();
  });

  afterEach(() => {
    mockDb.sqlite.close();
    activeSqlite = null;
    container.clear();
  });

  it("rejects on DB error instead of returning []", async () => {
    await expect(
      controller.resolveTagsForType(
        ["wlop"],
        TAG_TYPES.ARTIST,
        "resolveTags"
      )
    ).rejects.toThrow("DB exploded while loading tag metadata");
  });

  it("still returns [] for empty input (not an error)", async () => {
    await expect(
      controller.resolveTagsForType([], TAG_TYPES.ARTIST, "resolveTags")
    ).resolves.toEqual([]);
  });
});
