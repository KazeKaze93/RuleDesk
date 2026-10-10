import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { container, DI_TOKENS } from "@/main/core/di/Container";
import { artists, playlists, posts, settings, SETTINGS_ID } from "@/main/db/schema";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";
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
  getAllBlacklistedTags: () => [],
}));

import { PlaylistController } from "@/main/ipc/controllers/PlaylistController";

const HYBRID_TAG = "hybrid_merge_tag";
const PAGE_LIMIT = 3;
/** Stable seed for random hybrid pagination checks. */
const RANDOM_SEED = 42;

type ResolvedPost = {
  postId: number;
  isViewed: boolean;
  provider: string;
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
      seed?: number;
    }
  ) => Promise<ResolvedPost[]>;
};

function makeRemotePost(
  id: number,
  createdAt: Date,
  tags: string[] = [HYBRID_TAG]
): BooruPost {
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
 * Canonical remote feed (API order). Includes postId 104 which also exists locally
 * so the merge must prefer the local row and still keep remote-only ids.
 */
const REMOTE_FEED: BooruPost[] = [
  makeRemotePost(201, new Date("2024-01-09T00:00:00.000Z")),
  makeRemotePost(104, new Date("2024-01-04T00:00:00.000Z")),
  makeRemotePost(202, new Date("2024-01-07T00:00:00.000Z")),
  makeRemotePost(203, new Date("2024-01-05T00:00:00.000Z")),
  makeRemotePost(204, new Date("2024-01-03T00:00:00.000Z")),
  makeRemotePost(205, new Date("2024-01-02T00:00:00.000Z")),
];

/** Expected desc(publishedAt) merge of local {101..104} + remote-only {201..205}. */
const EXPECTED_DESC_ORDER = [101, 201, 102, 202, 103, 203, 104, 204, 205];

describe("PlaylistController hybrid smart-playlist merge", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PlaylistControllerInternals;
  let playlistId: number;

  beforeEach(async () => {
    container.clear();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    container.register(DI_TOKENS.DB, mockDb.db);
    fetchPostsMock.mockReset();

    fetchPostsMock.mockImplementation(
      async (
        _tags: string,
        apiPage: number,
        _settings: unknown,
        _isRandom: boolean,
        limit: number
      ) => {
        const start = apiPage * limit;
        return asResult(REMOTE_FEED.slice(start, start + limit));
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
        name: "Hybrid Merge Artist",
        tag: "hybrid_merge_artist",
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
      publishedAt: Date;
      isViewed: boolean;
    }> = [
      { postId: 101, publishedAt: new Date("2024-01-10T00:00:00.000Z"), isViewed: false },
      { postId: 102, publishedAt: new Date("2024-01-08T00:00:00.000Z"), isViewed: false },
      { postId: 103, publishedAt: new Date("2024-01-06T00:00:00.000Z"), isViewed: false },
      // Overlaps remote 104 — local isViewed must win after dedupe.
      { postId: 104, publishedAt: new Date("2024-01-04T00:00:00.000Z"), isViewed: true },
    ];

    for (const row of localRows) {
      mockDb.db
        .insert(posts)
        .values({
          postId: row.postId,
          artistId: artist.id,
          provider: "rule34",
          fileUrl: `https://local.example.com/${row.postId}.jpg`,
          previewUrl: `https://local.example.com/${row.postId}_preview.jpg`,
          sampleUrl: "",
          tags: `${HYBRID_TAG} local`,
          rating: "s",
          mediaType: "image",
          publishedAt: row.publishedAt,
          isViewed: row.isViewed,
        })
        .run();
    }

    mockDb.db
      .insert(playlists)
      .values({
        name: "Hybrid smart",
        isSmart: true,
        queryJson: JSON.stringify({
          tags: [{ tag: HYBRID_TAG, type: "include" }],
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
    container.clear();
  });

  async function resolvePage(page: number, extras?: { isRandom?: boolean; seed?: number }) {
    return controller.resolvePlaylistPosts({} as IpcMainInvokeEvent, {
      playlistId,
      page,
      limit: PAGE_LIMIT,
      sortOrder: "desc",
      isRandom: extras?.isRandom ?? false,
      seed: extras?.seed,
    });
  }

  it("sequential page walk yields each hybrid item exactly once", async () => {
    const seen: number[] = [];
    let page = 1;
    for (;;) {
      const rows = await resolvePage(page);
      if (rows.length === 0) {
        break;
      }
      seen.push(...rows.map((row) => row.postId));
      if (rows.length < PAGE_LIMIT) {
        break;
      }
      page += 1;
    }

    expect(seen).toEqual(EXPECTED_DESC_ORDER);
    expect(new Set(seen).size).toBe(EXPECTED_DESC_ORDER.length);

    // Overlap postId 104 is on page 3; local isViewed must win over the remote twin.
    const pageWithOverlap = await resolvePage(3);
    const localPreferred = pageWithOverlap.find((row) => row.postId === 104);
    expect(localPreferred?.isViewed).toBe(true);
  });

  it("same page request returns the same result", async () => {
    const first = await resolvePage(2);
    const second = await resolvePage(2);
    expect(second.map((row) => row.postId)).toEqual(first.map((row) => row.postId));
    expect(first.map((row) => row.postId)).toEqual([202, 103, 203]);
  });

  it("seeded random hybrid pages are stable and cover each item once", async () => {
    const walk = async (): Promise<number[]> => {
      const seen: number[] = [];
      let page = 1;
      for (;;) {
        const rows = await resolvePage(page, { isRandom: true, seed: RANDOM_SEED });
        if (rows.length === 0) {
          break;
        }
        seen.push(...rows.map((row) => row.postId));
        if (rows.length < PAGE_LIMIT) {
          break;
        }
        page += 1;
      }
      return seen;
    };

    const firstWalk = await walk();
    const secondWalk = await walk();
    expect(secondWalk).toEqual(firstWalk);
    expect(new Set(firstWalk).size).toBe(EXPECTED_DESC_ORDER.length);
    expect([...firstWalk].sort((a, b) => a - b)).toEqual(
      [...EXPECTED_DESC_ORDER].sort((a, b) => a - b)
    );

    const page1a = await resolvePage(1, { isRandom: true, seed: RANDOM_SEED });
    const page1b = await resolvePage(1, { isRandom: true, seed: RANDOM_SEED });
    expect(page1b.map((row) => row.postId)).toEqual(page1a.map((row) => row.postId));
  });
});
