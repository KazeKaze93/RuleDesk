import { afterEach, describe, expect, it } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "@/main/db/schema";
import { EXTERNAL_ARTIST_ID } from "@/shared/constants";
import { and, eq, sql } from "drizzle-orm";

/**
 * Playlist import + sync upsert contract: post identity is
 * (artist_id, provider, post_id).
 */
describe("posts provider identity (import + sync conflict target)", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  afterEach(() => {
    mockDb?.sqlite.close();
  });

  it("playlist import lookup key distinguishes providers for the same postId", () => {
    mockDb = createMockDb();
    const { db } = mockDb;

    db.insert(artists)
      .values({
        id: EXTERNAL_ARTIST_ID,
        name: "Artist 0",
        tag: "external_0",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "",
      })
      .run();

    db.insert(posts)
      .values([
        {
          postId: 12345,
          artistId: EXTERNAL_ARTIST_ID,
          provider: "rule34",
          fileUrl: "https://api-cdn.rule34.xxx/a.jpg",
          previewUrl: "https://api-cdn.rule34.xxx/a_p.jpg",
          sampleUrl: "",
          tags: "r34",
          rating: "e",
          mediaType: "image",
          publishedAt: new Date(),
        },
        {
          postId: 12345,
          artistId: EXTERNAL_ARTIST_ID,
          provider: "gelbooru",
          fileUrl: "https://img4.gelbooru.com/a.jpg",
          previewUrl: "https://img4.gelbooru.com/a_p.jpg",
          sampleUrl: "",
          tags: "gel",
          rating: "e",
          mediaType: "image",
          publishedAt: new Date(),
        },
      ])
      .run();

    const localPosts = db
      .select({
        id: posts.id,
        postId: posts.postId,
        artistId: posts.artistId,
        provider: posts.provider,
      })
      .from(posts)
      .where(eq(posts.postId, 12345))
      .all();

    const localPostIdMap = new Map(
      localPosts.map((p) => [`${p.artistId}:${p.provider}:${p.postId}`, p.id])
    );

    const entry = {
      postId: 12345,
      artistId: EXTERNAL_ARTIST_ID,
      provider: "gelbooru" as const,
    };
    const matched = localPostIdMap.get(
      `${entry.artistId}:${entry.provider}:${entry.postId}`
    );
    const wrong = localPostIdMap.get(
      `${EXTERNAL_ARTIST_ID}:rule34:12345`
    );

    expect(matched).toBeDefined();
    expect(wrong).toBeDefined();
    expect(matched).not.toBe(wrong);
    expect(
      localPosts.find((p) => p.id === matched)?.provider
    ).toBe("gelbooru");
  });

  it("sync upsert on (artist_id, provider, post_id) updates without duplicating", () => {
    mockDb = createMockDb();
    const { db } = mockDb;

    const artist = db
      .insert(artists)
      .values({
        name: "Tracked",
        tag: "tracked_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "",
      })
      .returning()
      .get();

    if (!artist) {
      throw new Error("Failed to insert artist");
    }

    db.insert(posts)
      .values({
        postId: 99,
        artistId: artist.id,
        provider: "rule34",
        fileUrl: "https://api-cdn.rule34.xxx/old.jpg",
        previewUrl: "https://api-cdn.rule34.xxx/old_p.jpg",
        sampleUrl: "",
        tags: "old",
        rating: "s",
        mediaType: "image",
        publishedAt: new Date(),
      })
      .run();

    db.insert(posts)
      .values({
        postId: 99,
        artistId: artist.id,
        provider: "rule34",
        fileUrl: "https://api-cdn.rule34.xxx/new.jpg",
        previewUrl: "https://api-cdn.rule34.xxx/new_p.jpg",
        sampleUrl: "https://api-cdn.rule34.xxx/new_s.jpg",
        tags: "new",
        rating: "e",
        mediaType: "image",
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [posts.artistId, posts.provider, posts.postId],
        set: {
          fileUrl: sql`excluded.file_url`,
          sampleUrl: sql`excluded.sample_url`,
          previewUrl: sql`excluded.preview_url`,
          tags: sql`excluded.tags`,
          rating: sql`excluded.rating`,
        },
      })
      .run();

    const rows = db
      .select()
      .from(posts)
      .where(
        and(eq(posts.artistId, artist.id), eq(posts.postId, 99))
      )
      .all();

    expect(rows).toHaveLength(1);
    expect(rows[0].fileUrl).toContain("new.jpg");
    expect(rows[0].tags).toBe("new");
    expect(rows[0].provider).toBe("rule34");
  });
});
