import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "@/main/db/schema";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { IPC_CHANNELS } from "@/main/ipc/channels";
import {
  StatsController,
  TOP_TAGS_CACHE_TTL_MS,
} from "@/main/ipc/controllers/StatsController";
import type Database from "better-sqlite3";

let activeSqlite: InstanceType<typeof Database> | null = null;

vi.mock("@/main/db/client", () => ({
  getSqliteInstance: () => {
    if (!activeSqlite) {
      throw new Error("Test sqlite instance is not initialized");
    }
    return activeSqlite;
  },
}));

vi.mock("@/main/db/paths", () => ({
  getDatabasePaths: () => ({
    dbPath: "C:\\fake\\data.bin",
    userDataPath: "C:\\fake",
  }),
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    default: {
      ...actual,
      statSync: () => ({ size: 4096 }),
    },
    statSync: () => ({ size: 4096 }),
  };
});

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
  },
}));

type SendEventFn = (channel: string, data?: unknown) => void;

describe("StatsController top-tags cache", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let artistId: number;
  let sendEventCalls: string[];
  let sendEvent: SendEventFn;

  beforeEach(() => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    sendEventCalls = [];
    sendEvent = vi.fn((channel: string) => {
      sendEventCalls.push(channel);
    });
    container.clear();
    container.register(DI_TOKENS.SYNC_SERVICE, { sendEvent });

    mockDb.db
      .insert(artists)
      .values({
        name: "Cache Artist",
        tag: "cache_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();

    const insertedArtist = mockDb.db
      .select({ id: artists.id })
      .from(artists)
      .all()[0];
    if (insertedArtist === undefined) {
      throw new Error("Failed to insert artist");
    }
    artistId = insertedArtist.id;

    const now = new Date();
    mockDb.db
      .insert(posts)
      .values([
        {
          postId: 1,
          artistId,
          fileUrl: "https://example.com/1.jpg",
          previewUrl: "https://example.com/1_preview.jpg",
          sampleUrl: "",
          title: "",
          rating: "s",
          tags: "alpha beta",
          mediaType: "image",
          publishedAt: now,
          createdAt: now,
          isFavorited: false,
          isViewed: true,
        },
        {
          postId: 2,
          artistId,
          fileUrl: "https://example.com/2.jpg",
          previewUrl: "https://example.com/2_preview.jpg",
          sampleUrl: "",
          title: "",
          rating: "s",
          tags: "alpha",
          mediaType: "image",
          publishedAt: now,
          createdAt: now,
          isFavorited: false,
          isViewed: true,
        },
      ])
      .run();
  });

  afterEach(() => {
    activeSqlite = null;
    container.clear();
    try {
      mockDb.sqlite.close();
    } catch {
      // Ignore close errors in tests.
    }
  });

  function readStats(controller: StatsController) {
    // Private method: integration seam for full ExtendedStats without IPC.
    // @ts-expect-error intentional private access in test
    return controller.getExtendedStats(null);
  }

  function queryCount(controller: StatsController): number {
    // @ts-expect-error intentional private access in test
    return controller.topTagsQueryCount;
  }

  it("reuses CTE results within TTL (second call does not re-query)", () => {
    const controller = new StatsController();
    controller.setup();

    const first = readStats(controller);
    const countAfterFirst = queryCount(controller);
    const second = readStats(controller);
    const countAfterSecond = queryCount(controller);

    expect(countAfterFirst).toBe(1);
    expect(countAfterSecond).toBe(1);
    expect(second.topTags).toEqual(first.topTags);
    expect(first.topTags[0]).toEqual({ tag: "alpha", count: 2 });
  });

  it("returns the same topTags as a fresh CTE after cache invalidation", async () => {
    const controller = new StatsController();
    controller.setup();
    await Promise.resolve();

    const first = readStats(controller).topTags;
    expect(queryCount(controller)).toBe(1);

    const syncService = container.resolve(DI_TOKENS.SYNC_SERVICE);
    syncService.sendEvent(IPC_CHANNELS.SYNC.END);

    const second = readStats(controller).topTags;
    expect(queryCount(controller)).toBe(2);
    expect(second).toEqual(first);
  });

  it("clears cache when SyncService emits sync:end", async () => {
    const controller = new StatsController();
    controller.setup();
    // setup() defers the sendEvent wrap until after SyncService registration.
    await Promise.resolve();

    readStats(controller);
    expect(queryCount(controller)).toBe(1);

    const syncService = container.resolve(DI_TOKENS.SYNC_SERVICE);
    syncService.sendEvent(IPC_CHANNELS.SYNC.END);

    expect(sendEventCalls).toContain(IPC_CHANNELS.SYNC.END);

    readStats(controller);
    expect(queryCount(controller)).toBe(2);
  });

  it("recomputes after TTL expires", () => {
    vi.useFakeTimers();
    try {
      const controller = new StatsController();
      controller.setup();

      readStats(controller);
      expect(queryCount(controller)).toBe(1);

      vi.advanceTimersByTime(TOP_TAGS_CACHE_TTL_MS - 1);
      readStats(controller);
      expect(queryCount(controller)).toBe(1);

      vi.advanceTimersByTime(1);
      readStats(controller);
      expect(queryCount(controller)).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
