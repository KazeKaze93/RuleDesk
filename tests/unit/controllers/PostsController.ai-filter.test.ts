import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { artists, posts } from "@/main/db/schema";
import {
  dropFtsTriggersForBulkInsert,
  ensureFtsTriggers,
  rebuildFtsIndex,
} from "@/main/db/fts-triggers";
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
      startCatching: vi.fn(),
    },
  },
}));

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn(() => ({
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: vi.fn().mockResolvedValue([]),
    searchTags: vi.fn().mockResolvedValue([]),
  })),
  PROVIDER_IDS: ["rule34", "gelbooru"],
}));

import { PostsController } from "@/main/ipc/controllers/PostsController";

type PostsControllerInternals = {
  setup: () => void;
  getPosts: (
    event: IpcMainInvokeEvent,
    params: {
      artistId?: number;
      page: number;
      limit: number;
      filters?: { aiFilter?: "all" | "hide" | "only" };
    }
  ) => Promise<Array<{ postId: number; tags: string }>>;
};

const dummyEvent = {} as IpcMainInvokeEvent;
const AI_POST_COUNT = 4;
const NON_AI_POST_COUNT = 4;
const TOTAL_POST_COUNT = AI_POST_COUNT + NON_AI_POST_COUNT;

function seedMixedAiPosts(
  db: ReturnType<typeof createMockDb>["db"],
  artistId: number
): void {
  const now = new Date();
  for (let i = 1; i <= TOTAL_POST_COUNT; i += 1) {
    const isAi = i <= AI_POST_COUNT;
    db.insert(posts)
      .values({
        postId: 9000 + i,
        artistId,
        fileUrl: `https://example.com/${i}.jpg`,
        previewUrl: `https://example.com/${i}_p.jpg`,
        sampleUrl: "",
        tags: isAi
          ? `character_${i} ai_generated rating_safe`
          : `character_${i} traditional_media rating_safe`,
        rating: "s",
        mediaType: "image",
        publishedAt: now,
      })
      .run();
  }
}

function isAiPost(tags: string): boolean {
  return tags.includes("ai_generated");
}

describe("PostsController aiFilter during FTS bulk-sync window", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PostsControllerInternals;
  let artistId: number;

  beforeEach(() => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
    controller = new PostsController() as unknown as PostsControllerInternals;
    controller.setup();

    mockDb.db
      .insert(artists)
      .values({
        name: "AI Filter Artist",
        tag: "ai_filter_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = mockDb.db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }
    artistId = artist.id;
  });

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // ignore
      }
    }
    activeSqlite = null;
    container.clear();
  });

  async function queryAiFilter(aiFilter: "hide" | "only") {
    return controller.getPosts(dummyEvent, {
      artistId,
      page: 1,
      limit: 50,
      filters: { aiFilter },
    });
  }

  it("hide/only stay correct while insert triggers are dropped (bulk-sync window)", async () => {
    dropFtsTriggersForBulkInsert(mockDb.sqlite);
    seedMixedAiPosts(mockDb.db, artistId);

    const hide = await queryAiFilter("hide");
    const only = await queryAiFilter("only");

    expect(hide).toHaveLength(NON_AI_POST_COUNT);
    expect(hide.every((post) => !isAiPost(post.tags))).toBe(true);
    expect(only).toHaveLength(AI_POST_COUNT);
    expect(only.every((post) => isAiPost(post.tags))).toBe(true);
  });

  it("hide/only stay correct after rebuild restores the index", async () => {
    dropFtsTriggersForBulkInsert(mockDb.sqlite);
    seedMixedAiPosts(mockDb.db, artistId);
    rebuildFtsIndex(mockDb.sqlite);
    ensureFtsTriggers(mockDb.sqlite);

    const hide = await queryAiFilter("hide");
    const only = await queryAiFilter("only");

    expect(hide).toHaveLength(NON_AI_POST_COUNT);
    expect(hide.every((post) => !isAiPost(post.tags))).toBe(true);
    expect(only).toHaveLength(AI_POST_COUNT);
    expect(only.every((post) => isAiPost(post.tags))).toBe(true);
  });

  it("hide/only stay correct on the live-index path (triggers never dropped)", async () => {
    seedMixedAiPosts(mockDb.db, artistId);

    const hide = await queryAiFilter("hide");
    const only = await queryAiFilter("only");

    expect(hide).toHaveLength(NON_AI_POST_COUNT);
    expect(hide.every((post) => !isAiPost(post.tags))).toBe(true);
    expect(only).toHaveLength(AI_POST_COUNT);
    expect(only.every((post) => isAiPost(post.tags))).toBe(true);
  });
});
