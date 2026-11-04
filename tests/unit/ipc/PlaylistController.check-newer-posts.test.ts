import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import {
  artists,
  playlists,
  posts,
  settings,
  SETTINGS_ID,
} from "../../../src/main/db/schema";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";
import { resetDatabaseReopenedListenersForTests } from "../../../src/main/core/di/databaseRegistration";
import type { BooruPost, FetchPostsResult } from "../../../src/main/providers/types";
import { NEWER_POSTS_PROBE_LIMIT } from "../../../src/shared/constants";

let activeSqlite: Database.Database | null = null;
let activeDb: ReturnType<typeof createMockDb>["db"] | null = null;
const fetchPostsMock = vi.fn();
const getAllBlacklistedTagsMock = vi.hoisted(() =>
  vi.fn((): string[] => [])
);

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
  getAllBlacklistedTags: () => getAllBlacklistedTagsMock(),
}));

import { PlaylistController } from "../../../src/main/ipc/controllers/PlaylistController";

const PROBE_TAG = "newer_posts_probe_tag";
const BLACKLISTED_TAG = "blocked_probe_tag";
const PAGE_LIMIT = 50;
const UPPER_BOUND = 1_000;
const NEWER_ID = 1_001;
const NEWER_ID_B = 1_002;
const SAME_OR_OLDER_ID = 999;

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
      upperBoundPostId?: number;
      filters?: { mediaType?: "all" | "images" | "videos" };
    }
  ) => Promise<{ posts: unknown[]; total: unknown }>;
  checkPlaylistNewerPosts: (
    event: IpcMainInvokeEvent,
    params: {
      playlistId: number;
      sortOrder?: "asc" | "desc" | "position";
      filters?: { mediaType?: "all" | "images" | "videos" };
    }
  ) => Promise<{ hasNewer: boolean } | null>;
  releasePlaylistSnapshot: (
    event: IpcMainInvokeEvent,
    params: { playlistId: number }
  ) => Promise<void>;
};

