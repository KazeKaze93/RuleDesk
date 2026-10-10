import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "@/main/db/schema";
import {
  EXTERNAL_ARTIST_ID,
  EXTERNAL_ARTIST_TAG_PREFIX,
} from "@/shared/constants";
import {
  countUpdatesFeedPosts,
  getLastTrackedArtistSyncAtMs,
  markPostsViewedByIds,
  markUpdatesFeedPostsViewed,
} from "@/main/db/queries/updates-feed";

const SECOND_MS = 1000;
const ARTIST_CREATED_SEC = 1_700_000_000;
const BEFORE_TRACKING_SEC = ARTIST_CREATED_SEC - 86_400;
const AFTER_TRACKING_SEC = ARTIST_CREATED_SEC + 86_400;
const LAST_CHECKED_SEC = ARTIST_CREATED_SEC + 172_800;

describe("updates-feed queries (real schema)", () => {
  let sqlite: ReturnType<typeof createMockDb>["sqlite"] | null = null;

  afterEach(() => {
    sqlite?.close();
    sqlite = null;
  });

  function seedFeedFixture() {
    const mock = createMockDb();
    sqlite = mock.sqlite;
    const { db } = mock;

    db.insert(artists)
      .values({
        id: EXTERNAL_ARTIST_ID,
        name: "External",
        tag: `${EXTERNAL_ARTIST_TAG_PREFIX}0`,
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
        createdAt: new Date(ARTIST_CREATED_SEC * SECOND_MS),
        lastChecked: new Date(LAST_CHECKED_SEC * SECOND_MS),
        newPostsCount: 0,
      })
      .run();

    db.insert(artists)
      .values({
        id: 1,
        name: "Tracked",
        tag: "tracked_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
        createdAt: new Date(ARTIST_CREATED_SEC * SECOND_MS),
        lastChecked: new Date(LAST_CHECKED_SEC * SECOND_MS),
        newPostsCount: 2,
      })
      .run();

    const insertPost = (values: {
      postId: number;
      artistId: number;
      tags: string;
      publishedAtSec: number;
      isViewed: boolean;
    }) => {
      db.insert(posts)
        .values({
          postId: values.postId,
          artistId: values.artistId,
          fileUrl: `https://example.com/${values.postId}.jpg`,
          previewUrl: `https://example.com/${values.postId}_p.jpg`,
          sampleUrl: "",
          tags: values.tags,
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

    // History before subscription — must not enter feed / badge
    insertPost({
      postId: 100,
      artistId: 1,
      tags: "solo 1girl history",
      publishedAtSec: BEFORE_TRACKING_SEC,
      isViewed: false,
    });
    insertPost({
      postId: 101,
      artistId: 1,
      tags: "solo 1girl history_two",
      publishedAtSec: BEFORE_TRACKING_SEC + 10,
      isViewed: false,
    });

    // Feed-eligible unread
    insertPost({
      postId: 200,
      artistId: 1,
      tags: "solo 1girl feed_a",
      publishedAtSec: AFTER_TRACKING_SEC,
      isViewed: false,
    });
    insertPost({
      postId: 201,
      artistId: 1,
      tags: "solo male feed_b",
      publishedAtSec: AFTER_TRACKING_SEC + 10,
      isViewed: false,
    });
    insertPost({
      postId: 202,
      artistId: 1,
      tags: "landscape feed_c",
      publishedAtSec: AFTER_TRACKING_SEC + 20,
      isViewed: true,
    });

    // External artist post after "tracking" — excluded from feed
    insertPost({
      postId: 300,
      artistId: EXTERNAL_ARTIST_ID,
      tags: "solo external",
      publishedAtSec: AFTER_TRACKING_SEC,
      isViewed: false,
    });

    return db;
  }

  it("badge unread ignores pre-tracking history and external posts", () => {
    const db = seedFeedFixture();
    const badge = countUpdatesFeedPosts(db, { unreadOnly: true });
    expect(badge).toBe(2);
  });

  it("feed count without unread filter includes viewed since-tracking posts", () => {
    const db = seedFeedFixture();
    expect(countUpdatesFeedPosts(db, { unreadOnly: false })).toBe(3);
  });

  it("mark-all-read with tag X marks only X; badge becomes N-M", () => {
    const db = seedFeedFixture();
    const n = countUpdatesFeedPosts(db, { unreadOnly: true });
    const m = countUpdatesFeedPosts(db, {
      unreadOnly: true,
      filters: { tags: "1girl" },
    });
    expect(n).toBe(2);
    expect(m).toBe(1);

    const updated = markUpdatesFeedPostsViewed(db, { tags: "1girl" });
    expect(updated).toBe(m);

    expect(
      countUpdatesFeedPosts(db, {
        unreadOnly: true,
        filters: { tags: "1girl" },
      })
    ).toBe(0);
    // Badge ignores the active tag filter
    expect(countUpdatesFeedPosts(db, { unreadOnly: true })).toBe(n - m);
  });

  it("markPostsViewedByIds only touches the given ids", () => {
    const db = seedFeedFixture();
    const feedUnreadBefore = countUpdatesFeedPosts(db, { unreadOnly: true });
    expect(feedUnreadBefore).toBe(2);

    const row = db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.postId, 200))
      .get();
    expect(row).toBeDefined();
    if (!row) {
      throw new Error("expected post 200");
    }

    const updated = markPostsViewedByIds(db, [row.id]);
    expect(updated).toBe(1);
    expect(countUpdatesFeedPosts(db, { unreadOnly: true })).toBe(1);

    const historyStillUnread = db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.postId, 100))
      .get();
    expect(historyStillUnread).toBeDefined();
    const historyRow = db
      .select({ isViewed: posts.isViewed })
      .from(posts)
      .where(eq(posts.postId, 100))
      .get();
    expect(historyRow?.isViewed).toBe(false);
  });

  it("auto-mark loaded filtered ids leaves other feed unread for badge", () => {
    const db = seedFeedFixture();
    // N=2 unread sinceTracking (postIds 200=1girl, 201=male). M=1 with tag 1girl.
    const n = countUpdatesFeedPosts(db, { unreadOnly: true });
    const m = countUpdatesFeedPosts(db, {
      unreadOnly: true,
      filters: { tags: "1girl" },
    });
    expect(n).toBe(2);
    expect(m).toBe(1);

    // Simulate Updates feed page load under tag filter: only matching ids are marked.
    const loadedFiltered = db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.postId, 200))
      .all()
      .map((row) => row.id);
    expect(loadedFiltered).toHaveLength(m);

    const updated = markPostsViewedByIds(db, loadedFiltered);
    expect(updated).toBe(m);

    expect(
      countUpdatesFeedPosts(db, {
        unreadOnly: true,
        filters: { tags: "1girl" },
      })
    ).toBe(0);
    // Badge ignores tags → remaining N−M
    expect(countUpdatesFeedPosts(db, { unreadOnly: true })).toBe(n - m);

    const otherFeedPost = db
      .select({ isViewed: posts.isViewed })
      .from(posts)
      .where(eq(posts.postId, 201))
      .get();
    expect(otherFeedPost?.isViewed).toBe(false);
  });

  it("getLastTrackedArtistSyncAtMs returns ms and ignores only-external sync", () => {
    const db = seedFeedFixture();
    const ms = getLastTrackedArtistSyncAtMs(db);
    expect(ms).toBe(LAST_CHECKED_SEC * SECOND_MS);

    db.update(artists)
      .set({ lastChecked: null })
      .where(eq(artists.id, 1))
      .run();
    expect(getLastTrackedArtistSyncAtMs(db)).toBeNull();
  });

  it("mark-all-read handles 40000 matching posts without SQLite variable limit", () => {
    const LARGE_MATCH_COUNT = 40_000;
    const ARTIST_A = 1;
    const ARTIST_B = 2;
    const COUNT_A = 25_000;
    const COUNT_B = LARGE_MATCH_COUNT - COUNT_A;

    const mock = createMockDb();
    sqlite = mock.sqlite;
    const { db } = mock;

    db.insert(artists)
      .values([
        {
          id: ARTIST_A,
          name: "Bulk A",
          tag: "bulk_a",
          provider: "rule34",
          type: "tag",
          apiEndpoint: "https://api.rule34.xxx/",
          createdAt: new Date(ARTIST_CREATED_SEC * SECOND_MS),
          lastChecked: new Date(LAST_CHECKED_SEC * SECOND_MS),
          newPostsCount: COUNT_A,
        },
        {
          id: ARTIST_B,
          name: "Bulk B",
          tag: "bulk_b",
          provider: "rule34",
          type: "tag",
          apiEndpoint: "https://api.rule34.xxx/",
          createdAt: new Date(ARTIST_CREATED_SEC * SECOND_MS),
          lastChecked: new Date(LAST_CHECKED_SEC * SECOND_MS),
          newPostsCount: COUNT_B,
        },
      ])
      .run();

    const insert = sqlite.prepare(`
      INSERT INTO posts (
        post_id, artist_id, file_url, preview_url, sample_url, tags, rating,
        media_type, published_at, created_at, is_viewed, is_favorited, view_count
      ) VALUES (?, ?, '', '', '', 'solo bulk', 's', 'image', ?, ?, 0, 0, 0)
    `);
    const publishedAt = AFTER_TRACKING_SEC;
    const insertMany = sqlite.transaction(
      (rows: ReadonlyArray<{ postId: number; artistId: number }>) => {
        for (const row of rows) {
          insert.run(row.postId, row.artistId, publishedAt, publishedAt);
        }
      }
    );

    const batch: { postId: number; artistId: number }[] = [];
    for (let i = 0; i < COUNT_A; i += 1) {
      batch.push({ postId: 1_000_000 + i, artistId: ARTIST_A });
    }
    for (let i = 0; i < COUNT_B; i += 1) {
      batch.push({ postId: 2_000_000 + i, artistId: ARTIST_B });
    }
    insertMany(batch);

    expect(countUpdatesFeedPosts(db, { unreadOnly: true })).toBe(
      LARGE_MATCH_COUNT
    );

    const updated = markUpdatesFeedPostsViewed(db);
    expect(updated).toBe(LARGE_MATCH_COUNT);
    expect(countUpdatesFeedPosts(db, { unreadOnly: true })).toBe(0);
  });
});
