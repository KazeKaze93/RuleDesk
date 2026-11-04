import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, playlists, posts, settings, SETTINGS_ID } from "../../../src/main/db/schema";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";
import type { BooruPost, FetchPostsResult } from "../../../src/main/providers/types";

let activeSqlite: Database.Database | null = null;
let activeDb: ReturnType<typeof createMockDb>["db"] | null = null;
const fetchPostsMock = vi.fn();

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
    fetchPosts: fetchPostsMock,
    searchTags: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("../../../src/main/db/queries/blacklist", () => ({
  getAllBlacklistedTags: () => [],
}));

import { PlaylistController } from "../../../src/main/ipc/controllers/PlaylistController";

const SMART_TAG = "smart_postid_sort_tag";

type ResolvedPost = {
  postId: number;
  provider: string;
  publishedAt: number;
};

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
    posts: ResolvedPost[];
    total: { count: number; kind: "exact" | "lowerBound" } | null;
  }>;
};

function makeRemotePost(id: number, createdAt: Date): BooruPost {
  return {
    id,
    fileUrl: `https://cdn.example.com/${id}.jpg`,
    previewUrl: `https://cdn.example.com/${id}-p.jpg`,
    sampleUrl: `https://cdn.example.com/${id}-s.jpg`,
    tags: [SMART_TAG],
    rating: "s",
    score: 0,
    source: "",
    width: 100,
    height: 100,
    createdAt,
  };
}

function asResult(remotePosts: BooruPost[]): FetchPostsResult {
  return {
    posts: remotePosts,
    rawItemCount: remotePosts.length,
    rejectedPostIds: [],
  };
}

/**
 * Local + remote rule34 rows where publishedAt order opposes postId.
 * A gelbooru local twin must stay out of the provider-scoped merge.
 *
 * publishedAt desc (wrong) would be: 10, 25, 20, 40, 30
 * postId desc (correct):               40, 30, 25, 20, 10
 */
const EXPECTED_POST_ID_DESC = [40, 30, 25, 20, 10];
const EXPECTED_POST_ID_ASC = [10, 20, 25, 30, 40];

describe("PlaylistController smart playlist provider-scoped postId sort", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PlaylistControllerInternals;
  let playlistId: number;

  beforeEach(async () => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    fetchPostsMock.mockReset();

    const remoteFeed: BooruPost[] = [
      // Higher postId, older publishedAt than local 10/20 — opposes postId order.
      makeRemotePost(40, new Date("2024-01-15T00:00:00.000Z")),
      makeRemotePost(25, new Date("2024-02-15T00:00:00.000Z")),
    ];

    fetchPostsMock.mockImplementation(
      async (
        _tags: string,
        apiPage: number,
        _settings: unknown,
        _isRandom: boolean,
        limit: number
      ) => {
        const start = apiPage * limit;
        return asResult(remoteFeed.slice(start, start + limit));
      }
    );

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
        name: "Smart PostId Sort Artist",
        tag: "smart_postid_sort_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = mockDb.db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }

    const localRows: Array<{
      postId: number;
      provider: "rule34" | "gelbooru";
      publishedAt: Date;
    }> = [
      {
        postId: 10,
        provider: "rule34",
        publishedAt: new Date("2024-03-01T00:00:00.000Z"),
      },
      {
        postId: 20,
        provider: "rule34",
        publishedAt: new Date("2024-02-01T00:00:00.000Z"),
      },
      {
        postId: 30,
        provider: "rule34",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      // Same tags, wrong provider — must not appear in rule34-scoped smart resolve.
      {
        postId: 99,
        provider: "gelbooru",
        publishedAt: new Date("2024-04-01T00:00:00.000Z"),
      },
    ];

    for (const row of localRows) {
      mockDb.db
        .insert(posts)
        .values({
          postId: row.postId,
          artistId: artist.id,
          provider: row.provider,
          fileUrl: `https://local.example.com/${row.provider}/${row.postId}.jpg`,
          previewUrl: `https://local.example.com/${row.provider}/${row.postId}_preview.jpg`,
          sampleUrl: "",
          tags: `${SMART_TAG} local`,
          rating: "s",
          mediaType: "image",
          publishedAt: row.publishedAt,
        })
        .run();
    }

    mockDb.db
      .insert(playlists)
      .values({
        name: "Smart postId sort",
        isSmart: true,
        queryJson: JSON.stringify({
          tags: [{ tag: SMART_TAG, type: "include" }],
          provider: "rule34",
        }),
        querySchemaVersion: 1,
        iconName: "",
      })
      .run();
    const playlist = mockDb.db.select({ id: playlists.id }).from(playlists).all()[0];
    if (playlist === undefined) {
      throw new Error("Failed to insert playlist");
    }
    playlistId = playlist.id;

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

  it("orders hybrid smart posts by postId and scopes local rows to query.provider", async () => {
    const descResult = await controller.resolvePlaylistPosts(
      {} as IpcMainInvokeEvent,
      {
        playlistId,
        page: 1,
        limit: 20,
        sortOrder: "desc",
      }
    );
    const desc = descResult.posts;
    expect(desc.map((p) => p.postId)).toEqual(EXPECTED_POST_ID_DESC);
    expect(desc.every((p) => p.provider === "rule34")).toBe(true);
    expect(desc.some((p) => p.postId === 99)).toBe(false);

    // Prove publishedAt order would have been different (regression guard).
    const publishedAtDesc = [...desc].sort((a, b) => b.publishedAt - a.publishedAt);
    expect(publishedAtDesc.map((p) => p.postId)).not.toEqual(EXPECTED_POST_ID_DESC);

    const ascResult = await controller.resolvePlaylistPosts(
      {} as IpcMainInvokeEvent,
      {
        playlistId,
        page: 1,
        limit: 20,
        sortOrder: "asc",
      }
    );
    const asc = ascResult.posts;
    expect(asc.map((p) => p.postId)).toEqual(EXPECTED_POST_ID_ASC);
    expect(asc.every((p) => p.provider === "rule34")).toBe(true);
    expect(asc.some((p) => p.postId === 99)).toBe(false);
  });
});
