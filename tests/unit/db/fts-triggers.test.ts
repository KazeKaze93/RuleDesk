import { describe, it, expect, afterEach } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { artists, posts } from "../../../src/main/db/schema";
import {
  POSTS_FTS_INSERT_TRIGGER_NAME,
  POSTS_FTS_UPDATE_TRIGGER_NAME,
  areRuntimeDroppableFtsTriggersPresent,
  backfillArtistFtsIndex,
  dropFtsTriggersForBulkInsert,
  ensureFtsTriggers,
} from "../../../src/main/db/fts-triggers";

const EXPECTED_TRIGGERS = [
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

function integrityOk(
  sqlite: ReturnType<typeof createMockDb>["sqlite"]
): boolean {
  const rows = sqlite.pragma("integrity_check") as Array<{
    integrity_check: string;
  }>;
  return rows.length === 1 && rows[0].integrity_check === "ok";
}

function triggerSql(
  sqlite: ReturnType<typeof createMockDb>["sqlite"],
  name: string
): string {
  const row = sqlite
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = ?"
    )
    .get(name) as { sql: string } | undefined;
  if (row === undefined) {
    throw new Error(`Trigger ${name} missing`);
  }
  return row.sql;
}

function seedArtist(
  db: ReturnType<typeof createMockDb>["db"]
): number {
  db.insert(artists)
    .values({
      name: "FTS Trigger Artist",
      tag: "fts_trigger_artist",
      provider: "rule34",
      type: "tag",
      apiEndpoint: "https://api.rule34.xxx/",
    })
    .run();
  const artist = db.select({ id: artists.id }).from(artists).all()[0];
  if (artist === undefined) {
    throw new Error("Failed to insert artist");
  }
  return artist.id;
}

