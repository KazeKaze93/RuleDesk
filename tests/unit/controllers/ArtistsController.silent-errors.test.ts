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

import { ArtistsController } from "@/main/ipc/controllers/ArtistsController";

type ArtistsControllerInternals = {
  setup: () => void;
  searchArtists: (
    event: IpcMainInvokeEvent,
    query: string
  ) => Promise<unknown[]>;
};

const dummyEvent = {} as IpcMainInvokeEvent;

describe("ArtistsController.searchArtists DB errors", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: ArtistsControllerInternals;

  beforeEach(() => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
    controller = new ArtistsController() as unknown as ArtistsControllerInternals;
    controller.setup();
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // already closed
    }
    activeSqlite = null;
    container.clear();
  });

  it("rejects on DB error instead of returning []", async () => {
    mockDb.sqlite.close();
    activeSqlite = null;
    await expect(
      controller.searchArtists(dummyEvent, "artist")
    ).rejects.toBeInstanceOf(Error);
  });
});
