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
  id: number;
  postId: number;
  isViewed: boolean;
  isFavorited: boolean;
  provider: string;
};

/** Smoke identity key — remote rows use id: 0, so gallery uniqueness is provider:postId. */
function identityKey(post: { provider: string; postId: number }): string {
  return `${post.provider}:${post.postId}`;
}

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

  async function resolvePage(
    page: number,
    extras?: { isRandom?: boolean; seed?: number; upperBoundPostId?: number }
  ) {
    return controller.resolvePlaylistPosts({} as IpcMainInvokeEvent, {
      playlistId,
      page,
      limit: PAGE_LIMIT,
      sortOrder: "desc",
      isRandom: extras?.isRandom ?? false,
      seed: extras?.seed,
      upperBoundPostId: extras?.upperBoundPostId,
    });
  }

  it("sequential page walk yields each hybrid item exactly once", async () => {
    const seen: string[] = [];
    let page = 1;
    for (;;) {
      const rows = await resolvePage(page);
      if (rows.length === 0) {
        break;
      }
      seen.push(...rows.map(identityKey));
      if (rows.length < PAGE_LIMIT) {
        break;
      }
      page += 1;
    }

    expect(seen).toEqual(EXPECTED_DESC_ORDER.map((postId) => `rule34:${postId}`));
    expect(new Set(seen).size).toBe(EXPECTED_DESC_ORDER.length);

    // Overlap postId 104 is on page 3; local isViewed must win over the remote twin.
    const pageWithOverlap = await resolvePage(3);
    const localPreferred = pageWithOverlap.find((row) => row.postId === 104);
    expect(localPreferred?.isViewed).toBe(true);
  });

  it("same page request returns the same result", async () => {
    const first = await resolvePage(2);
    const second = await resolvePage(2);
    expect(second.map(identityKey)).toEqual(first.map(identityKey));
    expect(first.map((row) => row.postId)).toEqual([202, 103, 203]);
  });

  it("seeded random hybrid pages are stable and cover each item once", async () => {
    const walk = async (): Promise<string[]> => {
      const seen: string[] = [];
      let page = 1;
      for (;;) {
        const rows = await resolvePage(page, { isRandom: true, seed: RANDOM_SEED });
        if (rows.length === 0) {
          break;
        }
        seen.push(...rows.map(identityKey));
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
    expect(firstWalk).toHaveLength(EXPECTED_DESC_ORDER.length);

    const page1a = await resolvePage(1, { isRandom: true, seed: RANDOM_SEED });
    const page1b = await resolvePage(1, { isRandom: true, seed: RANDOM_SEED });
    expect(page1b.map(identityKey)).toEqual(page1a.map(identityKey));
    expect(new Set(page1a.map(identityKey)).size).toBe(page1a.length);
  });

  it("collapses multi-artist local copies so random pages have unique provider:postId", async () => {
    const artistRows = mockDb.db.select({ id: artists.id }).from(artists).all();
    const firstArtist = artistRows[0];
    if (firstArtist === undefined) {
      throw new Error("expected seed artist");
    }
    mockDb.db
      .insert(artists)
      .values({
        name: "Hybrid Twin Artist",
        tag: "hybrid_twin_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const twinArtist = mockDb.db
      .select({ id: artists.id })
      .from(artists)
      .all()
      .find((row) => row.id !== firstArtist.id);
    if (twinArtist === undefined) {
      throw new Error("Failed to insert twin artist");
    }

    const SHARED_POST_ID = 19003908;
    mockDb.db
      .insert(posts)
      .values({
        postId: SHARED_POST_ID,
        artistId: firstArtist.id,
        provider: "rule34",
        fileUrl: `https://local.example.com/${SHARED_POST_ID}-a.jpg`,
        previewUrl: "",
        sampleUrl: "",
        tags: `${HYBRID_TAG} twin_a`,
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        isViewed: false,
        isFavorited: false,
      })
      .run();
    mockDb.db
      .insert(posts)
      .values({
        postId: SHARED_POST_ID,
        artistId: twinArtist.id,
        provider: "rule34",
        fileUrl: `https://local.example.com/${SHARED_POST_ID}-b.jpg`,
        previewUrl: "",
        sampleUrl: "",
        tags: `${HYBRID_TAG} twin_b`,
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        isViewed: true,
        isFavorited: true,
      })
      .run();

    fetchPostsMock.mockImplementation(
      async (
        _tags: string,
        apiPage: number,
        _settings: unknown,
        _isRandom: boolean,
        limit: number
      ) => {
        const feed = [
          makeRemotePost(SHARED_POST_ID, new Date("2024-01-01T00:00:00.000Z")),
          ...REMOTE_FEED,
        ];
        const start = apiPage * limit;
        return asResult(feed.slice(start, start + limit));
      }
    );

    const page1 = await resolvePage(1, { isRandom: true, seed: RANDOM_SEED });
    const keys = page1.map(identityKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.filter((key) => key === `rule34:${SHARED_POST_ID}`)).toHaveLength(
      keys.includes(`rule34:${SHARED_POST_ID}`) ? 1 : 0
    );

    // Walk every page: shared identity appears at most once across the gallery.
    const walkKeys: string[] = [];
    let page = 1;
    for (;;) {
      const rows = await resolvePage(page, { isRandom: true, seed: RANDOM_SEED });
      if (rows.length === 0) {
        break;
      }
      walkKeys.push(...rows.map(identityKey));
      if (rows.length < PAGE_LIMIT) {
        break;
      }
      page += 1;
    }
    expect(walkKeys.filter((key) => key === `rule34:${SHARED_POST_ID}`)).toHaveLength(1);
    const favored = (await resolvePage(1, { isRandom: true, seed: RANDOM_SEED })).concat(
      await resolvePage(2, { isRandom: true, seed: RANDOM_SEED }),
      await resolvePage(3, { isRandom: true, seed: RANDOM_SEED }),
      await resolvePage(4, { isRandom: true, seed: RANDOM_SEED })
    ).find((row) => row.postId === SHARED_POST_ID);
    expect(favored?.isFavorited).toBe(true);
    expect(favored?.isViewed).toBe(true);
  });

  it("ordered pages do not re-emit a local/remote twin when local rank is past page*limit", async () => {
    // Many local-only posts newer than OVERLAP so a page*limit local window misses it,
    // while the remote feed ranks OVERLAP first — classic false remote-only / page overlap.
    const OVERLAP_ID = 19006677;
    const artist = mockDb.db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("expected seed artist");
    }

    for (let index = 0; index < 8; index += 1) {
      const postId = 300 + index;
      mockDb.db
        .insert(posts)
        .values({
          postId,
          artistId: artist.id,
          provider: "rule34",
          fileUrl: `https://local.example.com/${postId}.jpg`,
          previewUrl: "",
          sampleUrl: "",
          tags: `${HYBRID_TAG} padding`,
          rating: "s",
          mediaType: "image",
          publishedAt: new Date(`2024-02-${String(10 + index).padStart(2, "0")}T00:00:00.000Z`),
        })
        .run();
    }
    mockDb.db
      .insert(posts)
      .values({
        postId: OVERLAP_ID,
        artistId: artist.id,
        provider: "rule34",
        fileUrl: `https://local.example.com/${OVERLAP_ID}.jpg`,
        previewUrl: "",
        sampleUrl: "",
        tags: `${HYBRID_TAG} overlap_local`,
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-20T00:00:00.000Z"),
        isViewed: true,
      })
      .run();

    fetchPostsMock.mockImplementation(
      async (
        _tags: string,
        apiPage: number,
        _settings: unknown,
        _isRandom: boolean,
        limit: number
      ) => {
        const feed = [
          makeRemotePost(OVERLAP_ID, new Date("2024-01-20T00:00:00.000Z")),
          makeRemotePost(401, new Date("2024-01-19T00:00:00.000Z")),
          makeRemotePost(402, new Date("2024-01-18T00:00:00.000Z")),
          makeRemotePost(403, new Date("2024-01-17T00:00:00.000Z")),
          makeRemotePost(404, new Date("2024-01-16T00:00:00.000Z")),
          makeRemotePost(405, new Date("2024-01-15T00:00:00.000Z")),
        ];
        const start = apiPage * limit;
        return asResult(feed.slice(start, start + limit));
      }
    );

    const page1 = await resolvePage(1);
    const page2 = await resolvePage(2);
    const keys1 = page1.map(identityKey);
    const keys2 = page2.map(identityKey);
    expect(new Set(keys1).size).toBe(keys1.length);
    expect(new Set(keys2).size).toBe(keys2.length);
    // Smoke P1 failure mode: page1∩page2 shared provider:postId under window-only dedupe.
    expect(keys2.filter((key) => keys1.includes(key))).toEqual([]);

    const page1Again = await resolvePage(1);
    expect(page1Again.map(identityKey)).toEqual(keys1);

    // Twin is past the first two pages (newer local padding) but must appear once later.
    const walk: ResolvedPost[] = [];
    let page = 1;
    for (;;) {
      const rows = await resolvePage(page);
      if (rows.length === 0) {
        break;
      }
      walk.push(...rows);
      if (rows.length < PAGE_LIMIT) {
        break;
      }
      page += 1;
    }
    const walkKeys = walk.map(identityKey);
    expect(new Set(walkKeys).size).toBe(walkKeys.length);
    const twinHits = walk.filter((row) => row.postId === OVERLAP_ID);
    expect(twinHits).toHaveLength(1);
    expect(twinHits[0]?.isViewed).toBe(true);
  });

  it("ordered pages stay unique when remote feed order ≠ publishedAt (R2 19006749 skew)", async () => {
    // Provider feed order is not publishedAt order. Expanding remoteFetchLimit with
    // page*limit then re-sorting by date lets later-feed / newer posts reshuffle the
    // merge so an id that ranked on page1 of the small window also lands on page2 of
    // the large window — R2 RED: page1∩page2 = rule34:19006749.
    const SKEW_ID = 19006749;

    mockDb.db.delete(playlists).run();
    mockDb.db
      .insert(playlists)
      .values({
        name: "Hybrid multi-tag ordered",
        isSmart: true,
        queryJson: JSON.stringify({
          tags: [
            { tag: HYBRID_TAG, type: "include" },
            { tag: "second_tag", type: "include" },
          ],
          provider: "rule34",
        }),
        querySchemaVersion: 1,
        iconName: "",
      })
      .run();
    const playlist = mockDb.db.select({ id: playlists.id }).from(playlists).all()[0];
    if (playlist === undefined) {
      throw new Error("Failed to insert multi-tag playlist");
    }
    playlistId = playlist.id;

    // Clear seed locals so the merge is remote-dominated (false remote-only / window skew).
    mockDb.db.delete(posts).run();

    fetchPostsMock.mockImplementation(
      async (
        _tags: string,
        apiPage: number,
        _settings: unknown,
        _isRandom: boolean,
        limit: number
      ) => {
        // Feed order ≠ date order: SKEW_ID is early in the feed but mid-ranked by date;
        // Y/Z/W appear later in the feed with newer publishedAt.
        const feed = [
          makeRemotePost(SKEW_ID, new Date("2024-01-08T00:00:00.000Z"), [HYBRID_TAG, "second_tag"]),
          makeRemotePost(601, new Date("2024-01-07T00:00:00.000Z"), [HYBRID_TAG, "second_tag"]),
          makeRemotePost(602, new Date("2024-01-06T00:00:00.000Z"), [HYBRID_TAG, "second_tag"]),
          makeRemotePost(701, new Date("2024-01-20T00:00:00.000Z"), [HYBRID_TAG, "second_tag"]),
          makeRemotePost(702, new Date("2024-01-15T00:00:00.000Z"), [HYBRID_TAG, "second_tag"]),
          makeRemotePost(703, new Date("2024-01-12T00:00:00.000Z"), [HYBRID_TAG, "second_tag"]),
          makeRemotePost(704, new Date("2024-01-05T00:00:00.000Z"), [HYBRID_TAG, "second_tag"]),
          makeRemotePost(705, new Date("2024-01-04T00:00:00.000Z"), [HYBRID_TAG, "second_tag"]),
        ];
        const start = apiPage * limit;
        return asResult(feed.slice(start, start + limit));
      }
    );

    const page1 = await resolvePage(1);
    const page2 = await resolvePage(2);
    const keys1 = page1.map(identityKey);
    const keys2 = page2.map(identityKey);

    expect(keys1).toHaveLength(PAGE_LIMIT);
    expect(new Set(keys1).size).toBe(keys1.length);
    expect(new Set(keys2).size).toBe(keys2.length);
    // Pre-fix expanding page*limit remote window: page1=[19006749,601,602],
    // page2 large-window slice also contains 19006749 after date re-sort.
    expect(keys2.filter((key) => keys1.includes(key))).toEqual([]);

    const page1Again = await resolvePage(1);
    expect(page1Again.map(identityKey)).toEqual(keys1);

    const walkKeys: string[] = [];
    let page = 1;
    for (;;) {
      const rows = await resolvePage(page);
      if (rows.length === 0) {
        break;
      }
      walkKeys.push(...rows.map(identityKey));
      if (rows.length < PAGE_LIMIT) {
        break;
      }
      page += 1;
    }
    expect(new Set(walkKeys).size).toBe(walkKeys.length);
    expect(walkKeys.filter((key) => key === `rule34:${SKEW_ID}`)).toHaveLength(1);
  });

  it("ordered pages stay unique when live remote feed drifts between page IPC calls (R3)", async () => {
    // R3 LIVE failure: each ordered page re-fetches the provider. A newer post
    // appearing on top between page1 and page2 shifts the feed (OFFSET / merge
    // window), so page1 freshest ids also land on page2 (smart: 19006907/19006906;
    // hybrid: 19004801). Identity is provider:postId (remote rows often id: 0).
    const OVERLAP_A = 19006907;
    const OVERLAP_B = 19006906;
    const DRIFT_NEW = 19009999;

    mockDb.db.delete(playlists).run();
    mockDb.db
      .insert(playlists)
      .values({
        name: "Hybrid live-drift ordered",
        isSmart: true,
        queryJson: JSON.stringify({
          tags: [
            { tag: HYBRID_TAG, type: "include" },
            { tag: "drift_tag", type: "include" },
          ],
          provider: "rule34",
        }),
        querySchemaVersion: 1,
        iconName: "",
      })
      .run();
    const playlist = mockDb.db.select({ id: playlists.id }).from(playlists).all()[0];
    if (playlist === undefined) {
      throw new Error("Failed to insert drift playlist");
    }
    playlistId = playlist.id;

    // One local twin + remote-only peers — close to smoke hybrid (remote+local).
    mockDb.db.delete(posts).run();
    const artist = mockDb.db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("expected seed artist");
    }
    mockDb.db
      .insert(posts)
      .values({
        postId: 19004801,
        artistId: artist.id,
        provider: "rule34",
        fileUrl: "https://local.example.com/19004801.jpg",
        previewUrl: "",
        sampleUrl: "",
        tags: `${HYBRID_TAG} drift_tag local`,
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-09T00:00:00.000Z"),
        isViewed: true,
      })
      .run();

    const baseFeed: BooruPost[] = [
      makeRemotePost(OVERLAP_A, new Date("2024-01-12T00:00:00.000Z"), [
        HYBRID_TAG,
        "drift_tag",
      ]),
      makeRemotePost(OVERLAP_B, new Date("2024-01-11T00:00:00.000Z"), [
        HYBRID_TAG,
        "drift_tag",
      ]),
      makeRemotePost(19006905, new Date("2024-01-10T00:00:00.000Z"), [
        HYBRID_TAG,
        "drift_tag",
      ]),
      makeRemotePost(19004801, new Date("2024-01-09T00:00:00.000Z"), [
        HYBRID_TAG,
        "drift_tag",
      ]),
      makeRemotePost(19002862, new Date("2024-01-08T00:00:00.000Z"), [
        HYBRID_TAG,
        "drift_tag",
      ]),
      makeRemotePost(19006901, new Date("2024-01-07T00:00:00.000Z"), [
        HYBRID_TAG,
        "drift_tag",
      ]),
      makeRemotePost(19006889, new Date("2024-01-06T00:00:00.000Z"), [
        HYBRID_TAG,
        "drift_tag",
      ]),
      makeRemotePost(19006877, new Date("2024-01-05T00:00:00.000Z"), [
        HYBRID_TAG,
        "drift_tag",
      ]),
    ];

    let resolveCallCount = 0;
    fetchPostsMock.mockImplementation(
      async (
        tags: string,
        apiPage: number,
        _settings: unknown,
        _isRandom: boolean,
        limit: number
      ) => {
        // Count top-level resolve pages via pid=0 starts (each hybrid resolve
        // walks the feed from apiPage 0).
        if (apiPage === 0) {
          resolveCallCount += 1;
        }
        // After page1, live feed gains a newer head — without an upper-bound
        // snapshot this pushes OVERLAP_A/B from page1 into page2.
        let feed =
          resolveCallCount <= 1
            ? baseFeed
            : [
                makeRemotePost(DRIFT_NEW, new Date("2024-01-20T00:00:00.000Z"), [
                  HYBRID_TAG,
                  "drift_tag",
                ]),
                ...baseFeed,
              ];
        // Honor id:<=N / id:<N upper-bound meta-tags when present (fix path).
        const leMatch = /\bid:<=(\d+)\b/.exec(tags);
        const ltMatch = /\bid:<(\d+)\b/.exec(tags);
        if (leMatch) {
          const bound = Number(leMatch[1]);
          feed = feed.filter((post) => post.id <= bound);
        } else if (ltMatch) {
          const bound = Number(ltMatch[1]);
          feed = feed.filter((post) => post.id < bound);
        }
        const start = apiPage * limit;
        return asResult(feed.slice(start, start + limit));
      }
    );

    const page1 = await resolvePage(1);
    const page2 = await resolvePage(2);
    const keys1 = page1.map(identityKey);
    const keys2 = page2.map(identityKey);

    expect(keys1).toHaveLength(PAGE_LIMIT);
    expect(new Set(keys1).size).toBe(keys1.length);
    expect(new Set(keys2).size).toBe(keys2.length);
    expect(keys1).toContain(`rule34:${OVERLAP_A}`);
    expect(keys1).toContain(`rule34:${OVERLAP_B}`);
    // Snapshot-bound / issued-key walk: page2 must not re-emit page1 identities
    // after live feed drift, and must not introduce posts above the snapshot.
    expect(keys2.filter((key) => keys1.includes(key))).toEqual([]);
    expect(keys2).not.toContain(`rule34:${DRIFT_NEW}`);

    const walkKeys: string[] = [];
    let page = 1;
    for (;;) {
      const rows = await resolvePage(page);
      if (rows.length === 0) {
        break;
      }
      walkKeys.push(...rows.map(identityKey));
      if (rows.length < PAGE_LIMIT) {
        break;
      }
      page += 1;
    }
    expect(new Set(walkKeys).size).toBe(walkKeys.length);
    expect(walkKeys.filter((key) => key === `rule34:${OVERLAP_A}`)).toHaveLength(1);
    expect(walkKeys.filter((key) => key === `rule34:${OVERLAP_B}`)).toHaveLength(1);
    expect(walkKeys.filter((key) => key === "rule34:19004801")).toHaveLength(1);
  });

  it("ordered merge tie-breaks equal publishedAt by provider then postId", async () => {
    mockDb.db.delete(posts).run();
    const artist = mockDb.db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("expected seed artist");
    }
    const TIE_TIME = new Date("2024-03-01T00:00:00.000Z");
    // Two local rows, same publishedAt; provider tie-break is identical, so postId desc.
    mockDb.db
      .insert(posts)
      .values([
        {
          postId: 5002,
          artistId: artist.id,
          provider: "rule34",
          fileUrl: "https://local.example.com/5002.jpg",
          previewUrl: "",
          sampleUrl: "",
          tags: `${HYBRID_TAG} tie`,
          rating: "s",
          mediaType: "image",
          publishedAt: TIE_TIME,
        },
        {
          postId: 5001,
          artistId: artist.id,
          provider: "rule34",
          fileUrl: "https://local.example.com/5001.jpg",
          previewUrl: "",
          sampleUrl: "",
          tags: `${HYBRID_TAG} tie`,
          rating: "s",
          mediaType: "image",
          publishedAt: TIE_TIME,
        },
      ])
      .run();

    fetchPostsMock.mockImplementation(async () =>
      asResult([
        makeRemotePost(6001, TIE_TIME),
        makeRemotePost(6002, TIE_TIME),
      ])
    );

    const page1 = await resolvePage(1);
    // desc publishedAt (tied) → provider ASC (all rule34) → postId DESC
    expect(page1.map((row) => row.postId)).toEqual([6002, 6001, 5002]);
  });

  it("ordered page 1 refresh starts a new remote upper-bound snapshot", async () => {
    mockDb.db.delete(posts).run();
    const REFRESH_HEAD = 19008888;
    const BASE_HEAD = 19007000;

    let generation = 0;
    fetchPostsMock.mockImplementation(
      async (
        tags: string,
        apiPage: number,
        _settings: unknown,
        _isRandom: boolean,
        limit: number
      ) => {
        if (apiPage === 0) {
          generation += 1;
        }
        let feed =
          generation === 1
            ? [
                makeRemotePost(BASE_HEAD, new Date("2024-01-12T00:00:00.000Z")),
                makeRemotePost(19006999, new Date("2024-01-11T00:00:00.000Z")),
                makeRemotePost(19006998, new Date("2024-01-10T00:00:00.000Z")),
                makeRemotePost(19006997, new Date("2024-01-09T00:00:00.000Z")),
              ]
            : [
                makeRemotePost(REFRESH_HEAD, new Date("2024-01-20T00:00:00.000Z")),
                makeRemotePost(BASE_HEAD, new Date("2024-01-12T00:00:00.000Z")),
                makeRemotePost(19006999, new Date("2024-01-11T00:00:00.000Z")),
                makeRemotePost(19006998, new Date("2024-01-10T00:00:00.000Z")),
              ];
        const leMatch = /\bid:<=(\d+)\b/.exec(tags);
        if (leMatch) {
          const bound = Number(leMatch[1]);
          feed = feed.filter((post) => post.id <= bound);
        }
        const start = apiPage * limit;
        return asResult(feed.slice(start, start + limit));
      }
    );

    const firstWalkPage1 = await resolvePage(1);
    expect(firstWalkPage1.map((row) => row.postId)).toContain(BASE_HEAD);
    expect(firstWalkPage1.map((row) => row.postId)).not.toContain(REFRESH_HEAD);

    // Page 2 of the first snapshot must not see REFRESH_HEAD (bound freezes feed).
    const firstWalkPage2 = await resolvePage(2);
    expect(firstWalkPage2.map((row) => row.postId)).not.toContain(REFRESH_HEAD);

    // Page 1 again = refresh = new snapshot that may include newer head.
    const refreshedPage1 = await resolvePage(1);
    expect(refreshedPage1.map((row) => row.postId)).toContain(REFRESH_HEAD);
  });
});
