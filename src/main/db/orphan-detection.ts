import type Database from "better-sqlite3";
import { EXTERNAL_ARTIST_ID } from "../../shared/constants";

/** Max IDs returned for diagnostics; totals are always exact. */
export const ORPHAN_ID_SAMPLE_LIMIT = 100;

export type GhostArtistPostCount = {
  artistId: number;
  postCount: number;
};

export type OrphanedPlaylistEntryRef = {
  playlistId: number;
  postId: number;
};

/**
 * Read-only orphan report. Detection only — never mutates the DB.
 *
 * Context: Drizzle `onDelete: "cascade"` is only enforced when SQLite
 * foreign_keys are on for the connection. Current better-sqlite3 defaults
 * FK on, but legacy DBs / past sessions can still hold orphaned posts after
 * `deleteArtist` removed only the artists row. This module only reports.
 */
export type OrphanDetectionReport = {
  orphanedPostsCount: number;
  orphanedPostIdsSample: number[];
  orphanedPlaylistEntriesCount: number;
  /** Sample of (playlist_id, post_id) — playlist_entries has a composite PK. */
  orphanedPlaylistEntrySamples: OrphanedPlaylistEntryRef[];
  ftsRowsWithoutPostCount: number;
  /** Distinct non-EXTERNAL ghost artist_ids that still have posts. */
  ghostArtistIds: number[];
  postsPerGhostArtist: GhostArtistPostCount[];
};

type SqliteDatabase = InstanceType<typeof Database>;

type CountRow = { count: number };
type IdRow = { id: number };
type PlaylistEntryRow = { playlistId: number; postId: number };
type GhostRow = { artistId: number; postCount: number };

function tableExists(sqlite: SqliteDatabase, name: string): boolean {
  return (
    sqlite
      .prepare(
        "SELECT 1 AS hit FROM sqlite_master WHERE type IN ('table', 'view') AND name = ? LIMIT 1"
      )
      .get(name) !== undefined
  );
}

function readCount(sqlite: SqliteDatabase, sql: string, params: unknown[] = []): number {
  // boundary: better-sqlite3 raw row
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const row = sqlite.prepare(sql).get(...params) as CountRow | undefined;
  return row?.count ?? 0;
}

/**
 * Run all orphan COUNTs inside one DEFERRED transaction for a consistent snapshot.
 * SELECT-only — no writes, no PRAGMA foreign_keys, no VACUUM.
 */
export function detectOrphans(sqlite: SqliteDatabase): OrphanDetectionReport {
  const run = sqlite.transaction(() => {
    const orphanedPostsCount = readCount(
      sqlite,
      `SELECT COUNT(*) AS count
       FROM posts
       LEFT JOIN artists ON artists.id = posts.artist_id
       WHERE artists.id IS NULL
         AND posts.artist_id != ?`,
      [EXTERNAL_ARTIST_ID]
    );

    const orphanedPostIdsSample = sqlite
      .prepare(
        `SELECT posts.id AS id
         FROM posts
         LEFT JOIN artists ON artists.id = posts.artist_id
         WHERE artists.id IS NULL
           AND posts.artist_id != ?
         ORDER BY posts.id
         LIMIT ?`
      )
      .all(EXTERNAL_ARTIST_ID, ORPHAN_ID_SAMPLE_LIMIT)
      // boundary: better-sqlite3 raw rows
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw rows
      .map((row) => (row as IdRow).id);

    const orphanedPlaylistEntriesCount = tableExists(sqlite, "playlist_entries")
      ? readCount(
          sqlite,
          `SELECT COUNT(*) AS count
           FROM playlist_entries
           LEFT JOIN posts ON posts.id = playlist_entries.post_id
           WHERE posts.id IS NULL`
        )
      : 0;

    const orphanedPlaylistEntrySamples = tableExists(sqlite, "playlist_entries")
      ? sqlite
          .prepare(
            `SELECT playlist_entries.playlist_id AS playlistId,
                    playlist_entries.post_id AS postId
             FROM playlist_entries
             LEFT JOIN posts ON posts.id = playlist_entries.post_id
             WHERE posts.id IS NULL
             ORDER BY playlist_entries.playlist_id, playlist_entries.post_id
             LIMIT ?`
          )
          .all(ORPHAN_ID_SAMPLE_LIMIT)
          .map((row) => {
            // boundary: better-sqlite3 raw rows
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw rows
            const typed = row as PlaylistEntryRow;
            return {
              playlistId: typed.playlistId,
              postId: typed.postId,
            };
          })
      : [];

    // External-content FTS5: SELECT FROM posts_fts without MATCH passes through
    // to posts (see migration 0033). Use posts_fts_docsize shadow table instead.
    const ftsRowsWithoutPostCount = tableExists(sqlite, "posts_fts_docsize")
      ? readCount(
          sqlite,
          `SELECT COUNT(*) AS count
           FROM posts_fts_docsize AS d
           LEFT JOIN posts AS p ON p.id = d.id
           WHERE p.id IS NULL`
        )
      : 0;

    const ghostRows = sqlite
      .prepare(
        `SELECT posts.artist_id AS artistId, COUNT(*) AS postCount
         FROM posts
         LEFT JOIN artists ON artists.id = posts.artist_id
         WHERE artists.id IS NULL
           AND posts.artist_id != ?
         GROUP BY posts.artist_id
         ORDER BY postCount DESC, posts.artist_id ASC
         LIMIT ?`
      )
      .all(EXTERNAL_ARTIST_ID, ORPHAN_ID_SAMPLE_LIMIT)
      // boundary: better-sqlite3 raw rows
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw rows
      .map((row) => row as GhostRow);

    const postsPerGhostArtist: GhostArtistPostCount[] = ghostRows.map((row) => ({
      artistId: row.artistId,
      postCount: row.postCount,
    }));
    const ghostArtistIds = postsPerGhostArtist.map((row) => row.artistId);

    return {
      orphanedPostsCount,
      orphanedPostIdsSample,
      orphanedPlaylistEntriesCount,
      orphanedPlaylistEntrySamples,
      ftsRowsWithoutPostCount,
      ghostArtistIds,
      postsPerGhostArtist,
    };
  });

  return run();
}
