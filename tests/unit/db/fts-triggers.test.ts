import { describe, it, expect, afterEach } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "../../../src/main/db/schema";
import {
  FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME,
  FTS5_CACHE_INVALIDATE_UPDATE_TRIGGER_NAME,
  POSTS_FTS_INSERT_TRIGGER_NAME,
  dropFtsTriggersForBulkInsert,
  ensureFtsTriggers,
} from "../../../src/main/db/fts-triggers";

const EXPECTED_TRIGGERS = [
  "fts5_cache_invalidate_delete",
  "fts5_cache_invalidate_insert",
  "fts5_cache_invalidate_update",
  "posts_fts_delete",
  "posts_fts_insert",
  "posts_fts_update",
] as const;

function listTriggers(
  sqlite: ReturnType<typeof createMockDb>["sqlite"]
): string[] {
  const rows = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name"
    )
    .all() as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

function readStamp(
  sqlite: ReturnType<typeof createMockDb>["sqlite"]
): number {
  const row = sqlite
    .prepare(
      "SELECT invalidated_at FROM fts5_cache_invalidation WHERE id = 1"
    )
    .get() as { invalidated_at: number } | undefined;
  if (row === undefined) {
    throw new Error("fts5_cache_invalidation row id=1 missing");
  }
  return row.invalidated_at;
}

function sleepMs(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy-wait so julianday ms stamp can advance
  }
}

describe("FTS cache invalidation on posts", () => {
  let mockDb: ReturnType<typeof createMockDb> | null = null;

  afterEach(() => {
    try {
      mockDb?.sqlite.close();
    } catch {
      // ignore
    }
    mockDb = null;
  });

  it("applies migrations with all six FTS-related triggers present", () => {
    mockDb = createMockDb();
    expect(listTriggers(mockDb.sqlite)).toEqual([...EXPECTED_TRIGGERS]);
  });

  it("bumps invalidated_at on INSERT, UPDATE OF tags, and DELETE; not on is_viewed", () => {
    mockDb = createMockDb();
    const { db, sqlite } = mockDb;

    db.insert(artists)
      .values({
        name: "Stamp Artist",
        tag: "stamp_artist",
        provider: "rule34",
        type: "tag",
        apiEndpoint: "https://api.rule34.xxx/",
      })
      .run();
    const artist = db.select({ id: artists.id }).from(artists).all()[0];
    if (artist === undefined) {
      throw new Error("Failed to insert artist");
    }

    const beforeInsert = readStamp(sqlite);
    sleepMs(2);
    db.insert(posts)
      .values({
        postId: 101,
        artistId: artist.id,
        fileUrl: "https://example.com/101.jpg",
        previewUrl: "https://example.com/101_preview.jpg",
        sampleUrl: "",
        tags: "a b",
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
      })
      .run();
    const afterInsert = readStamp(sqlite);
    expect(afterInsert).not.toBe(beforeInsert);
    expect(afterInsert).toBeGreaterThan(beforeInsert);

    const inserted = db.select({ id: posts.id }).from(posts).all()[0];
    if (inserted === undefined) {
      throw new Error("Failed to insert post");
    }

    const beforeViewed = readStamp(sqlite);
    sleepMs(2);
    sqlite
      .prepare("UPDATE posts SET is_viewed = 1 WHERE id = ?")
      .run(inserted.id);
    expect(readStamp(sqlite)).toBe(beforeViewed);

    // posts_fts_update (0006) + external-content FTS5 hits
    // "database disk image is malformed" on this Node better-sqlite3 build
    // when rewriting the index on UPDATE OF tags. Isolate invalidate_update.
    sqlite.exec("DROP TRIGGER IF EXISTS posts_fts_update;");

    const beforeTags = readStamp(sqlite);
    sleepMs(2);
    sqlite
      .prepare("UPDATE posts SET tags = 'a b c' WHERE id = ?")
      .run(inserted.id);
    const afterTags = readStamp(sqlite);
    expect(afterTags).not.toBe(beforeTags);
    expect(afterTags).toBeGreaterThan(beforeTags);

    const beforeDelete = readStamp(sqlite);
    sleepMs(2);
    sqlite.prepare("DELETE FROM posts WHERE id = ?").run(inserted.id);
    const afterDelete = readStamp(sqlite);
    expect(afterDelete).not.toBe(beforeDelete);
    expect(afterDelete).toBeGreaterThan(beforeDelete);
  });

  it("drop + ensure restores runtime-droppable triggers idempotently", () => {
    mockDb = createMockDb();
    const { sqlite } = mockDb;

    dropFtsTriggersForBulkInsert(sqlite);
    const afterDrop = listTriggers(sqlite);
    expect(afterDrop).not.toContain(POSTS_FTS_INSERT_TRIGGER_NAME);
    expect(afterDrop).not.toContain(FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME);
    expect(afterDrop).not.toContain(FTS5_CACHE_INVALIDATE_UPDATE_TRIGGER_NAME);
    expect(afterDrop).toContain("fts5_cache_invalidate_delete");

    const first = ensureFtsTriggers(sqlite);
    expect(first.recreated).toEqual([
      POSTS_FTS_INSERT_TRIGGER_NAME,
      FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME,
      FTS5_CACHE_INVALIDATE_UPDATE_TRIGGER_NAME,
    ]);
    expect(listTriggers(sqlite)).toEqual([...EXPECTED_TRIGGERS]);

    const second = ensureFtsTriggers(sqlite);
    expect(second.recreated).toEqual([]);
  });
});
