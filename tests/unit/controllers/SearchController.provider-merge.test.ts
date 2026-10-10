import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { artists, posts, settings, SETTINGS_ID } from "@/main/db/schema";
import { EXTERNAL_ARTIST_ID } from "@/shared/constants";
import type Database from "better-sqlite3";

let activeSqlite: Database.Database | null = null;
let activeDb: ReturnType<typeof createMockDb>["db"] | null = null;

vi.mock("@/main/db/client", () => ({
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
      startCatching: () => undefined,
    },
  },
}));

const fetchPostsMock = vi.fn();

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn((id: string) => ({
    id,
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: fetchPostsMock,
    searchTags: vi.fn().mockResolvedValue([]),
  })),
}));

import { SearchController } from "@/main/ipc/controllers/SearchController";

const SHARED_POST_ID = 12345;

describe("SearchController Browse merge is provider-scoped", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: SearchController;

  beforeEach(async () => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
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

    mockDb.db
      .insert(artists)
      .values({
        id: EXTERNAL_ARTIST_ID,
        name: "Artist 0",
        tag: "external_0",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "",
      })
      .run();

    mockDb.db
      .insert(posts)
      .values({
        postId: SHARED_POST_ID,
        artistId: EXTERNAL_ARTIST_ID,
        provider: "rule34",
        fileUrl: "https://api-cdn.rule34.xxx/images/12345.jpg",
        previewUrl: "https://api-cdn.rule34.xxx/thumbnails/12345.jpg",
        sampleUrl: "",
        tags: "r34",
        rating: "e",
        mediaType: "image",
        publishedAt: new Date(),
        isViewed: true,
        isFavorited: true,
      })
      .run();

    controller = new SearchController();
    fetchPostsMock.mockReset();
  });

  afterEach(() => {
    mockDb.sqlite.close();
    activeSqlite = null;
    activeDb = null;
    container.clear();
  });

  it("does not merge Rule34 fav/viewed onto Gelbooru Browse results with the same postId", async () => {
    fetchPostsMock.mockResolvedValue({
      posts: [
        {
          id: SHARED_POST_ID,
          fileUrl: "https://img4.gelbooru.com/images/12345.jpg",
          previewUrl: "https://img4.gelbooru.com/thumbnails/12345.jpg",
          sampleUrl: "",
          rating: "e",
          tags: ["gel"],
          createdAt: new Date(),
        },
      ],
      rawItemCount: 1,
      rejectedPostIds: [],
    });

    const searchMethodUnknown = Reflect.get(controller, "search");
    if (typeof searchMethodUnknown !== "function") {
      throw new Error("SearchController.search method is unavailable");
    }

    const result = await searchMethodUnknown.call(controller, null, {
      tags: ["gel"],
      page: 1,
      isRandom: false,
      limit: 20,
    });

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].postId).toBe(SHARED_POST_ID);
    expect(result.posts[0].provider).toBe("gelbooru");
    expect(result.posts[0].isFavorited).toBe(false);
    expect(result.posts[0].isViewed).toBe(false);
  });
});
