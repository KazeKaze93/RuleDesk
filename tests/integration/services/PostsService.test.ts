import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "@/main/db/schema";
import { eq } from "drizzle-orm";

vi.mock("electron", () => ({
  app: { getPath: () => "/tmp" },
  safeStorage: {
    isEncryptionAvailable: () => false,
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
      console: {
        level: false,
        format: "",
      },
      file: {
        level: "info",
        resolvePathFn: vi.fn(),
      },
      ipc: {},
    },
    errorHandler: {
      startCatching: vi.fn(),
    },
  },
}));

let mockSqliteInstance: ReturnType<typeof createMockDb>["sqlite"] | null = null;

vi.mock("@/main/db/client", () => ({
  getSqliteInstance: () => {
    if (!mockSqliteInstance) {
      throw new Error("Mock SQLite not set");
    }
    return mockSqliteInstance;
  },
  getDb: vi.fn(),
  initializeDatabase: vi.fn(),
  closeDatabase: vi.fn(),
}));

import { PostsService } from "@/main/services/posts-service";

describe("PostsService (integration, in-memory DB)", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let service: PostsService;

  beforeEach(() => {
    mockDb = createMockDb();
    mockSqliteInstance = mockDb.sqlite;
    service = new PostsService(mockDb.db);
    service.initializeFtsTableCheck();
  });

  afterEach(() => {
    mockSqliteInstance = null;
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        /* ignore */
      }
    }
  });

  it("getPostsCount returns 0 for empty database", async () => {
    const count = await service.getPostsCount({});
    expect(count).toBe(0);
  });

  it("getPosts and getPostsCount return inserted post for artist", async () => {
    const now = new Date();
    const [artist] = await mockDb.db
      .insert(artists)
      .values({
        name: "Test Artist",
        tag: "test_artist_tag_posts_service",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "",
        lastPostId: 0,
        newPostsCount: 0,
        createdAt: now,
      })
      .returning();

    if (!artist) {
      throw new Error("expected artist");
    }

    await mockDb.db.insert(posts).values({
      postId: 1001,
      artistId: artist.id,
      fileUrl: "https://example.com/file.jpg",
      previewUrl: "https://example.com/prev.jpg",
      sampleUrl: "",
      title: "",
      rating: "s",
      tags: "a b",
      mediaType: "image",
      publishedAt: now,
      createdAt: now,
      isViewed: false,
      isFavorited: false,
    });

    const total = await service.getPostsCount({ artistId: artist.id });
    expect(total).toBe(1);

    const rows = await service.getPosts({
      artistId: artist.id,
      page: 1,
      limit: 50,
      isRandom: false,
      sortOrder: "desc",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.postId).toBe(1001);
    expect(rows[0]?.fileUrl).toBe("https://example.com/file.jpg");
  });

  it("markViewed sets isViewed and resetPostCache clears it", async () => {
    const now = new Date();
    const [artist] = await mockDb.db
      .insert(artists)
      .values({
        name: "Artist M",
        tag: "test_mark_viewed_unique",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "",
        lastPostId: 0,
        newPostsCount: 0,
        createdAt: now,
      })
      .returning();
    if (!artist) throw new Error("no artist");

    const [p] = await mockDb.db
      .insert(posts)
      .values({
        postId: 2002,
        artistId: artist.id,
        fileUrl: "https://example.com/f.jpg",
        previewUrl: "https://example.com/p.jpg",
        sampleUrl: "",
        title: "",
        rating: "s",
        tags: "t",
        mediaType: "image",
        publishedAt: now,
        createdAt: now,
        isViewed: false,
        isFavorited: false,
      })
      .returning();
    if (!p) throw new Error("no post");

    const ok1 = await service.markViewed(p.id);
    expect(ok1).toBe(true);
    const afterView = await mockDb.db.query.posts.findFirst({
      where: eq(posts.id, p.id),
    });
    expect(afterView?.isViewed).toBe(true);

    const ok2 = await service.resetPostCache(p.id);
    expect(ok2).toBe(true);
    const afterReset = await mockDb.db.query.posts.findFirst({
      where: eq(posts.id, p.id),
    });
    expect(afterReset?.isViewed).toBe(false);
  });
});
