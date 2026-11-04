import { afterEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "../../../src/main/db/schema";
import { EXTERNAL_ARTIST_ID } from "@shared/constants";

/**
 * Proves drizzle column enum KNOWN_STORED_PROVIDER_IDS accepts legacy
 * stored ids (gelbooru) on the normal insert/eq path — no sql`` workaround.
 */
describe("known-stored provider enum (drizzle)", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  afterEach(() => {
    mockDb?.sqlite.close();
  });

  it("inserts and finds a post with provider gelbooru via normal drizzle values/eq", () => {
    mockDb = createMockDb();
    const { db } = mockDb;

    db.insert(artists)
      .values({
        id: EXTERNAL_ARTIST_ID,
        name: "Artist 0",
        tag: "external_0",
        provider: "gelbooru",
        type: "tag",
        apiEndpoint: "",
      })
      .run();

    const gelbooruProvider = "gelbooru" as const;

    db.insert(posts)
      .values({
        postId: 4242,
        artistId: EXTERNAL_ARTIST_ID,
        provider: gelbooruProvider,
        fileUrl: "https://img4.gelbooru.com/images/legacy.jpg",
        previewUrl: "https://img4.gelbooru.com/images/legacy_p.jpg",
        sampleUrl: "",
        tags: "legacy_gelbooru",
        rating: "e",
        mediaType: "image",
        publishedAt: new Date(),
      })
      .run();

    const found = db
      .select({
        postId: posts.postId,
        provider: posts.provider,
        tags: posts.tags,
      })
      .from(posts)
      .where(
        and(
          eq(posts.artistId, EXTERNAL_ARTIST_ID),
          eq(posts.postId, 4242),
          eq(posts.provider, gelbooruProvider)
        )
      )
      .limit(1)
      .get();

    expect(found).toBeDefined();
    expect(found?.provider).toBe("gelbooru");
    expect(found?.tags).toBe("legacy_gelbooru");
  });
});