function makeRemotePost(
  id: number,
  overrides: Partial<Pick<BooruPost, "tags" | "fileUrl">> = {}
): BooruPost {
  return {
    id,
    fileUrl: overrides.fileUrl ?? `https://cdn.example.com/${id}.jpg`,
    previewUrl: `https://cdn.example.com/${id}-p.jpg`,
    sampleUrl: `https://cdn.example.com/${id}-s.jpg`,
    tags: overrides.tags ?? [PROBE_TAG],
    rating: "s",
    score: 0,
    source: "",
    width: 100,
    height: 100,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function asResult(remotePosts: BooruPost[]): FetchPostsResult {
  return {
    posts: remotePosts,
    rawItemCount: remotePosts.length,
    rejectedPostIds: [],
  };
}

describe("PlaylistController checkPlaylistNewerPosts", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PlaylistControllerInternals;
  let playlistId: number;
  const event = {} as IpcMainInvokeEvent;

  beforeEach(async () => {
    resetDatabaseReopenedListenersForTests();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    fetchPostsMock.mockReset();
    getAllBlacklistedTagsMock.mockReset();
    getAllBlacklistedTagsMock.mockReturnValue([]);

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
        name: "Newer Posts Artist",
        tag: "newer_posts_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = mockDb.db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }

    mockDb.db
      .insert(posts)
      .values({
        postId: UPPER_BOUND,
        artistId: artist.id,
        provider: "rule34",
        fileUrl: `https://local.example.com/${UPPER_BOUND}.jpg`,
        previewUrl: "",
        sampleUrl: "",
        tags: `${PROBE_TAG} local`,
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-10T00:00:00.000Z"),
        isViewed: false,
      })
      .run();

    mockDb.db
      .insert(playlists)
      .values({
        name: "Newer posts probe",
        isSmart: true,
        queryJson: JSON.stringify({
          tags: [{ tag: PROBE_TAG, type: "include" }],
          provider: "rule34",
        }),
        querySchemaVersion: 1,
        iconName: "",
      })
      .run();
    const playlist = mockDb.db
      .select({ id: playlists.id })
      .from(playlists)
      .all()[0];
    if (playlist === undefined) {
      throw new Error("Failed to insert playlist");
    }
    playlistId = playlist.id;

    controller = new PlaylistController() as unknown as PlaylistControllerInternals;
    controller.setup();
  });

  afterEach(async () => {
    await controller.releasePlaylistSnapshot(event, { playlistId });
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

  async function startDescSnapshot(
    filters?: { mediaType?: "all" | "images" | "videos" }
  ): Promise<void> {
    fetchPostsMock.mockResolvedValueOnce(
      asResult([makeRemotePost(UPPER_BOUND)])
    );
    await controller.resolvePlaylistPosts(event, {
      playlistId,
      page: 1,
      limit: PAGE_LIMIT,
      sortOrder: "desc",
      isRandom: false,
      upperBoundPostId: UPPER_BOUND,
      filters,
    });
  }

  it("returns hasNewer:true when the unbound probe id is above the snapshot upperBound", async () => {
    await startDescSnapshot();
    const walkCalls = fetchPostsMock.mock.calls.length;

    fetchPostsMock.mockResolvedValueOnce(asResult([makeRemotePost(NEWER_ID)]));
    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "desc",
    });

    expect(result).toEqual({ hasNewer: true });
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls + 1);
    const probeCall = fetchPostsMock.mock.calls[walkCalls];
    expect(probeCall?.[0]).not.toContain("id:<=");
    expect(probeCall?.[1]).toBe(0);
    expect(probeCall?.[4]).toBe(NEWER_POSTS_PROBE_LIMIT);
  });

  it("returns hasNewer:false when the unbound probe id is not above the upperBound", async () => {
    await startDescSnapshot();
    const walkCalls = fetchPostsMock.mock.calls.length;

    fetchPostsMock.mockResolvedValueOnce(
      asResult([makeRemotePost(SAME_OR_OLDER_ID)])
    );
    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "desc",
    });

    expect(result).toEqual({ hasNewer: false });
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls + 1);
  });

  it("falls back to max snapshot remote postId when resolve omits upperBoundPostId", async () => {
    fetchPostsMock.mockResolvedValueOnce(
      asResult([makeRemotePost(UPPER_BOUND)])
    );
    await controller.resolvePlaylistPosts(event, {
      playlistId,
      page: 1,
      limit: PAGE_LIMIT,
      sortOrder: "desc",
      isRandom: false,
    });
    const walkCalls = fetchPostsMock.mock.calls.length;

    fetchPostsMock.mockResolvedValueOnce(asResult([makeRemotePost(NEWER_ID)]));
    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "desc",
    });

    expect(result).toEqual({ hasNewer: true });
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls + 1);
  });

  it("returns hasNewer:false when the only newer probe post is blacklisted", async () => {
    getAllBlacklistedTagsMock.mockReturnValue([BLACKLISTED_TAG]);
    await startDescSnapshot();
    const walkCalls = fetchPostsMock.mock.calls.length;

    fetchPostsMock.mockResolvedValueOnce(
      asResult([
        makeRemotePost(NEWER_ID, { tags: [PROBE_TAG, BLACKLISTED_TAG] }),
      ])
    );
    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "desc",
    });

    expect(result).toEqual({ hasNewer: false });
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls + 1);
  });

  it("returns hasNewer:false when the only newer probe post fails mediaType", async () => {
    await startDescSnapshot({ mediaType: "images" });
    const walkCalls = fetchPostsMock.mock.calls.length;

    fetchPostsMock.mockResolvedValueOnce(
      asResult([
        makeRemotePost(NEWER_ID, {
          fileUrl: `https://cdn.example.com/${NEWER_ID}.mp4`,
        }),
      ])
    );
    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "desc",
      filters: { mediaType: "images" },
    });

    expect(result).toEqual({ hasNewer: false });
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls + 1);
  });

  it("returns hasNewer:true when one of two newer probe posts passes filters", async () => {
    getAllBlacklistedTagsMock.mockReturnValue([BLACKLISTED_TAG]);
    await startDescSnapshot();
    const walkCalls = fetchPostsMock.mock.calls.length;

    fetchPostsMock.mockResolvedValueOnce(
      asResult([
        makeRemotePost(NEWER_ID_B, {
          tags: [PROBE_TAG, BLACKLISTED_TAG],
        }),
        makeRemotePost(NEWER_ID),
      ])
    );
    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "desc",
    });

    expect(result).toEqual({ hasNewer: true });
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls + 1);
  });

  it("returns null when no hybrid snapshot exists", async () => {
    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "desc",
    });
    expect(result).toBeNull();
    expect(fetchPostsMock).not.toHaveBeenCalled();
  });

  it("returns null for asc sort without probing the provider", async () => {
    await startDescSnapshot();
    const walkCalls = fetchPostsMock.mock.calls.length;

    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "asc",
    });

    expect(result).toBeNull();
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls);
  });

  it("returns null for a random snapshot without probing the provider", async () => {
    fetchPostsMock.mockResolvedValue(asResult([makeRemotePost(UPPER_BOUND)]));
    await controller.resolvePlaylistPosts(event, {
      playlistId,
      page: 1,
      limit: PAGE_LIMIT,
      sortOrder: "desc",
      isRandom: true,
      seed: 42,
    });
    const walkCalls = fetchPostsMock.mock.calls.length;

    const result = await controller.checkPlaylistNewerPosts(event, {
      playlistId,
      sortOrder: "desc",
    });

    expect(result).toBeNull();
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls);
  });
});
