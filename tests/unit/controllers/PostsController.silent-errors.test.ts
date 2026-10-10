import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";

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

vi.mock("@/main/services/credentials", () => ({
  getDecryptedApiSettings: vi.fn(async () => ({
    userId: "u",
    apiKey: "k",
  })),
}));

import { PostsController } from "@/main/ipc/controllers/PostsController";

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
  markAllViewed: (
    event: IpcMainInvokeEvent
  ) => Promise<{ updatedCount: number }>;
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
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
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
    container.clear();
  });

  function closeDb(): void {
    mockDb.sqlite.close();
    activeSqlite = null;
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

  it("markAllViewed rejects on DB error (not {updatedCount:0})", async () => {
    closeDb();
    await expect(
      controller.markAllViewed(dummyEvent)
    ).rejects.toBeInstanceOf(Error);
  });

  it("resetPostCache rejects on DB error (not false)", async () => {
    closeDb();
    await expect(
      controller.resetPostCache(dummyEvent, 1)
    ).rejects.toBeInstanceOf(Error);
  });
});
