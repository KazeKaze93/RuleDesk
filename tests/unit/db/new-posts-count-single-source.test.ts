import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import * as schema from "@/main/db/schema";
import { artists, posts } from "@/main/db/schema";
import {
  ensureDrizzleMigrationsTable,
  readMigrationJournal,
  runManualMigrations,
} from "@/main/db/migration-runner";
import { getTrackedArtistsWithStats } from "@/main/db/queries/artists";
import {
  countUpdatesFeedPosts,
  markPostsViewedByIds,
  markUpdatesFeedPostsViewed,
} from "@/main/db/queries/updates-feed";
import {
  EXTERNAL_ARTIST_ID,
  EXTERNAL_ARTIST_TAG_PREFIX,
} from "@/shared/constants";

const P8_TEMP_ROOT = path.join(
  process.env.TEMP ?? process.env.TMP ?? "",
  "rd-p8"
);
const SECOND_MS = 1000;
const ARTIST_CREATED_SEC = 1_700_000_000;
const BEFORE_TRACKING_SEC = ARTIST_CREATED_SEC - 86_400;
const AFTER_TRACKING_SEC = ARTIST_CREATED_SEC + 86_400;

/**
 * File DB under %TEMP%\rd-p8\ using production migrations (never live data.bin).
 */
function openP8Db() {
  fs.mkdirSync(P8_TEMP_ROOT, { recursive: true });
  const dbPath = path.join(P8_TEMP_ROOT, `single-source-${process.pid}.bin`);
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  const migrationEntries = readMigrationJournal(migrationsFolder);
  if (!migrationEntries) {
    sqlite.close();
    throw new Error("[P8 test] Could not read migration journal");
  }
  ensureDrizzleMigrationsTable(sqlite);
  runManualMigrations(sqlite, migrationsFolder, migrationEntries);
  return { db, sqlite, dbPath };
}

describe("newPostsCount single source (aggregate == Updates feed)", () => {
  let sqlite: InstanceType<typeof Database> | null = null;
  let dbPath: string | null = null;

  afterEach(() => {
    sqlite?.close();
    sqlite = null;
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // ignore Windows file lock
      }
    }
    dbPath = null;
  });

  function seed() {
    const opened = openP8Db();
    sqlite = opened.sqlite;
    dbPath = opened.dbPath;
    const { db } = opened;

    db.insert(artists)
      .values([
        {
          id: EXTERNAL_ARTIST_ID,
          name: "External",
          tag: `${EXTERNAL_ARTIST_TAG_PREFIX}0`,
          provider: "rule34",
          type: "tag",
          apiEndpoint: "https://api.rule34.xxx/",
          createdAt: new Date(ARTIST_CREATED_SEC * SECOND_MS),
          // Deliberately stale column — must be ignored by readers.
          newPostsCount: 999,
        },
        {
          id: 1,
          name: "Artist A",
          tag: "artist_a",
          provider: "rule34",
          type: "tag",
          apiEndpoint: "https://api.rule34.xxx/",
          createdAt: new Date(ARTIST_CREATED_SEC * SECOND_MS),
          newPostsCount: 42,
        },
        {
          id: 2,
          name: "Artist B",
          tag: "artist_b",
          provider: "rule34",
          type: "tag",
          apiEndpoint: "https://api.rule34.xxx/",
          createdAt: new Date(ARTIST_CREATED_SEC * SECOND_MS),
          newPostsCount: 7,
        },
      ])
      .run();

    const insertPost = (values: {
      postId: number;
      artistId: number;
      publishedAtSec: number;
      isViewed: boolean;
      tags?: string;
    }) => {
      db.insert(posts)
        .values({
          postId: values.postId,
          artistId: values.artistId,
          provider: "rule34",
          fileUrl: `https://example.com/${values.postId}.jpg`,
          previewUrl: `https://example.com/${values.postId}_p.jpg`,
          sampleUrl: "",
          tags: values.tags ?? "solo",
          rating: "s",
          mediaType: "image",
          publishedAt: new Date(values.publishedAtSec * SECOND_MS),
          createdAt: new Date(values.publishedAtSec * SECOND_MS),
          isViewed: values.isViewed,
          isFavorited: false,
          viewCount: 0,
        })
        .run();
    };

    // Pre-tracking history (must not count)
    insertPost({
      postId: 10,
      artistId: 1,
      publishedAtSec: BEFORE_TRACKING_SEC,
      isViewed: false,
    });
    // Sync-like unread since tracking
    insertPost({
      postId: 11,
      artistId: 1,
      publishedAtSec: AFTER_TRACKING_SEC,
      isViewed: false,
      tags: "solo 1girl",
    });
    insertPost({
      postId: 12,
      artistId: 1,
      publishedAtSec: AFTER_TRACKING_SEC + 10,
      isViewed: false,
      tags: "solo male",
    });
    insertPost({
      postId: 13,
      artistId: 1,
      publishedAtSec: AFTER_TRACKING_SEC + 20,
      isViewed: true,
    });
    insertPost({
      postId: 21,
      artistId: 2,
      publishedAtSec: AFTER_TRACKING_SEC,
      isViewed: false,
    });
    insertPost({
      postId: 300,
      artistId: EXTERNAL_ARTIST_ID,
      publishedAtSec: AFTER_TRACKING_SEC,
      isViewed: false,
    });

    return db;
  }

  function assertBadgeCardFeedAgree(
    db: ReturnType<typeof openP8Db>["db"],
    expectedUnread: number
  ) {
    const badge = countUpdatesFeedPosts(db, { unreadOnly: true });
    const feedTotal = countUpdatesFeedPosts(db, { unreadOnly: false });
    const cards = getTrackedArtistsWithStats(db);
    const cardSum = cards.reduce((sum, row) => sum + Number(row.newPostsCount), 0);

    expect(badge).toBe(expectedUnread);
    expect(cardSum).toBe(expectedUnread);
    expect(feedTotal).toBeGreaterThanOrEqual(expectedUnread);

    // Stale column must not leak into card stats
    const columnRows = db
      .select({
        id: artists.id,
        column: artists.newPostsCount,
      })
      .from(artists)
      .where(eq(artists.id, 1))
      .all();
    expect(columnRows[0]?.column).toBe(42);
    expect(cards.find((c) => c.id === 1)?.newPostsCount).not.toBe(42);
  }

  it("badge, artist cards, and feed unread agree after sync-shaped seed", () => {
    const db = seed();
    // A: 2 unread since-tracking; B: 1; external excluded → 3
    assertBadgeCardFeedAgree(db, 3);
    const cards = getTrackedArtistsWithStats(db);
    expect(cards.find((c) => c.id === 1)?.newPostsCount).toBe(2);
    expect(cards.find((c) => c.id === 2)?.newPostsCount).toBe(1);
  });

  it("mark-viewed keeps badge and cards aligned", () => {
    const db = seed();
    const row = db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.postId, 11))
      .get();
    expect(row).toBeDefined();
    if (!row) {
      throw new Error("expected post 11");
    }

    expect(markPostsViewedByIds(db, [row.id])).toBe(1);
    assertBadgeCardFeedAgree(db, 2);
    expect(getTrackedArtistsWithStats(db).find((c) => c.id === 1)?.newPostsCount).toBe(
      1
    );
  });

  it("mark-all-read zeros badge and every artist card", () => {
    const db = seed();
    expect(markUpdatesFeedPostsViewed(db)).toBe(3);
    assertBadgeCardFeedAgree(db, 0);
    for (const card of getTrackedArtistsWithStats(db)) {
      expect(card.newPostsCount).toBe(0);
    }
  });
});
