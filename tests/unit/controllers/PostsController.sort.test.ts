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

type SortedPost = { postId: number; publishedAt: number };

type PostsControllerInternals = {
  setup: () => void;
  getPosts: (
    event: IpcMainInvokeEvent,
    params: {
      artistId?: number;
      page: number;
      limit: number;
      sortOrder?: "asc" | "desc";
      isRandom?: boolean;
      seed?: number;
      filters?: { isFavorited?: boolean; sinceTracking?: boolean };
    }
  ) => Promise<SortedPost[]>;
};

const dummyEvent = {} as IpcMainInvokeEvent;
const SECOND_MS = 1000;
const BASE_PUBLISHED_SEC = 1_700_000_000;

function insertArtist(
  db: ReturnType<typeof createMockDb>["db"],
  values: {
    name: string;
    tag: string;
    provider: "rule34" | "gelbooru";
    createdAt?: Date;
  }
): number {
  db.insert(artists)
    .values({
      name: values.name,
      tag: values.tag,
      provider: values.provider,
      type: "tag",
      apiEndpoint: "https://api.rule34.xxx/",
      createdAt: values.createdAt ?? new Date(BASE_PUBLISHED_SEC * SECOND_MS),
    })
    .run();
  const row = db.select({ id: artists.id }).from(artists).all().at(-1);
  if (row === undefined) {
    throw new Error(`Failed to insert artist ${values.name}`);
  }
  return row.id;
}

function insertPost(
  db: ReturnType<typeof createMockDb>["db"],
  values: {
    postId: number;
    artistId: number;
    provider?: "rule34" | "gelbooru";
    publishedAtSec: number;
    isFavorited?: boolean;
  }
): void {
  db.insert(posts)
    .values({
      postId: values.postId,
      artistId: values.artistId,
      provider: values.provider ?? "rule34",
      fileUrl: `https://example.com/${values.postId}.jpg`,
      previewUrl: `https://example.com/${values.postId}_p.jpg`,
      sampleUrl: "",
      tags: `solo post_${values.postId}`,
      rating: "s",
      mediaType: "image",
      publishedAt: new Date(values.publishedAtSec * SECOND_MS),
      createdAt: new Date(values.publishedAtSec * SECOND_MS),
      isFavorited: values.isFavorited ?? false,
      isViewed: false,
      viewCount: 0,
    })
    .run();
}

describe("PostsController getPosts sort keys", () => {
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

  it("artist-scoped gallery orders by post_id (ignores published_at skew)", async () => {
    const artistId = insertArtist(mockDb.db, {
      name: "Gallery Artist",
      tag: "gallery_artist",
      provider: "rule34",
    });

    // Higher post_id but older published_at — post_id sort must win.
    insertPost(mockDb.db, {
      postId: 30,
      artistId,
      publishedAtSec: BASE_PUBLISHED_SEC,
    });
    insertPost(mockDb.db, {
      postId: 10,
      artistId,
      publishedAtSec: BASE_PUBLISHED_SEC + 100,
    });
    insertPost(mockDb.db, {
      postId: 20,
      artistId,
      publishedAtSec: BASE_PUBLISHED_SEC + 50,
    });

    const descRows = await controller.getPosts(dummyEvent, {
      artistId,
      page: 1,
      limit: 10,
      sortOrder: "desc",
    });
    expect(descRows.map((row) => row.postId)).toEqual([30, 20, 10]);

    const ascRows = await controller.getPosts(dummyEvent, {
      artistId,
      page: 1,
      limit: 10,
      sortOrder: "asc",
    });
    expect(ascRows.map((row) => row.postId)).toEqual([10, 20, 30]);
  });

  it("cross-artist favorites order by published_at then post_id tiebreaker", async () => {
    const artistA = insertArtist(mockDb.db, {
      name: "Artist A",
      tag: "artist_a",
      provider: "rule34",
    });
    const artistB = insertArtist(mockDb.db, {
      name: "Artist B",
      tag: "artist_b",
      provider: "gelbooru",
    });

    // Same published_at → post_id decides; mixed providers / colliding post_id spaces.
    insertPost(mockDb.db, {
      postId: 5,
      artistId: artistA,
      provider: "rule34",
      publishedAtSec: BASE_PUBLISHED_SEC + 10,
      isFavorited: true,
    });
    insertPost(mockDb.db, {
      postId: 99,
      artistId: artistB,
      provider: "gelbooru",
      publishedAtSec: BASE_PUBLISHED_SEC + 10,
      isFavorited: true,
    });
    insertPost(mockDb.db, {
      postId: 1,
      artistId: artistA,
      provider: "rule34",
      publishedAtSec: BASE_PUBLISHED_SEC + 20,
      isFavorited: true,
    });
    insertPost(mockDb.db, {
      postId: 50,
      artistId: artistB,
      provider: "gelbooru",
      publishedAtSec: BASE_PUBLISHED_SEC,
      isFavorited: true,
    });

    const descRows = await controller.getPosts(dummyEvent, {
      page: 1,
      limit: 10,
      sortOrder: "desc",
      filters: { isFavorited: true },
    });
    expect(descRows.map((row) => row.postId)).toEqual([1, 99, 5, 50]);

    const ascRows = await controller.getPosts(dummyEvent, {
      page: 1,
      limit: 10,
      sortOrder: "asc",
      filters: { isFavorited: true },
    });
    expect(ascRows.map((row) => row.postId)).toEqual([50, 5, 99, 1]);
  });

  it("random seed path keeps seededOrderBy stable for the same seed", async () => {
    const artistId = insertArtist(mockDb.db, {
      name: "Random Artist",
      tag: "random_artist",
      provider: "rule34",
    });
    for (let postId = 1; postId <= 5; postId += 1) {
      insertPost(mockDb.db, {
        postId,
        artistId,
        publishedAtSec: BASE_PUBLISHED_SEC + postId,
      });
    }

    const first = await controller.getPosts(dummyEvent, {
      artistId,
      page: 1,
      limit: 5,
      isRandom: true,
      seed: 42,
    });
    const second = await controller.getPosts(dummyEvent, {
      artistId,
      page: 1,
      limit: 5,
      isRandom: true,
      seed: 42,
    });
    expect(first.map((row) => row.postId)).toEqual(
      second.map((row) => row.postId)
    );
    expect(first).toHaveLength(5);

    const otherSeed = await controller.getPosts(dummyEvent, {
      artistId,
      page: 1,
      limit: 5,
      isRandom: true,
      seed: 99,
    });
    expect(otherSeed.map((row) => row.postId).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });
});
