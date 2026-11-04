import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, playlists, posts, settings, SETTINGS_ID } from "../../../src/main/db/schema";
import type Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";
import {
  registerDatabaseInContainerAfterReinit,
  resetDatabaseReopenedListenersForTests,
} from "../../../src/main/core/di/databaseRegistration";
import { createAbortError } from "../../../src/main/providers/provider-throttle";
import type { BooruPost, FetchPostsResult } from "../../../src/main/providers/types";
import { HYBRID_SNAPSHOT_IDLE_TTL_MS } from "../../../src/shared/constants";
import { ErrorCode } from "../../../src/shared/types/error-codes";

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

const SNAPSHOT_TAG = "hybrid_snapshot_tag";
const PAGE_LIMIT = 100;
const API_DELAY_MS = 100;
const RANDOM_SEED = 7;

/** Local-only rows newer than the whole remote feed. */
const LOCAL_ONLY_IDS = Array.from({ length: 10 }, (_, index) => 20_000 - index);
/** Local rows that also exist in the remote feed (local row must win). */
const TWIN_IDS = Array.from({ length: 10 }, (_, index) => 9_990 - index);
/** Remote feed, id-desc: two full API pages and one short page (500). */
const REMOTE_IDS = Array.from({ length: 2_500 }, (_, index) => 10_000 - index);
/** Desc order of the full hybrid window: the page sequence every snapshot path must reproduce. */
const EXPECTED_DESC_IDS = [...LOCAL_ONLY_IDS, ...REMOTE_IDS];

type ResolvedPost = {
  id: number;
  postId: number;
  provider: string;
  isViewed: boolean;
};

type ResolvePlaylistPostsPage = {
  posts: ResolvedPost[];
  total: {
    count: number;
    aiCount: number;
    kind: "exact" | "lowerBound";
  } | null;
};

type PlaylistControllerInternals = {
  setup: () => void;
  resolvePlaylistPosts: (
    event: IpcMainInvokeEvent,
    params: {
      playlistId: number;
      page: number;
      limit: number;
      filters?: { mediaType?: "all" | "images" | "videos" };
      sortOrder?: "asc" | "desc" | "position";
      isRandom?: boolean;
      seed?: number;
    }
  ) => Promise<ResolvePlaylistPostsPage>;
  getPlaylistResolveTotal: (
    event: IpcMainInvokeEvent,
    params: {
      playlistId: number;
      filters?: { mediaType?: "all" | "images" | "videos" };
      sortOrder?: "asc" | "desc" | "position";
    }
  ) => Promise<{ count: number; aiCount: number; kind: "exact" | "lowerBound" }>;
  releasePlaylistSnapshot: (
    event: IpcMainInvokeEvent,
    params: { playlistId: number }
  ) => Promise<void>;
};

function identityKey(post: { provider: string; postId: number }): string {
  return `${post.provider}:${post.postId}`;
}

function expectedKeys(ids: number[]): string[] {
  return ids.map((postId) => `rule34:${postId}`);
}

function makeRemotePost(id: number): BooruPost {
  return {
    id,
    fileUrl: `https://cdn.example.com/${id}.jpg`,
    previewUrl: `https://cdn.example.com/${id}-p.jpg`,
    sampleUrl: `https://cdn.example.com/${id}-s.jpg`,
    tags: [SNAPSHOT_TAG],
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

function delay(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(createAbortError());
      },
      { once: true }
    );
  });
}

