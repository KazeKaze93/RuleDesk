import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import {
  artists,
  playlistEntries,
  playlists,
  posts,
  settings,
  SETTINGS_ID,
} from "../../../src/main/db/schema";
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
  safeStorage: {
    isEncryptionAvailable: () => true,
    decryptString: (buffer: Buffer) => buffer.toString(),
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
    errorHandler: { startCatching: vi.fn() },
  },
}));

vi.mock("../../../src/main/providers", () => ({
  getProvider: vi.fn(() => ({
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: vi.fn().mockResolvedValue({ posts: [], hasMore: false }),
    searchTags: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("../../../src/main/db/queries/blacklist", () => ({
  getAllBlacklistedTags: () => [],
}));

import { PlaylistController } from "../../../src/main/ipc/controllers/PlaylistController";

type PlaylistControllerInternals = {
  setup: () => void;
  resolvePlaylistPosts: (
    event: IpcMainInvokeEvent,
    params: {
      playlistId: number;
      page: number;
      limit: number;
      sortOrder?: "asc" | "desc" | "position";
      isRandom?: boolean;
    }
  ) => Promise<{
    posts: Array<{ postId: number }>;
    total: {
      count: number;
      aiCount: number;
      kind: "exact" | "lowerBound";
    } | null;
  }>;
};

/**
 * Three posts where addedAt order is the reverse of publishedAt:
 *   post 10 — published newest, added oldest
 *   post 20 — published middle, added middle
 *   post 30 — published oldest, added newest
 * Manual playlist date sort must follow addedAt, not publishedAt.
 */
describe("PlaylistController resolvePlaylistPosts static addedAt sort", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PlaylistControllerInternals;
  let playlistId: number;

  beforeEach(async () => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;

    await mockDb.db.insert(settings).values({
      id: SETTINGS_ID,
      userId: "12345",
      encryptedApiKey: Buffer.from("test-api-key-12345").toString("base64"),
      provider: "rule34",
      isAdultVerified: true,
    });

    mockDb.db
      .insert(artists)
      .values({
        name: "Static Sort Artist",
        tag: "static_sort_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = mockDb.db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }

    const seedRows: Array<{
      postId: number;
      publishedAt: Date;
      addedAt: Date;
    }> = [
      {
        postId: 10,
        publishedAt: new Date("2024-03-01T00:00:00.000Z"),
        addedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        postId: 20,
        publishedAt: new Date("2024-02-01T00:00:00.000Z"),
        addedAt: new Date("2024-01-02T00:00:00.000Z"),
      },
      {
        postId: 30,
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        addedAt: new Date("2024-01-03T00:00:00.000Z"),
      },
    ];

    for (const row of seedRows) {
      mockDb.db
        .insert(posts)
        .values({
          postId: row.postId,
          artistId: artist.id,
          provider: "rule34",
          fileUrl: `https://local.example.com/${row.postId}.jpg`,
          previewUrl: `https://local.example.com/${row.postId}_preview.jpg`,
          sampleUrl: "",
          tags: "static_sort",
          rating: "s",
          mediaType: "image",
          publishedAt: row.publishedAt,
        })
        .run();
    }

    const insertedPosts = mockDb.db
      .select({ id: posts.id, postId: posts.postId })
      .from(posts)
      .all();
    const idByPostId = new Map(insertedPosts.map((p) => [p.postId, p.id]));

    mockDb.db
      .insert(playlists)
      .values({
        name: "Manual static sort",
        isSmart: false,
        queryJson: "",
        querySchemaVersion: 1,
        iconName: "",
      })
      .run();
    const playlist = mockDb.db.select({ id: playlists.id }).from(playlists).all()[0];
    if (playlist === undefined) {
      throw new Error("Failed to insert playlist");
    }
    playlistId = playlist.id;

    for (const row of seedRows) {
      const dbPostId = idByPostId.get(row.postId);
      if (dbPostId === undefined) {
        throw new Error(`Missing db id for postId ${row.postId}`);
      }
      mockDb.db
        .insert(playlistEntries)
        .values({
          playlistId,
          postId: dbPostId,
          addedAt: row.addedAt,
          position: row.postId,
        })
        .run();
    }

    controller = new PlaylistController() as unknown as PlaylistControllerInternals;
    controller.setup();
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
    activeDb = null;
  });

  it("sorts manual playlist by addedAt desc/asc, not publishedAt", async () => {
    const desc = await controller.resolvePlaylistPosts({} as IpcMainInvokeEvent, {
      playlistId,
      page: 1,
      limit: 10,
      sortOrder: "desc",
    });
    expect(desc.posts.map((p) => p.postId)).toEqual([30, 20, 10]);
    expect(desc.total).toBeNull();

    const asc = await controller.resolvePlaylistPosts({} as IpcMainInvokeEvent, {
      playlistId,
      page: 1,
      limit: 10,
      sortOrder: "asc",
    });
    expect(asc.posts.map((p) => p.postId)).toEqual([10, 20, 30]);
    expect(asc.total).toBeNull();
  });
});
