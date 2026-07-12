import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "@/main/db/schema";
import {
  buildPostsTimeline,
  queryPostsCreatedAtTimeline,
} from "@/main/db/queries/stats";
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

import { StatsController } from "@/main/ipc/controllers/StatsController";

function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function readTimelineCutoffSeconds(
  sqlite: InstanceType<typeof Database>
): number {
  const row = sqlite
    .prepare<
      [],
      { cutoff: number }
    >(
      `SELECT CAST(strftime('%s', 'now', 'start of month', '-11 months') AS INTEGER) as cutoff`
    )
    .get();
  if (row === undefined) {
    throw new Error("Failed to read timeline cutoff");
  }
  return row.cutoff;
}

describe("StatsController posts timeline units", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let artistId: number;
  let timelineCutoffSeconds: number;

  beforeEach(() => {
    mockDb = createMockDb();
    activeSqlite = mockDb.sqlite;
    timelineCutoffSeconds = readTimelineCutoffSeconds(mockDb.sqlite);

    mockDb.db
      .insert(artists)
      .values({
        name: "Timeline Artist",
        tag: "timeline_artist",
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
  });

  afterEach(() => {
    activeSqlite = null;
    try {
      mockDb.sqlite.close();
    } catch {
      // Ignore close errors in tests.
    }
  });

  function insertPost(params: {
    postId: number;
    createdAt: Date;
    rating?: string;
    tags?: string;
    isFavorited?: boolean;
    isViewed?: boolean;
    mediaType?: "image" | "video";
  }): void {
    mockDb.db
      .insert(posts)
      .values({
        postId: params.postId,
        artistId,
        fileUrl: `https://example.com/${params.postId}.jpg`,
        previewUrl: `https://example.com/${params.postId}_preview.jpg`,
        sampleUrl: "",
        title: "",
        rating: params.rating ?? "s",
        tags: params.tags ?? "solo character_a",
        mediaType: params.mediaType ?? "image",
        publishedAt: params.createdAt,
        createdAt: params.createdAt,
        isFavorited: params.isFavorited ?? false,
        isViewed: params.isViewed ?? true,
      })
      .run();
  }

  it("returns monthly buckets for Drizzle-written posts (fails on ms-scaled SQL)", () => {
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 10);
    const onBoundaryDate = new Date(timelineCutoffSeconds * 1000);
    const olderThanWindowDate = new Date((timelineCutoffSeconds - 1) * 1000);

    insertPost({ postId: 1, createdAt: currentMonthDate });
    insertPost({ postId: 2, createdAt: currentMonthDate });
    insertPost({ postId: 3, createdAt: previousMonthDate });
    insertPost({ postId: 4, createdAt: onBoundaryDate });
    insertPost({ postId: 5, createdAt: olderThanWindowDate });

    const rawCreatedAt = mockDb.sqlite
      .prepare<[number], { created_at: number }>(
        "SELECT created_at FROM posts WHERE post_id = ?"
      )
      .get(1);
    expect(rawCreatedAt?.created_at).toBeLessThan(1_000_000_000_000);
    expect(rawCreatedAt?.created_at).toBeGreaterThan(1_000_000_000);

    const brokenMsScaledRows = mockDb.sqlite
      .prepare<[], { month: string; count: number }>(
        `
          SELECT
            strftime('%Y-%m', datetime(created_at / 1000, 'unixepoch')) as month,
            COUNT(*) as count
          FROM posts
          WHERE created_at >= CAST(strftime('%s', 'now', 'start of month', '-11 months') AS INTEGER) * 1000
          GROUP BY month
          ORDER BY month ASC
        `
      )
      .all();
    expect(brokenMsScaledRows).toHaveLength(0);

    const timelineRows = queryPostsCreatedAtTimeline(mockDb.sqlite);
    const byMonth = new Map(timelineRows.map((row) => [row.month, row.count]));
    const timelineTotal = timelineRows.reduce((sum, row) => sum + row.count, 0);

    expect(timelineTotal).toBe(4);
    expect(byMonth.get(monthKey(currentMonthDate))).toBe(2);
    expect(byMonth.get(monthKey(previousMonthDate))).toBe(1);
    expect(byMonth.get(monthKey(onBoundaryDate))).toBe(1);

    const padded = buildPostsTimeline(mockDb.sqlite, now);
    expect(padded).toHaveLength(12);
    expect(padded[padded.length - 1]?.month).toBe(monthKey(currentMonthDate));
    expect(padded.find((row) => row.month === monthKey(currentMonthDate))?.count).toBe(
      2
    );
  });

  it("keeps non-timeline ExtendedStats metrics stable on the same fixture", () => {
    const now = new Date();
    insertPost({
      postId: 10,
      createdAt: now,
      rating: "s",
      tags: "alpha beta",
      isFavorited: true,
      isViewed: false,
      mediaType: "image",
    });
    insertPost({
      postId: 11,
      createdAt: now,
      rating: "e",
      tags: "alpha",
      isFavorited: false,
      isViewed: true,
      mediaType: "video",
    });

    const controller = new StatsController();
    // Private method: integration seam for full ExtendedStats without IPC.
    // @ts-expect-error intentional private access in test
    const stats = controller.getExtendedStats(null);

    expect(stats.totalArtists).toBe(1);
    expect(stats.totalPosts).toBe(2);
    expect(stats.totalFavorites).toBe(1);
    expect(stats.totalUnviewed).toBe(1);
    expect(stats.ratingCounts).toEqual({
      safe: 1,
      questionable: 0,
      explicit: 1,
    });
    expect(stats.mediaCounts).toEqual({ images: 1, videos: 1 });
    expect(stats.providerCounts).toEqual({ rule34: 1, gelbooru: 0 });
    expect(stats.topArtists).toEqual([{ name: "Timeline Artist", postCount: 2 }]);
    expect(stats.topTags[0]).toEqual({ tag: "alpha", count: 2 });
    expect(stats.dbSizeBytes).toBe(4096);

    const currentMonth = monthKey(now);
    expect(stats.postsTimeline).toHaveLength(12);
    expect(
      stats.postsTimeline.find((row) => row.month === currentMonth)?.count
    ).toBe(2);
  });
});