describe("PlaylistController hybrid snapshot store integration", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: PlaylistControllerInternals;
  let playlistId: number;
  const event = {} as IpcMainInvokeEvent;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    resetDatabaseReopenedListenersForTests();
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    activeDb = mockDb.db;
    fetchPostsMock.mockReset();
    fetchPostsMock.mockImplementation(
      async (
        _tags: string,
        apiPage: number,
        _settings: unknown,
        _isRandom: boolean,
        limit: number,
        signal?: AbortSignal
      ) => {
        await delay(API_DELAY_MS, signal);
        const start = apiPage * limit;
        return asResult(
          REMOTE_IDS.slice(start, start + limit).map((id) => makeRemotePost(id))
        );
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
        name: "Hybrid Snapshot Artist",
        tag: "hybrid_snapshot_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = mockDb.db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }

    for (const postId of [...LOCAL_ONLY_IDS, ...TWIN_IDS]) {
      mockDb.db
        .insert(posts)
        .values({
          postId,
          artistId: artist.id,
          provider: "rule34",
          fileUrl: `https://local.example.com/${postId}.jpg`,
          previewUrl: "",
          sampleUrl: "",
          tags: `${SNAPSHOT_TAG} local`,
          rating: "s",
          mediaType: "image",
          publishedAt: new Date("2024-01-10T00:00:00.000Z"),
          isViewed: TWIN_IDS.includes(postId),
        })
        .run();
    }

    mockDb.db
      .insert(playlists)
      .values({
        name: "Hybrid snapshot",
        isSmart: true,
        queryJson: JSON.stringify({
          tags: [{ tag: SNAPSHOT_TAG, type: "include" }],
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

  afterEach(async () => {
    await controller.releasePlaylistSnapshot(event, { playlistId });
    vi.useRealTimers();
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

  function resolvePage(
    page: number,
    extras?: {
      limit?: number;
      sortOrder?: "asc" | "desc";
      isRandom?: boolean;
      filters?: { mediaType?: "all" | "images" | "videos" };
    }
  ): Promise<ResolvePlaylistPostsPage> {
    return controller.resolvePlaylistPosts(event, {
      playlistId,
      page,
      limit: extras?.limit ?? PAGE_LIMIT,
      sortOrder: extras?.sortOrder ?? "desc",
      isRandom: extras?.isRandom ?? false,
      seed: extras?.isRandom ? RANDOM_SEED : undefined,
      filters: extras?.filters,
    });
  }

  /** Starts page 1 and lets the walk issue its first API request. */
  async function startPageOne(
    extras?: Parameters<typeof resolvePage>[1]
  ): Promise<{ pending: Promise<ResolvePlaylistPostsPage> }> {
    const pending = resolvePage(1, extras);
    await vi.advanceTimersByTimeAsync(0);
    return { pending };
  }

  function trackSettled(promise: Promise<unknown>): { readonly done: boolean } {
    const state = { done: false };
    promise.then(
      () => {
        state.done = true;
      },
      () => {
        state.done = true;
      }
    );
    return {
      get done() {
        return state.done;
      },
    };
  }

  it("serves ordered desc page 1 after the first API response while the walk keeps running", async () => {
    const { pending } = await startPageOne();
    const settled = trackSettled(pending);
    expect(fetchPostsMock).toHaveBeenCalledTimes(1);
    expect(settled.done).toBe(false);

    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    const page1 = await pending;

    expect(page1.posts.map(identityKey)).toEqual(
      expectedKeys(EXPECTED_DESC_IDS.slice(0, PAGE_LIMIT))
    );
    // Walk still running → no total yet; the next API page is already requested.
    expect(page1.total).toBeNull();
    expect(fetchPostsMock).toHaveBeenCalledTimes(2);
  });

  it("holds a later page until the next API page covers it, then serves it with the walk still running", async () => {
    const limit = 600;
    const { pending: first } = await startPageOne({ limit });
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    const page1 = await first;
    expect(page1.posts.map(identityKey)).toEqual(
      expectedKeys(EXPECTED_DESC_IDS.slice(0, limit))
    );

    // Page 2 needs 1200 merged items >= the lowest fetched id; the first API page only
    // yields ~1010 (1000 remote + 10 local-only), so it must wait for the second one.
    const second = resolvePage(2, { limit });
    const settled = trackSettled(second);
    await vi.advanceTimersByTimeAsync(0);
    expect(settled.done).toBe(false);

    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    const page2 = await second;
    expect(page2.posts.map(identityKey)).toEqual(
      expectedKeys(EXPECTED_DESC_IDS.slice(limit, 2 * limit))
    );
    expect(page2.total).toBeNull();
    expect(fetchPostsMock).toHaveBeenCalledTimes(3);
  });

  it("serves later pages from the snapshot without calling fetchPosts again, matching the full-window order", async () => {
    const { pending } = await startPageOne();
    await vi.advanceTimersByTimeAsync(API_DELAY_MS * 3);
    const page1 = await pending;
    const walkCalls = fetchPostsMock.mock.calls.length;

    const seen = page1.posts.map(identityKey);
    const twinRows: ResolvedPost[] = [...page1.posts];
    let page = 2;
    for (;;) {
      const result = await resolvePage(page);
      if (result.posts.length === 0) {
        break;
      }
      seen.push(...result.posts.map(identityKey));
      twinRows.push(...result.posts);
      expect(result.total).toEqual({ count: EXPECTED_DESC_IDS.length, aiCount: 0, kind: "exact" });
      if (result.posts.length < PAGE_LIMIT) {
        break;
      }
      page += 1;
    }

    expect(walkCalls).toBe(3);
    expect(fetchPostsMock).toHaveBeenCalledTimes(walkCalls);
    expect(seen).toEqual(expectedKeys(EXPECTED_DESC_IDS));
    expect(new Set(seen).size).toBe(EXPECTED_DESC_IDS.length);
    // Local row wins over its remote twin.
    for (const postId of TWIN_IDS) {
      expect(twinRows.find((row) => row.postId === postId)?.isViewed).toBe(true);
    }
  });

  it("getPlaylistResolveTotal awaits the same walk and does not start a second one", async () => {
    const { pending } = await startPageOne();
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    const page1 = await pending;
    expect(page1.total).toBeNull();
    expect(fetchPostsMock).toHaveBeenCalledTimes(2);

    const totalPromise = controller.getPlaylistResolveTotal(event, {
      playlistId,
      sortOrder: "desc",
    });
    await vi.advanceTimersByTimeAsync(API_DELAY_MS * 2);
    const total = await totalPromise;

    expect(total).toEqual({ count: EXPECTED_DESC_IDS.length, aiCount: 0, kind: "exact" });
    // Exactly the walk's three API pages — the total did not re-walk.
    expect(fetchPostsMock).toHaveBeenCalledTimes(3);
  });

  it("getPlaylistResolveTotal rejects with the walk error instead of returning null", async () => {
    const failure = new Error("upstream down");
    fetchPostsMock.mockReset();
    fetchPostsMock.mockRejectedValue(failure);

    const pending = resolvePage(1);
    const pageAssertion = expect(pending).rejects.toBe(failure);
    await vi.advanceTimersByTimeAsync(0);
    await pageAssertion;

    await expect(
      controller.getPlaylistResolveTotal(event, { playlistId, sortOrder: "desc" })
    ).rejects.toBe(failure);
  });

  it("getPlaylistResolveTotal without a snapshot rejects with SNAPSHOT_SUPERSEDED", async () => {
    await expect(
      controller.getPlaylistResolveTotal(event, { playlistId, sortOrder: "desc" })
    ).rejects.toMatchObject({ code: ErrorCode.SNAPSHOT_SUPERSEDED });
    expect(fetchPostsMock).not.toHaveBeenCalled();
  });

  it("a new page 1 for the same playlist aborts the previous walk", async () => {
    const { pending: first } = await startPageOne();
    const firstAssertion = expect(first).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
    const firstSignal: unknown = fetchPostsMock.mock.calls[0]?.[5];
    expect(firstSignal).toBeInstanceOf(AbortSignal);

    const { pending: second } = await startPageOne();
    expect(firstSignal instanceof AbortSignal && firstSignal.aborted).toBe(true);
    await firstAssertion;

    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    const page1 = await second;
    expect(page1.posts.map(identityKey)).toEqual(
      expectedKeys(EXPECTED_DESC_IDS.slice(0, PAGE_LIMIT))
    );
  });

  it("releasePlaylistSnapshot aborts the walk and later pages get SNAPSHOT_SUPERSEDED", async () => {
    const { pending } = await startPageOne();
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    await pending;
    const walkSignal: unknown = fetchPostsMock.mock.calls[1]?.[5];
    expect(walkSignal).toBeInstanceOf(AbortSignal);

    await controller.releasePlaylistSnapshot(event, { playlistId });

    expect(walkSignal instanceof AbortSignal && walkSignal.aborted).toBe(true);
    await expect(resolvePage(2)).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
    expect(fetchPostsMock).toHaveBeenCalledTimes(2);
  });

  it("an idle snapshot expires after the TTL", async () => {
    const { pending } = await startPageOne();
    await vi.advanceTimersByTimeAsync(API_DELAY_MS * 3);
    await pending;

    await vi.advanceTimersByTimeAsync(HYBRID_SNAPSHOT_IDLE_TTL_MS);

    await expect(resolvePage(2)).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
  });

  it("a database reopen drops every snapshot", async () => {
    const { pending } = await startPageOne();
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    await pending;
    const walkSignal: unknown = fetchPostsMock.mock.calls[1]?.[5];

    registerDatabaseInContainerAfterReinit();

    expect(walkSignal instanceof AbortSignal && walkSignal.aborted).toBe(true);
    await expect(resolvePage(2)).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
  });

  it("page 2 without page 1 (or under a different filter key) is SNAPSHOT_SUPERSEDED", async () => {
    await expect(resolvePage(2)).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
    expect(fetchPostsMock).not.toHaveBeenCalled();

    const { pending } = await startPageOne({ filters: { mediaType: "images" } });
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    await pending;

    await expect(resolvePage(2)).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
    await expect(
      resolvePage(2, { filters: { mediaType: "images" } })
    ).resolves.toBeDefined();
  });

  it("ordered asc waits for the full walk before returning page 1", async () => {
    const { pending } = await startPageOne({ sortOrder: "asc" });
    const settled = trackSettled(pending);

    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    expect(settled.done).toBe(false);
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    expect(settled.done).toBe(false);
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    const page1 = await pending;

    expect(page1.posts.map(identityKey)).toEqual(
      expectedKeys([...EXPECTED_DESC_IDS].reverse().slice(0, PAGE_LIMIT))
    );
    expect(page1.total).toEqual({ count: EXPECTED_DESC_IDS.length, aiCount: 0, kind: "exact" });
    expect(fetchPostsMock).toHaveBeenCalledTimes(3);
  });

  it("seeded random waits for the full walk and pages do not re-walk", async () => {
    const { pending } = await startPageOne({ isRandom: true });
    const settled = trackSettled(pending);

    await vi.advanceTimersByTimeAsync(API_DELAY_MS * 2);
    expect(settled.done).toBe(false);
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    const page1 = await pending;
    const page2 = await resolvePage(2, { isRandom: true });

    const keys1 = page1.posts.map(identityKey);
    const keys2 = page2.posts.map(identityKey);
    expect(keys1).toHaveLength(PAGE_LIMIT);
    expect(keys2.filter((key) => keys1.includes(key))).toEqual([]);
    expect(page1.total).toEqual({ count: EXPECTED_DESC_IDS.length, aiCount: 0, kind: "exact" });
    expect(fetchPostsMock).toHaveBeenCalledTimes(3);
  });
});
