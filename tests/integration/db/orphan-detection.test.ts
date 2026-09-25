import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensureDrizzleMigrationsTable,
  readMigrationJournal,
  runManualMigrations,
} from "@/main/db/migration-runner";
import { detectOrphans } from "@/main/db/orphan-detection";
import { EXTERNAL_ARTIST_ID } from "@/shared/constants";

const PROJECT_DRIZZLE = path.resolve(process.cwd(), "drizzle");

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function migrateFresh(sqlite: InstanceType<typeof Database>): void {
  const entries = readMigrationJournal(PROJECT_DRIZZLE);
  expect(entries).not.toBeNull();
  if (!entries) {
    throw new Error("journal missing");
  }
  ensureDrizzleMigrationsTable(sqlite);
  runManualMigrations(sqlite, PROJECT_DRIZZLE, entries);
}

/** better-sqlite3 defaults foreign_keys=ON; orphans only exist when constraints were off or bypassed. */
function allowOrphanInserts(sqlite: InstanceType<typeof Database>): void {
  sqlite.pragma("foreign_keys = OFF");
}

function insertArtist(
  sqlite: InstanceType<typeof Database>,
  id: number,
  name: string
): void {
  sqlite
    .prepare(
      `INSERT INTO artists (id, name, tag, type, api_endpoint, created_at)
       VALUES (?, ?, ?, 'tag', '', unixepoch())`
    )
    .run(id, name, `tag_${name}`);
}

function insertPost(
  sqlite: InstanceType<typeof Database>,
  params: {
    id: number;
    postId: number;
    artistId: number;
    tags?: string;
  }
): void {
  sqlite
    .prepare(
      `INSERT INTO posts (
         id, post_id, artist_id, file_url, preview_url, sample_url,
         tags, published_at, created_at, is_viewed, view_count, is_favorited
       ) VALUES (?, ?, ?, 'f', 'p', '', ?, unixepoch(), unixepoch(), 0, 0, 0)`
    )
    .run(params.id, params.postId, params.artistId, params.tags ?? "tag_a");
}

/**
 * Stable content fingerprint of application tables (order-independent counts +
 * ordered dumps of key tables). Used to prove detectOrphans is read-only.
 */
function contentFingerprint(sqlite: InstanceType<typeof Database>): string {
  const tables = [
    "artists",
    "posts",
    "playlists",
    "playlist_entries",
    "settings",
    "__drizzle_migrations",
  ];
  const parts: string[] = [];
  for (const table of tables) {
    const exists = sqlite
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1"
      )
      .get(table);
    if (!exists) {
      parts.push(`${table}:missing`);
      continue;
    }
    const countRaw: unknown = sqlite
      .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
      .get();
    if (
      typeof countRaw !== "object" ||
      countRaw === null ||
      !("count" in countRaw) ||
      typeof countRaw.count !== "number"
    ) {
      throw new Error(`unexpected count row for ${table}`);
    }
    parts.push(`${table}:count=${countRaw.count}`);
    const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
    parts.push(`${table}:rows=${JSON.stringify(rows)}`);
  }
  if (
    sqlite
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='posts_fts_docsize' LIMIT 1"
      )
      .get()
  ) {
    const docs = sqlite.prepare("SELECT id FROM posts_fts_docsize ORDER BY id").all();
    parts.push(`posts_fts_docsize=${JSON.stringify(docs)}`);
  }
  return parts.join("\n");
}

