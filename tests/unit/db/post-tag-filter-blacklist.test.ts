import { describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "@/main/db/schema";
import { buildPostsBlacklistFilterCondition } from "@/main/db/queries/post-tag-filter";

/**
 * Legacy correlated `tag_blacklist` filter kept only for equivalence fixtures.
 * Production code must use `buildPostsBlacklistFilterCondition`.
 */
function legacyBlacklistFilterCondition() {
  return sql`NOT EXISTS (
    SELECT 1
    FROM tag_blacklist bl
    WHERE instr(' ' || lower(${posts.tags}) || ' ', ' ' || lower(bl.tag) || ' ') > 0
  )`;
}

describe("buildPostsBlacklistFilterCondition", () => {
  it("returns null for an empty blacklist", () => {
    expect(buildPostsBlacklistFilterCondition([])).toBeNull();
    expect(buildPostsBlacklistFilterCondition(["", "  "])).toBeNull();
  });

  it("matches legacy NOT EXISTS tag_blacklist instr filter row-for-row", () => {
    const { db, sqlite } = createMockDb();

    db.insert(artists)
      .values({
        name: "T9 Artist",
        tag: "t9_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }

    const rows = [
      { postId: 1, tags: "solo female smile" },
      { postId: 2, tags: "solo male smile" },
      { postId: 3, tags: "group female male" },
      { postId: 4, tags: "ai_generated solo" },
      { postId: 5, tags: "prefix_ai_generated_suffix" },
      { postId: 6, tags: "AI_GENERATED uppercase" },
      { postId: 7, tags: "" },
    ];

    const now = new Date();
    for (const row of rows) {
      db.insert(posts)
        .values({
          postId: row.postId,
          artistId: artist.id,
          tags: row.tags,
          fileUrl: `https://example.com/${row.postId}.jpg`,
          previewUrl: `https://example.com/${row.postId}_p.jpg`,
          sampleUrl: "",
          rating: "e",
          mediaType: "image",
          publishedAt: now,
        })
        .run();
    }

    const blacklistTags = ["ai_generated", "male", "missing_tag"];
    const insertBl = sqlite.prepare(
      "INSERT INTO tag_blacklist (tag) VALUES (?)"
    );
    for (const tag of blacklistTags) {
      insertBl.run(tag);
    }

    const legacyIds = db
      .select({ postId: posts.postId })
      .from(posts)
      .where(
        and(eq(posts.artistId, artist.id), legacyBlacklistFilterCondition())
      )
      .all()
      .map((row) => row.postId)
      .sort((a, b) => a - b);

    const nextCondition = buildPostsBlacklistFilterCondition(blacklistTags);
    if (nextCondition === null) {
      throw new Error("expected blacklist SQL condition");
    }

    const nextIds = db
      .select({ postId: posts.postId })
      .from(posts)
      .where(and(eq(posts.artistId, artist.id), nextCondition))
      .all()
      .map((row) => row.postId)
      .sort((a, b) => a - b);

    expect(nextIds).toEqual(legacyIds);
    // Token match: whole-word ai_generated / male only — substring false friend kept.
    expect(nextIds).toEqual([1, 5, 7]);

    sqlite.close();
  });
});
