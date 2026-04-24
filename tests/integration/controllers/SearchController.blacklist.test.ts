import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
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
    isEncryptionAvailable: () => false,
    decryptString: vi.fn(),
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

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn(() => ({
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: fetchPostsMock,
    searchTags: vi.fn().mockResolvedValue([]),
  })),
}));

import { SearchController } from "@/main/ipc/controllers/SearchController";

describe("SearchController blacklist integration", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: SearchController;

  beforeEach(() => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
    controller = new SearchController();
    fetchPostsMock.mockReset();
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

  it("filters blacklisted tags in browse remote search", async () => {
    mockDb.sqlite.exec("INSERT INTO tag_blacklist (tag) VALUES ('ai_generated');");

    fetchPostsMock.mockResolvedValue([
      {
        id: 101,
        fileUrl: "https://img.example/101.jpg",
        previewUrl: "https://img.example/101-preview.jpg",
        sampleUrl: "https://img.example/101-sample.jpg",
        rating: "s",
        tags: ["ai_generated", "cute"],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: 102,
        fileUrl: "https://img.example/102.jpg",
        previewUrl: "https://img.example/102-preview.jpg",
        sampleUrl: "https://img.example/102-sample.jpg",
        rating: "q",
        tags: ["safe_tag", "another_tag"],
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);

    const searchMethodUnknown = Reflect.get(controller, "search");
    if (typeof searchMethodUnknown !== "function") {
      throw new Error("SearchController.search method is unavailable");
    }

    const result = await searchMethodUnknown.call(controller, null, {
      tags: [],
      page: 1,
      isRandom: false,
    });

    expect(Array.isArray(result)).toBe(true);
    if (!Array.isArray(result)) {
      throw new Error("Search result must be an array");
    }
    expect(result).toHaveLength(1);

    const post = result[0];
    expect(post).toBeDefined();
    expect(typeof post).toBe("object");
    expect(post && "postId" in post).toBe(true);
    expect(post && "tags" in post).toBe(true);

    if (
      !post ||
      typeof post !== "object" ||
      !("postId" in post) ||
      !("tags" in post) ||
      typeof post.postId !== "number" ||
      typeof post.tags !== "string"
    ) {
      throw new Error("Unexpected post shape");
    }

    expect(post.postId).toBe(102);
    expect(post.tags.includes("ai_generated")).toBe(false);
  });
});
