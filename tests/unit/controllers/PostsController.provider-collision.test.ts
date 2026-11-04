import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "../../../src/main/db/schema";
import { EXTERNAL_ARTIST_ID } from "@shared/constants";
import { and, eq } from "drizzle-orm";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";
import type { PostData } from "@shared/schemas/post";

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

const fetchPostsMock = vi.fn();

vi.mock("../../../src/main/providers", async () => {
  const { createCodedError } = await import(
    "../../../src/shared/utils/coded-error"
  );
  const { ErrorCode } = await import("../../../src/shared/types/error-codes");
  return {
    getProvider: vi.fn((id: string) => {
      if (id !== "rule34") {
        throw createCodedError(
          `Unsupported provider: ${id}`,
          ErrorCode.UNSUPPORTED_PROVIDER
        );
      }
      return {
        id,
        formatTag: (tag: string) => tag.trim().toLowerCase(),
        fetchPosts: fetchPostsMock,
        searchTags: vi.fn().mockResolvedValue([]),
      };
    }),
    PROVIDER_IDS: ["rule34"],
    isProviderId: (id: string) => id === "rule34",
  };
});

vi.mock("../../../src/main/services/credentials", () => ({
  getDecryptedApiSettings: vi.fn(async () => ({
    userId: "u",
    apiKey: "k",
  })),
}));

vi.mock("../../../src/main/services/post-lookup-cache", () => ({
  resolvePostLookup: vi.fn(
    async (
      _provider: string,
      postId: number,
      fetcher: () => Promise<unknown[]>
    ) => {
      const postsFromApi = await fetcher();
      return { status: "found" as const, post: postsFromApi[0] };
    }
  ),
}));

import { PostsController } from "../../../src/main/ipc/controllers/PostsController";

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
    request: { postId: number; provider: string }
  ) => Promise<{ id: number; postId: number; provider: string }>;
};

const dummyEvent = {} as IpcMainInvokeEvent;
const SHARED_POST_ID = 12345;
/** Arbitrary stored provider string — identity is (provider, postId). */
const STORED_OTHER_PROVIDER = "gelbooru";

function externalPostData(provider: string, host: string): PostData {
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
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    controller = new PostsController() as unknown as PostsControllerInternals;
    controller.setup();
    fetchPostsMock.mockReset();
  });

  afterEach(() => {
    mockDb.sqlite.close();
    activeSqlite = null;
    activeDb = null;
  });

  it("stores Rule34 and a legacy stored-provider external posts with the same postId as two rows", async () => {
    await controller.markViewed(
      dummyEvent,
      -SHARED_POST_ID,
      externalPostData("rule34", "api-cdn.rule34.xxx")
    );
    await controller.toggleFavorite(
      dummyEvent,
      -SHARED_POST_ID,
      externalPostData(STORED_OTHER_PROVIDER, "img4.gelbooru.com")
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
    const other = rows.find((r) => r.provider === STORED_OTHER_PROVIDER);
    expect(rule34?.isViewed).toBe(true);
    expect(rule34?.isFavorited).toBe(false);
    expect(other?.isFavorited).toBe(true);
    expect(other?.isViewed).toBe(false);
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
      externalPostData(STORED_OTHER_PROVIDER, "img4.gelbooru.com")
    );
    await controller.toggleFavorite(
      dummyEvent,
      -SHARED_POST_ID,
      externalPostData(STORED_OTHER_PROVIDER, "img4.gelbooru.com")
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
    expect(
      rows.find((r) => r.provider === STORED_OTHER_PROVIDER)?.isFavorited
    ).toBe(false);
  });

  it("shadowInsert rejects unsupported provider while sibling rule34 row remains", async () => {
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

    await expect(
      controller.shadowInsertPost(dummyEvent, {
        postId: SHARED_POST_ID,
        provider: STORED_OTHER_PROVIDER,
      })
    ).rejects.toThrow(/Unsupported provider: gelbooru/);

    const rows = mockDb.db
      .select({
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

    expect(rows).toHaveLength(1);
    expect(rows[0].provider).toBe("rule34");
    expect(rows[0].isFavorited).toBe(true);
    expect(rows[0].tags).toBe("r34_only");
    expect(fetchPostsMock).not.toHaveBeenCalled();
  });
});
