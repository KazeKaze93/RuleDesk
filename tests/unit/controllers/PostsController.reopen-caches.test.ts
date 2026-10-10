import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { artists, posts } from "@/main/db/schema";
import { EXTERNAL_ARTIST_ID } from "@/shared/constants";
import { eq } from "drizzle-orm";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";

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
  getProvider: vi.fn((id: string) => ({
    id,
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: vi.fn().mockResolvedValue({
      posts: [
        {
          id: 424242,
          fileUrl: "https://example.com/424242.jpg",
          previewUrl: "https://example.com/424242_p.jpg",
          sampleUrl: "https://example.com/424242_s.jpg",
          tags: ["tag_a"],
          rating: "s",
          score: 0,
          source: "",
          width: 100,
          height: 100,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
    }),
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
import {
  registerDatabaseInContainerAfterReinit,
  resetDatabaseReopenedListenersForTests,
} from "@/main/core/di/databaseRegistration";

type PostsControllerInternals = {
  setup: () => void;
  shadowInsertPost: (
    event: IpcMainInvokeEvent,
    request: { postId: number; provider: "rule34" | "gelbooru" }
  ) => Promise<{ id: number; postId: number; provider: string }>;
  externalArtistExistsCache: boolean;
  ftsTableExistsCache: boolean;
};

const dummyEvent = {} as IpcMainInvokeEvent;

describe("PostsController reopen schema caches", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PostsControllerInternals;

  beforeEach(() => {
    resetDatabaseReopenedListenersForTests();
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    container.register(DI_TOKENS.DB, mockDb.db);
    controller = new PostsController() as unknown as PostsControllerInternals;
    controller.setup();
  });

  afterEach(() => {
    resetDatabaseReopenedListenersForTests();
    mockDb.sqlite.close();
    activeSqlite = null;
    activeDb = null;
    container.clear();
  });

  it("clears externalArtistExistsCache on DB reopen so restore without artist 0 can re-ensure", async () => {
    mockDb.db
      .insert(artists)
      .values({
        id: EXTERNAL_ARTIST_ID,
        name: "Artist 0",
        tag: "external_0",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "",
        lastPostId: 0,
        newPostsCount: 0,
        createdAt: new Date(),
      })
      .run();

    await controller.shadowInsertPost(dummyEvent, {
      postId: 424242,
      provider: "rule34",
    });
    expect(controller.externalArtistExistsCache).toBe(true);

    // Simulate restore from a backup that lacked EXTERNAL_ARTIST_ID.
    mockDb.db.delete(posts).run();
    mockDb.db
      .delete(artists)
      .where(eq(artists.id, EXTERNAL_ARTIST_ID))
      .run();
    expect(
      mockDb.db
        .select()
        .from(artists)
        .where(eq(artists.id, EXTERNAL_ARTIST_ID))
        .all()
    ).toHaveLength(0);

    registerDatabaseInContainerAfterReinit();
    expect(controller.externalArtistExistsCache).toBe(false);
    expect(controller.ftsTableExistsCache).toBe(true);

    const inserted = await controller.shadowInsertPost(dummyEvent, {
      postId: 424242,
      provider: "rule34",
    });
    expect(inserted.postId).toBe(424242);
    expect(
      mockDb.db
        .select()
        .from(artists)
        .where(eq(artists.id, EXTERNAL_ARTIST_ID))
        .all()
    ).toHaveLength(1);
  });
});
