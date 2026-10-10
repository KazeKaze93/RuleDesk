import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { artists, posts } from "@/main/db/schema";
import { EXTERNAL_ARTIST_ID } from "@/shared/constants";
import { and, eq } from "drizzle-orm";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";
import type { PostData } from "@/shared/schemas/post";

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

const fetchPostsMock = vi.fn();

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn((id: string) => ({
    id,
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: fetchPostsMock,
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

vi.mock("@/main/services/post-lookup-cache", () => ({
  resolvePostLookup: vi.fn(
    async (
      _db: unknown,
      _provider: string,
      postId: number,
      fetcher: () => Promise<unknown[]>
    ) => {
      const postsFromApi = await fetcher();
      return { status: "found" as const, post: postsFromApi[0] };
    }
  ),
}));

import { PostsController } from "@/main/ipc/controllers/PostsController";

type PostsControllerInternals = {
  setup: () => void;
  markViewed: (
    event: IpcMainInvokeEvent,
    postId: number,
    postData?: PostData
  ) => Promise<boolean>;
  toggleFavorite: (
    event: IpcMainInvokeEvent,
    postId: number,
    postData?: PostData
  ) => Promise<boolean>;
  shadowInsertPost: (
    event: IpcMainInvokeEvent,
    request: { postId: number; provider: "rule34" | "gelbooru" }
  ) => Promise<{ id: number; postId: number; provider: string }>;
};

const dummyEvent = {} as IpcMainInvokeEvent;
const SHARED_POST_ID = 12345;

function externalPostData(
  provider: "rule34" | "gelbooru",
  host: string
): PostData {
  return {
    postId: SHARED_POST_ID,
    artistId: EXTERNAL_ARTIST_ID,
    provider,
    fileUrl: `https://${host}/images/${SHARED_POST_ID}.jpg`,
    previewUrl: `https://${host}/thumbnails/${SHARED_POST_ID}.jpg`,
    sampleUrl: `https://${host}/samples/${SHARED_POST_ID}.jpg`,
    rating: "e",
    tags: "tag_a tag_b",
    publishedAt: Date.now(),
  };
}

describe("PostsController provider collision identity", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PostsControllerInternals;

  beforeEach(() => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
    controller = new PostsController() as unknown as PostsControllerInternals;
    controller.setup();
    fetchPostsMock.mockReset();
  });

  afterEach(() => {
    mockDb.sqlite.close();
    activeSqlite = null;
    container.clear();
  });

  it("stores Rule34 and Gelbooru external posts with the same postId as two rows", async () => {
    await controller.markViewed(
      dummyEvent,
      -SHARED_POST_ID,
      externalPostData("rule34", "api-cdn.rule34.xxx")
    );
    await controller.toggleFavorite(
      dummyEvent,
      -SHARED_POST_ID,
      externalPostData("gelbooru", "img4.gelbooru.com")
    );

    const rows = mockDb.db
      .select({
        id: posts.id,
        provider: posts.provider,
        isViewed: posts.isViewed,
        isFavorited: posts.isFavorited,
      })
      .from(posts)
      .where(
        and(
          eq(posts.artistId, EXTERNAL_ARTIST_ID),
          eq(posts.postId, SHARED_POST_ID)
        )
      )
      .all();

    expect(rows).toHaveLength(2);
    const rule34 = rows.find((r) => r.provider === "rule34");
    const gelbooru = rows.find((r) => r.provider === "gelbooru");
    expect(rule34?.isViewed).toBe(true);
    expect(rule34?.isFavorited).toBe(false);
    expect(gelbooru?.isFavorited).toBe(true);
    expect(gelbooru?.isViewed).toBe(false);
  });

  it("favoriting one provider does not flip the sibling provider row", async () => {
    await controller.toggleFavorite(
      dummyEvent,
      -SHARED_POST_ID,
      externalPostData("rule34", "api-cdn.rule34.xxx")
    );
    await controller.toggleFavorite(
      dummyEvent,
      -SHARED_POST_ID,
      externalPostData("gelbooru", "img4.gelbooru.com")
    );
    // Unfavorite gelbooru only
    await controller.toggleFavorite(
      dummyEvent,
      -SHARED_POST_ID,
      externalPostData("gelbooru", "img4.gelbooru.com")
    );

    const rows = mockDb.db
      .select({
        provider: posts.provider,
        isFavorited: posts.isFavorited,
      })
      .from(posts)
      .where(
        and(
          eq(posts.artistId, EXTERNAL_ARTIST_ID),
          eq(posts.postId, SHARED_POST_ID)
        )
      )
      .all();

    expect(rows.find((r) => r.provider === "rule34")?.isFavorited).toBe(true);
    expect(rows.find((r) => r.provider === "gelbooru")?.isFavorited).toBe(
      false
    );
  });

  it("performShadowInsert for Gelbooru creates a new row when Rule34 sibling exists", async () => {
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
        tags: "r34_only",
        rating: "e",
        mediaType: "image",
        publishedAt: new Date(),
        isViewed: true,
        isFavorited: true,
      })
      .run();

    fetchPostsMock.mockResolvedValue({
      posts: [
        {
          id: SHARED_POST_ID,
          fileUrl: "https://img4.gelbooru.com/images/12345.jpg",
          previewUrl: "https://img4.gelbooru.com/thumbnails/12345.jpg",
          sampleUrl: "https://img4.gelbooru.com/samples/12345.jpg",
          rating: "e",
          tags: ["gel_only"],
          createdAt: new Date(),
        },
      ],
      rawItemCount: 1,
      rejectedPostIds: [],
    });

    const inserted = await controller.shadowInsertPost(dummyEvent, {
      postId: SHARED_POST_ID,
      provider: "gelbooru",
    });

    expect(inserted.provider).toBe("gelbooru");
    expect(inserted.postId).toBe(SHARED_POST_ID);

    const rows = mockDb.db
      .select({
        id: posts.id,
        provider: posts.provider,
        isFavorited: posts.isFavorited,
        tags: posts.tags,
      })
      .from(posts)
      .where(
        and(
          eq(posts.artistId, EXTERNAL_ARTIST_ID),
          eq(posts.postId, SHARED_POST_ID)
        )
      )
      .all();

    expect(rows).toHaveLength(2);
    const rule34 = rows.find((r) => r.provider === "rule34");
    const gelbooru = rows.find((r) => r.provider === "gelbooru");
    expect(rule34?.isFavorited).toBe(true);
    expect(rule34?.tags).toBe("r34_only");
    expect(gelbooru?.id).toBe(inserted.id);
    expect(gelbooru?.isFavorited).toBe(false);
    expect(gelbooru?.tags).toBe("gel_only");
  });
});
