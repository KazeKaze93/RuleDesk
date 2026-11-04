import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "../../../src/main/db/schema";
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
      startCatching: vi.fn(),
    },
  },
}));

vi.mock("../../../src/main/providers", () => ({
  getProvider: vi.fn(() => ({
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: vi.fn().mockResolvedValue({
      posts: [],
      rawItemCount: 0,
      rejectedPostIds: [],
    }),
    searchTags: vi.fn().mockResolvedValue([]),
  })),
  PROVIDER_IDS: ["rule34", "gelbooru"],
}));

import { PostsController } from "../../../src/main/ipc/controllers/PostsController";

type ListedPost = { postId: number };

type PostsControllerInternals = {
  setup: () => void;
  getPosts: (
    event: IpcMainInvokeEvent,
    params: {
      artistId?: number;
      page: number;
      limit: number;
      sortOrder?: "asc" | "desc";
      filters?: { sinceTracking?: boolean };
    }
  ) => Promise<ListedPost[]>;
  getPostsCount: (
    event: IpcMainInvokeEvent,
    params: {
      artistId?: number;
      filters?: { sinceTracking?: boolean };
    }
  ) => Promise<number>;
};

const dummyEvent = {} as IpcMainInvokeEvent;
const SECOND_MS = 1000;
const ARTIST_CREATED_SEC = 1_700_000_000;
const BEFORE_TRACKING_SEC = ARTIST_CREATED_SEC - 86_400;
const AFTER_TRACKING_SEC = ARTIST_CREATED_SEC + 86_400;

describe("PostsController sinceTracking join scope", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PostsControllerInternals;
  let artistId: number;

  beforeEach(() => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    controller = new PostsController() as unknown as PostsControllerInternals;
    controller.setup();

    mockDb.db
      .insert(artists)
      .values({
        name: "Tracked Artist",
        tag: "tracked_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
        createdAt: new Date(ARTIST_CREATED_SEC * SECOND_MS),
      })
      .run();
    const row = mockDb.db
      .select({ id: artists.id })
      .from(artists)
      .all()
      .at(-1);
    if (row === undefined) {
      throw new Error("Failed to insert tracked artist");
    }
    artistId = row.id;

    const insertPost = (postId: number, publishedAtSec: number): void => {
      mockDb.db
        .insert(posts)
        .values({
          postId,
          artistId,
          provider: "rule34",
          fileUrl: `https://example.com/${postId}.jpg`,
          previewUrl: `https://example.com/${postId}_p.jpg`,
          sampleUrl: "",
          tags: `solo post_${postId}`,
          rating: "s",
          mediaType: "image",
          publishedAt: new Date(publishedAtSec * SECOND_MS),
          createdAt: new Date(publishedAtSec * SECOND_MS),
          isFavorited: false,
          isViewed: false,
          viewCount: 0,
        })
        .run();
    };

    // History before subscription — must be excluded by sinceTracking join.
    insertPost(100, BEFORE_TRACKING_SEC);
    insertPost(101, BEFORE_TRACKING_SEC);
    // Posts since tracking — must be included.
    insertPost(200, AFTER_TRACKING_SEC);
    insertPost(201, AFTER_TRACKING_SEC + 10);
  });

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // ignore close races after failed setup
      }
    }
    activeSqlite = null;
    activeDb = null;
  });

  it("getPosts with sinceTracking excludes posts before artist.createdAt", async () => {
    const rows = await controller.getPosts(dummyEvent, {
      artistId,
      page: 1,
      limit: 20,
      sortOrder: "asc",
      filters: { sinceTracking: true },
    });

    expect(rows.map((row) => row.postId)).toEqual([200, 201]);
  });

  it("getPostsCount with sinceTracking matches list join semantics", async () => {
    const total = await controller.getPostsCount(dummyEvent, {
      artistId,
      filters: { sinceTracking: true },
    });

    expect(total).toBe(2);

    const unfiltered = await controller.getPostsCount(dummyEvent, {
      artistId,
    });
    expect(unfiltered).toBe(4);
  });
});