describe("FTS triggers (posts content table)", () => {
  let mockDb: ReturnType<typeof createMockDb> | null = null;

  afterEach(() => {
    try {
      mockDb?.sqlite.close();
    } catch {
      // ignore
    }
    mockDb = null;
  });

  it("applies migrations with posts_fts_* triggers only (no dead count/stamp triggers)", () => {
    mockDb = createMockDb();
    expect(listTriggers(mockDb.sqlite)).toEqual([...EXPECTED_TRIGGERS]);
  });

  it("0033 update/delete triggers use FTS5 delete command, not DELETE FROM", () => {
    mockDb = createMockDb();
    const updateSql = triggerSql(mockDb.sqlite, "posts_fts_update");
    const deleteSql = triggerSql(mockDb.sqlite, "posts_fts_delete");
    expect(updateSql).toContain(
      "INSERT INTO posts_fts(posts_fts, rowid, tags) VALUES('delete'"
    );
    expect(deleteSql).toContain(
      "INSERT INTO posts_fts(posts_fts, rowid, tags) VALUES('delete'"
    );
    expect(updateSql.toLowerCase()).not.toContain("delete from posts_fts");
    expect(deleteSql.toLowerCase()).not.toContain("delete from posts_fts");
  });

  it("drop + ensure restores posts_fts_insert and posts_fts_update idempotently", () => {
    mockDb = createMockDb();
    const { sqlite } = mockDb;

    expect(areRuntimeDroppableFtsTriggersPresent(sqlite)).toBe(true);

    dropFtsTriggersForBulkInsert(sqlite);
    const afterDrop = listTriggers(sqlite);
    expect(afterDrop).not.toContain(POSTS_FTS_INSERT_TRIGGER_NAME);
    expect(afterDrop).not.toContain(POSTS_FTS_UPDATE_TRIGGER_NAME);
    expect(afterDrop).toContain("posts_fts_delete");
    expect(areRuntimeDroppableFtsTriggersPresent(sqlite)).toBe(false);

    const first = ensureFtsTriggers(sqlite);
    expect(first.recreated).toEqual([
      POSTS_FTS_INSERT_TRIGGER_NAME,
      POSTS_FTS_UPDATE_TRIGGER_NAME,
    ]);
    expect(listTriggers(sqlite)).toEqual([...EXPECTED_TRIGGERS]);
    expect(areRuntimeDroppableFtsTriggersPresent(sqlite)).toBe(true);

    const second = ensureFtsTriggers(sqlite);
    expect(second.recreated).toEqual([]);
  });

  it("bulk path: drop triggers, upsert conflicts, backfill without NOT IN, then DELETE ok", () => {
    mockDb = createMockDb();
    const { db, sqlite } = mockDb;
    const artistId = seedArtist(db);

    dropFtsTriggersForBulkInsert(sqlite);

    const upsert = sqlite.prepare(`
      INSERT INTO posts (
        post_id, artist_id, file_url, preview_url, sample_url, tags, rating,
        media_type, published_at, created_at
      ) VALUES (?, ?, ?, ?, '', ?, 's', 'image', unixepoch(), unixepoch())
      ON CONFLICT(artist_id, post_id) DO UPDATE SET tags = excluded.tags
    `);

    sqlite.transaction(() => {
      for (let i = 1; i <= 20; i += 1) {
        upsert.run(
          i,
          artistId,
          `https://example.com/${i}.jpg`,
          `https://example.com/${i}_p.jpg`,
          `seed_${i}`
        );
      }
    })();

    sqlite.transaction(() => {
      for (let i = 1; i <= 20; i += 1) {
        upsert.run(
          i,
          artistId,
          `https://example.com/${i}.jpg`,
          `https://example.com/${i}_p.jpg`,
          `conflict_${i}`
        );
      }
    })();

    expect(integrityOk(sqlite)).toBe(true);

    // Bare SELECT on external-content FTS is content passthrough — NOT IN is a no-op.
    const phantomCount = (
      sqlite
        .prepare("SELECT COUNT(*) AS c FROM posts_fts")
        .get() as { c: number }
    ).c;
    const postsCount = (
      sqlite.prepare("SELECT COUNT(*) AS c FROM posts").get() as { c: number }
    ).c;
    expect(phantomCount).toBe(postsCount);
    expect(
      (
        sqlite
          .prepare(
            `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'conflict_1'`
          )
          .get() as { c: number }
      ).c
    ).toBe(0);

    backfillArtistFtsIndex(sqlite, artistId);
    ensureFtsTriggers(sqlite);

    expect(
      (
        sqlite
          .prepare(
            `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'conflict_1'`
          )
          .get() as { c: number }
      ).c
    ).toBeGreaterThan(0);

    sqlite.prepare("DELETE FROM posts WHERE artist_id = ?").run(artistId);
    expect(integrityOk(sqlite)).toBe(true);
  });

  it("repair path: already-indexed row survives conflict + backfillArtistFtsIndex", () => {
    mockDb = createMockDb();
    const { db, sqlite } = mockDb;
    const artistId = seedArtist(db);

    db.insert(posts)
      .values({
        postId: 303,
        artistId,
        fileUrl: "https://example.com/303.jpg",
        previewUrl: "https://example.com/303_preview.jpg",
        sampleUrl: "",
        tags: "old_tag",
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-03T00:00:00.000Z"),
      })
      .run();

    const postRow = sqlite
      .prepare("SELECT id FROM posts WHERE post_id = 303")
      .get() as { id: number };
    const rowid = postRow.id;

    expect(
      (
        sqlite
          .prepare(
            `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'old_tag'`
          )
          .get() as { c: number }
      ).c
    ).toBe(1);

    dropFtsTriggersForBulkInsert(sqlite);

    sqlite
      .prepare(
        `
        INSERT INTO posts (
          post_id, artist_id, file_url, preview_url, sample_url, tags, rating,
          media_type, published_at, created_at
        ) VALUES (303, ?, 'https://example.com/303.jpg', 'https://example.com/303_preview.jpg',
                  '', 'new_tag', 's', 'image', unixepoch(), unixepoch())
        ON CONFLICT(artist_id, post_id) DO UPDATE SET tags = excluded.tags
      `
      )
      .run(artistId);

    // Content updated; index still has old_tag until backfill.
    expect(
      (
        sqlite.prepare("SELECT tags FROM posts WHERE id = ?").get(rowid) as {
          tags: string;
        }
      ).tags
    ).toBe("new_tag");

    backfillArtistFtsIndex(sqlite, artistId);
    ensureFtsTriggers(sqlite);

    const integrity = sqlite.pragma("integrity_check") as Array<{
      integrity_check: string;
    }>;
    const matchNew = (
      sqlite
        .prepare(
          `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'new_tag'`
        )
        .get() as { c: number }
    ).c;
    const matchOld = (
      sqlite
        .prepare(
          `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'old_tag'`
        )
        .get() as { c: number }
    ).c;
    // Bare SELECT on external-content FTS is content passthrough — still assert
    // as a DoD probe; MATCH counts are the real index signal.
    const bareRowidCount = (
      sqlite
        .prepare("SELECT COUNT(*) AS c FROM posts_fts WHERE rowid = ?")
        .get(rowid) as { c: number }
    ).c;

    expect(integrity).toEqual([{ integrity_check: "ok" }]);
    expect(matchNew).toBe(1);
    expect(matchOld).toBe(0);
    expect(bareRowidCount).toBe(1);
  });

  it("repeated UPDATE OF tags keeps integrity_check ok and reindexes FTS", () => {
    mockDb = createMockDb();
    const { db, sqlite } = mockDb;
    const artistId = seedArtist(db);

    db.insert(posts)
      .values({
        postId: 101,
        artistId,
        fileUrl: "https://example.com/101.jpg",
        previewUrl: "https://example.com/101_preview.jpg",
        sampleUrl: "",
        tags: "old_tag alpha",
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
      })
      .run();

    for (let i = 1; i <= 10; i += 1) {
      sqlite
        .prepare("UPDATE posts SET tags = ? WHERE post_id = 101")
        .run(`new_tag_${i} beta`);
      expect(integrityOk(sqlite)).toBe(true);
    }

    const finalTags = sqlite
      .prepare("SELECT tags FROM posts WHERE post_id = 101")
      .get() as { tags: string };
    expect(finalTags.tags).toBe("new_tag_10 beta");

    const matchNew = sqlite
      .prepare(
        `SELECT p.post_id FROM posts p
         WHERE EXISTS (
           SELECT 1 FROM posts_fts
           WHERE posts_fts.rowid = p.id AND posts_fts MATCH 'new_tag_10'
         )`
      )
      .all() as Array<{ post_id: number }>;
    expect(matchNew.map((row) => row.post_id)).toEqual([101]);

    const matchOld = sqlite
      .prepare(
        `SELECT p.post_id FROM posts p
         WHERE EXISTS (
           SELECT 1 FROM posts_fts
           WHERE posts_fts.rowid = p.id AND posts_fts MATCH 'old_tag'
         )`
      )
      .all() as Array<{ post_id: number }>;
    expect(matchOld).toEqual([]);
  });

  it("DELETE FROM posts keeps integrity_check ok and removes FTS row", () => {
    mockDb = createMockDb();
    const { db, sqlite } = mockDb;
    const artistId = seedArtist(db);

    db.insert(posts)
      .values({
        postId: 202,
        artistId,
        fileUrl: "https://example.com/202.jpg",
        previewUrl: "https://example.com/202_preview.jpg",
        sampleUrl: "",
        tags: "delete_me",
        rating: "s",
        mediaType: "image",
        publishedAt: new Date("2024-01-02T00:00:00.000Z"),
      })
      .run();

    expect(
      (
        sqlite
          .prepare(
            `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'delete_me'`
          )
          .get() as { c: number }
      ).c
    ).toBeGreaterThan(0);

    sqlite.prepare("DELETE FROM posts WHERE post_id = 202").run();
    expect(integrityOk(sqlite)).toBe(true);
    expect(
      (
        sqlite
          .prepare(
            `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'delete_me'`
          )
          .get() as { c: number }
      ).c
    ).toBe(0);
  });

  it("ON CONFLICT DO UPDATE SET tags does not corrupt (sync conflict path)", () => {
    mockDb = createMockDb();
    const { db, sqlite } = mockDb;
    const artistId = seedArtist(db);

    const upsert = sqlite.prepare(`
      INSERT INTO posts (
        post_id, artist_id, file_url, preview_url, sample_url, tags, rating,
        media_type, published_at, created_at
      ) VALUES (?, ?, ?, ?, '', ?, 's', 'image', unixepoch(), unixepoch())
      ON CONFLICT(artist_id, post_id) DO UPDATE SET tags = excluded.tags
    `);

    sqlite.transaction(() => {
      for (let i = 1; i <= 50; i += 1) {
        upsert.run(
          i,
          artistId,
          `https://example.com/${i}.jpg`,
          `https://example.com/${i}_p.jpg`,
          `seed_${i}`
        );
      }
    })();

    sqlite.transaction(() => {
      for (let i = 1; i <= 50; i += 1) {
        upsert.run(
          i,
          artistId,
          `https://example.com/${i}.jpg`,
          `https://example.com/${i}_p.jpg`,
          `conflict_${i}`
        );
      }
    })();

    expect(integrityOk(sqlite)).toBe(true);
    const matched = sqlite
      .prepare(
        `SELECT COUNT(*) AS c FROM posts_fts WHERE posts_fts MATCH 'conflict_1'`
      )
      .get() as { c: number };
    expect(matched.c).toBeGreaterThan(0);
  });
});