describe("orphan detection (read-only)", () => {
  const tempDirs: string[] = [];
  const openDbs: InstanceType<typeof Database>[] = [];

  afterEach(() => {
    for (const db of openDbs.splice(0)) {
      try {
        db.close();
      } catch {
        // ignore
      }
    }
    for (const dir of tempDirs.splice(0)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  it("returns zeros on a clean migrated database", () => {
    const tempDir = createTempDir("ruledesk-orphan-clean-");
    tempDirs.push(tempDir);
    const sqlite = new Database(path.join(tempDir, "data.bin"));
    openDbs.push(sqlite);
    migrateFresh(sqlite);

    insertArtist(sqlite, 1, "real");
    insertPost(sqlite, { id: 10, postId: 100, artistId: 1 });

    const report = detectOrphans(sqlite);
    expect(report.orphanedPostsCount).toBe(0);
    expect(report.orphanedPostIdsSample).toEqual([]);
    expect(report.orphanedPlaylistEntriesCount).toBe(0);
    expect(report.orphanedPlaylistEntrySamples).toEqual([]);
    expect(report.ftsRowsWithoutPostCount).toBe(0);
    expect(report.ghostArtistIds).toEqual([]);
    expect(report.postsPerGhostArtist).toEqual([]);
  });

  it("detects a post with a missing artist_id (raw integrity break)", () => {
    const tempDir = createTempDir("ruledesk-orphan-post-");
    tempDirs.push(tempDir);
    const sqlite = new Database(path.join(tempDir, "data.bin"));
    openDbs.push(sqlite);
    migrateFresh(sqlite);

    insertArtist(sqlite, 1, "kept");
    insertPost(sqlite, { id: 10, postId: 100, artistId: 1 });
    // Bypass app + FK: insert post pointing at a non-existent artist.
    allowOrphanInserts(sqlite);
    insertPost(sqlite, { id: 11, postId: 101, artistId: 999 });

    const report = detectOrphans(sqlite);
    expect(report.orphanedPostsCount).toBe(1);
    expect(report.orphanedPostIdsSample).toEqual([11]);
    expect(report.ghostArtistIds).toEqual([999]);
    expect(report.postsPerGhostArtist).toEqual([
      { artistId: 999, postCount: 1 },
    ]);
  });

  it("does not treat EXTERNAL_ARTIST_ID posts as orphans when artist row is missing", () => {
    const tempDir = createTempDir("ruledesk-orphan-external-");
    tempDirs.push(tempDir);
    const sqlite = new Database(path.join(tempDir, "data.bin"));
    openDbs.push(sqlite);
    migrateFresh(sqlite);

    // Intentionally no artists row for EXTERNAL_ARTIST_ID — design allows
    // external Browse posts to use this sentinel; deleteArtist refuses to
    // remove it when the row exists.
    allowOrphanInserts(sqlite);
    insertPost(sqlite, {
      id: 20,
      postId: 200,
      artistId: EXTERNAL_ARTIST_ID,
    });
    insertPost(sqlite, { id: 21, postId: 201, artistId: 777 });

    const report = detectOrphans(sqlite);
    expect(report.orphanedPostsCount).toBe(1);
    expect(report.orphanedPostIdsSample).toEqual([21]);
    expect(report.ghostArtistIds).toEqual([777]);
    expect(report.orphanedPostIdsSample).not.toContain(20);
  });

  it("detects playlist_entries whose post_id is missing", () => {
    const tempDir = createTempDir("ruledesk-orphan-playlist-");
    tempDirs.push(tempDir);
    const sqlite = new Database(path.join(tempDir, "data.bin"));
    openDbs.push(sqlite);
    migrateFresh(sqlite);

    insertArtist(sqlite, 1, "a");
    insertPost(sqlite, { id: 10, postId: 100, artistId: 1 });
    sqlite
      .prepare(
        `INSERT INTO playlists (id, name, is_smart, query_schema_version, created_at, updated_at)
         VALUES (1, 'p', 0, 1, unixepoch(), unixepoch())`
      )
      .run();
    sqlite
      .prepare(
        `INSERT INTO playlist_entries (playlist_id, post_id, added_at, position)
         VALUES (1, 10, unixepoch(), 0)`
      )
      .run();
    // Orphan entry: post 999 never existed. App has no post-delete path;
    // raw SQL with FK off simulates a manually broken DB.
    allowOrphanInserts(sqlite);
    sqlite
      .prepare(
        `INSERT INTO playlist_entries (playlist_id, post_id, added_at, position)
         VALUES (1, 999, unixepoch(), 1)`
      )
      .run();

    const report = detectOrphans(sqlite);
    expect(report.orphanedPlaylistEntriesCount).toBe(1);
    expect(report.orphanedPlaylistEntrySamples).toEqual([
      { playlistId: 1, postId: 999 },
    ]);
  });

  it("detects FTS docsize rows without a matching post", () => {
    const tempDir = createTempDir("ruledesk-orphan-fts-");
    tempDirs.push(tempDir);
    const sqlite = new Database(path.join(tempDir, "data.bin"));
    openDbs.push(sqlite);
    migrateFresh(sqlite);

    insertArtist(sqlite, 1, "a");
    insertPost(sqlite, { id: 10, postId: 100, artistId: 1, tags: "hello" });

    // Drop delete trigger so deleting the post leaves the FTS index behind.
    sqlite.exec("DROP TRIGGER IF EXISTS posts_fts_delete;");
    sqlite.prepare("DELETE FROM posts WHERE id = 10").run();

    const report = detectOrphans(sqlite);
    expect(report.ftsRowsWithoutPostCount).toBeGreaterThanOrEqual(1);
  });

  it("does not mutate any application table content", () => {
    const tempDir = createTempDir("ruledesk-orphan-immutable-");
    tempDirs.push(tempDir);
    const sqlite = new Database(path.join(tempDir, "data.bin"));
    openDbs.push(sqlite);
    migrateFresh(sqlite);

    insertArtist(sqlite, 1, "a");
    insertPost(sqlite, { id: 10, postId: 100, artistId: 1 });
    allowOrphanInserts(sqlite);
    insertPost(sqlite, { id: 11, postId: 101, artistId: 999 });

    const before = contentFingerprint(sqlite);
    detectOrphans(sqlite);
    const after = contentFingerprint(sqlite);
    expect(after).toBe(before);
  });
});
