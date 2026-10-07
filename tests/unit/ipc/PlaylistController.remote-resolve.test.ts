import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { playlists, settings, SETTINGS_ID } from "@/main/db/schema";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";
import { ProviderSearchError } from "@/main/providers/provider-search-errors";
import type { BooruPost, FetchPostsResult } from "@/main/providers/types";

let activeSqlite: Database.Database | null = null;
const fetchPostsMock = vi.fn();

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

vi.mock("@/main/providers", () => ({
  getProvider: vi.fn(() => ({
    formatTag: (tag: string) => tag.trim().toLowerCase(),
    fetchPosts: fetchPostsMock,
    searchTags: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("@/main/db/queries/blacklist", () => ({
  getAllBlacklistedTags: () => ["blocked_tag"],
}));

import { PlaylistController } from "@/main/ipc/controllers/PlaylistController";

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
  ) => Promise<Array<{ postId: number; tags: string }>>;
};

function makePost(id: number, tags: string[] = ["solo"]): BooruPost {
  return {
    id,
    fileUrl: `https://cdn.example.com/${id}.jpg`,
    previewUrl: `https://cdn.example.com/${id}-p.jpg`,
    sampleUrl: `https://cdn.example.com/${id}-s.jpg`,
    tags,
    rating: "s",
    score: 0,
    source: "",
    width: 100,
    height: 100,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  };
}

function asResult(posts: BooruPost[]): FetchPostsResult {
  return { posts, rawItemCount: posts.length, rejectedPostIds: [] };
}

describe("PlaylistController smart remote resolve", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PlaylistControllerInternals;
  let playlistId: number;

  beforeEach(async () => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
    fetchPostsMock.mockReset();

    await mockDb.db.insert(settings).values({
      id: SETTINGS_ID,
      userId: "12345",
      encryptedApiKey: Buffer.from("test-api-key-12345").toString("base64"),
      provider: "rule34",
      isAdultVerified: true,
    });

    mockDb.db
      .insert(playlists)
      .values({
        name: "Remote smart",
        isSmart: true,
        queryJson: JSON.stringify({
          tags: [{ tag: "solo", type: "include" }],
          provider: "rule34",
        }),
        querySchemaVersion: 1,
        iconName: "",
      })
      .run();
    const row = mockDb.db.select({ id: playlists.id }).from(playlists).all()[0];
    if (!row) {
      throw new Error("playlist insert failed");
    }
    playlistId = row.id;

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

  it("surfaces provider failure instead of returning []", async () => {
    fetchPostsMock.mockRejectedValueOnce(
      new ProviderSearchError("network", "upstream down")
    );

    await expect(
      controller.resolvePlaylistPosts({} as IpcMainInvokeEvent, {
        playlistId,
        page: 1,
        limit: 10,
      })
    ).rejects.toMatchObject({
      name: "ProviderSearchError",
      kind: "network",
    });
  });

  it("fetches additional pages until limit is filled after filtering", async () => {
    // Page 0: 3 posts, 2 blocked by blacklist → 1 kept
    // Page 1: 3 clean posts → fill remaining for limit=3
    fetchPostsMock
      .mockResolvedValueOnce(
        asResult([
          makePost(1, ["solo", "blocked_tag"]),
          makePost(2, ["solo", "blocked_tag"]),
          makePost(3, ["solo"]),
        ])
      )
      .mockResolvedValueOnce(
        asResult([makePost(4, ["solo"]), makePost(5, ["solo"]), makePost(6, ["solo"])])
      );

    const resolved = await controller.resolvePlaylistPosts(
      {} as IpcMainInvokeEvent,
      {
        playlistId,
        page: 1,
        limit: 3,
      }
    );

    expect(fetchPostsMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(resolved).toHaveLength(3);
    expect(resolved.map((p) => p.postId)).toEqual([3, 4, 5]);
  });
});
