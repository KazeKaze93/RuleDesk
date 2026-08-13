import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { artists, playlists, posts } from "@/main/db/schema";
import {
  dropFtsTriggersForBulkInsert,
  ensureFtsTriggers,
  rebuildFtsIndex,
} from "@/main/db/fts-triggers";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";
import type { SQL } from "drizzle-orm";

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
}));

import { PlaylistController } from "@/main/ipc/controllers/PlaylistController";

type TagConditions = {
  includeConditions: SQL[];
  excludeConditions: SQL[];
};

type PlaylistControllerInternals = {
  setup: () => void;
  buildSmartPlaylistTagConditions: (query: {
    tags: Array<{ tag: string; type: "include" | "exclude" }>;
    provider?: "rule34" | "gelbooru";
  }) => TagConditions;
  resolvePlaylistPosts: (
    event: IpcMainInvokeEvent,
    params: {
      playlistId: number;
      page: number;
      limit: number;
      sortOrder?: "asc" | "desc" | "position";
      isRandom?: boolean;
    }
  ) => Promise<Array<{ postId: number; tags: string }>>;
};

/** Plain `sql\`1 = 0\`` renders without a dialect; MATCH conditions embed columns and do not. */
function isEmptyGuardCondition(condition: SQL): boolean {
  try {
    const rendered = condition.toQuery({
      escapeName: (name) => name,
      escapeParam: (_index, value) => String(value),
      escapeString: (value) => value,
    });
    return rendered.sql.includes("1 = 0");
  } catch {
    return false;
  }
}

describe("PlaylistController FTS empty-guard", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PlaylistControllerInternals;

  beforeEach(() => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
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
    container.clear();
  });

  it("returns 1 = 0 when posts_fts is empty", () => {
    const conditions = controller.buildSmartPlaylistTagConditions({
      tags: [{ tag: "test_tag", type: "include" }],
      provider: "rule34",
    });

    expect(conditions.includeConditions).toHaveLength(1);
    expect(isEmptyGuardCondition(conditions.includeConditions[0])).toBe(true);
  });

  it("builds MATCH and resolve returns three posts for an existing tag", async () => {
    const { db } = mockDb;

    db.insert(artists)
      .values({
        name: "Empty Guard Artist",
        tag: "empty_guard_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }

    for (let i = 1; i <= 3; i += 1) {
      db.insert(posts)
        .values({
          postId: 2000 + i,
          artistId: artist.id,
          fileUrl: `https://example.com/${i}.jpg`,
          previewUrl: `https://example.com/${i}_preview.jpg`,
          sampleUrl: "",
          tags: "test_tag other",
          rating: "s",
          mediaType: "image",
          publishedAt: new Date(`2024-01-0${i}T00:00:00.000Z`),
        })
        .run();
    }

    const conditions = controller.buildSmartPlaylistTagConditions({
      tags: [{ tag: "test_tag", type: "include" }],
      provider: "rule34",
    });
    expect(conditions.includeConditions).toHaveLength(1);
    expect(isEmptyGuardCondition(conditions.includeConditions[0])).toBe(false);

    db.insert(playlists)
      .values({
        name: "Tag playlist",
        isSmart: true,
        queryJson: JSON.stringify({
          tags: [{ tag: "test_tag", type: "include" }],
          provider: "rule34",
        }),
        querySchemaVersion: 1,
        iconName: "",
      })
      .run();
    const playlist = db.select({ id: playlists.id }).from(playlists).all()[0];
    if (playlist === undefined) {
      throw new Error("Failed to insert playlist");
    }

    const event = {} as IpcMainInvokeEvent;
    const resolved = await controller.resolvePlaylistPosts(event, {
      playlistId: playlist.id,
      page: 1,
      limit: 50,
      sortOrder: "desc",
      isRandom: false,
    });

    expect(resolved).toHaveLength(3);
    expect(resolved.map((row) => row.postId).sort((a, b) => a - b)).toEqual([
      2001, 2002, 2003,
    ]);
  });

  it("include/exclude stay correct while insert triggers are dropped (bulk-sync window)", async () => {
    const { db, sqlite } = mockDb;
    dropFtsTriggersForBulkInsert(sqlite);

    db.insert(artists)
      .values({
        name: "Bulk Window Artist",
        tag: "bulk_window_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }

    db.insert(posts)
      .values({
        postId: 777,
        artistId: artist.id,
        fileUrl: "https://example.com/777.jpg",
        previewUrl: "https://example.com/777_p.jpg",
        sampleUrl: "",
        tags: "test_tag other",
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
      })
      .run();

    const matchCount = (
      sqlite
        .prepare(
          "SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'test_tag'"
        )
        .get() as { c: number }
    ).c;
    expect(matchCount).toBe(0);

    db.insert(playlists)
      .values([
        {
          name: "Include test_tag",
          isSmart: true,
          queryJson: JSON.stringify({
            tags: [{ tag: "test_tag", type: "include" }],
            provider: "rule34",
          }),
          querySchemaVersion: 1,
          iconName: "",
        },
        {
          name: "Exclude test_tag",
          isSmart: true,
          queryJson: JSON.stringify({
            tags: [{ tag: "test_tag", type: "exclude" }],
            provider: "rule34",
          }),
          querySchemaVersion: 1,
          iconName: "",
        },
      ])
      .run();
    const playlistRows = db
      .select({ id: playlists.id, name: playlists.name })
      .from(playlists)
      .all();
    const includeId = playlistRows.find((row) => row.name === "Include test_tag")
      ?.id;
    const excludeId = playlistRows.find((row) => row.name === "Exclude test_tag")
      ?.id;
    if (includeId === undefined || excludeId === undefined) {
      throw new Error("Failed to insert playlists");
    }

    const event = {} as IpcMainInvokeEvent;
    const included = await controller.resolvePlaylistPosts(event, {
      playlistId: includeId,
      page: 1,
      limit: 50,
    });
    const excluded = await controller.resolvePlaylistPosts(event, {
      playlistId: excludeId,
      page: 1,
      limit: 50,
    });

    expect(included.map((row) => row.postId)).toEqual([777]);
    expect(excluded).toEqual([]);

    rebuildFtsIndex(sqlite);
    ensureFtsTriggers(sqlite);

    const includedAfterRebuild = await controller.resolvePlaylistPosts(event, {
      playlistId: includeId,
      page: 1,
      limit: 50,
    });
    const excludedAfterRebuild = await controller.resolvePlaylistPosts(event, {
      playlistId: excludeId,
      page: 1,
      limit: 50,
    });

    expect(includedAfterRebuild.map((row) => row.postId)).toEqual([777]);
    expect(excludedAfterRebuild).toEqual([]);
  });
});
