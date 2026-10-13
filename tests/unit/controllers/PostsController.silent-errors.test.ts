import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";

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

vi.mock("../../../src/main/providers", () => ({
  getProvider: vi.fn(() => ({
    id: "rule34",
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: vi.fn().mockResolvedValue([]),
    searchTags: vi.fn().mockResolvedValue([]),
  })),
  PROVIDER_IDS: ["rule34", "gelbooru"],
}));

vi.mock("../../../src/main/services/credentials", () => ({
  getDecryptedApiSettings: vi.fn(async () => ({
    userId: "u",
    apiKey: "k",
  })),
}));

import { PostsController } from "../../../src/main/ipc/controllers/PostsController";

type PostsControllerInternals = {
  setup: () => void;
  getPostsCount: (
    event: IpcMainInvokeEvent,
    params: { artistId?: number }
  ) => Promise<number>;
  getPostsCountWithFilters: (
    event: IpcMainInvokeEvent,
    params: { artistId?: number; filters?: { sinceTracking?: boolean } }
  ) => Promise<number>;
  markViewed: (
    event: IpcMainInvokeEvent,
    postId: number
  ) => Promise<boolean>;
  resetPostCache: (
    event: IpcMainInvokeEvent,
    postId: number
  ) => Promise<boolean>;
};

const dummyEvent = {} as IpcMainInvokeEvent;

describe("PostsController DB errors do not become empty success", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PostsControllerInternals;

  beforeEach(() => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    controller = new PostsController() as unknown as PostsControllerInternals;
    controller.setup();
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // already closed in tests that force DB failure
    }
    activeSqlite = null;
    activeDb = null;
  });

  function closeDb(): void {
    mockDb.sqlite.close();
    activeSqlite = null;
    activeDb = null;
  }

  it("getPostsCount rejects on DB error (not 0)", async () => {
    closeDb();
    await expect(
      controller.getPostsCount(dummyEvent, {})
    ).rejects.toBeInstanceOf(Error);
  });

  it("getPostsCountWithFilters rejects on DB error (not 0)", async () => {
    closeDb();
    await expect(
      controller.getPostsCountWithFilters(dummyEvent, {
        filters: { sinceTracking: true },
      })
    ).rejects.toBeInstanceOf(Error);
  });

  it("markViewed rejects on DB error (not false)", async () => {
    closeDb();
    await expect(controller.markViewed(dummyEvent, 1)).rejects.toBeInstanceOf(
      Error
    );
  });

  it("resetPostCache rejects on DB error (not false)", async () => {
    closeDb();
    await expect(
      controller.resetPostCache(dummyEvent, 1)
    ).rejects.toBeInstanceOf(Error);
  });
});
