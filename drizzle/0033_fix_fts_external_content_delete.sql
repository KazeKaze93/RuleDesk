-- Fix FTS5 external-content UPDATE/DELETE triggers.
--
-- Migration 0006 declared posts_fts_update / posts_fts_delete with
-- ordinary DELETE FROM posts_fts WHERE rowid = .... On an FTS5 table
-- created with content='posts', that bypasses the segment-delete protocol
-- SQLite expects and physically corrupts the database file
-- (SqliteError: database disk image is malformed). Confirmed on
-- better-sqlite3 12.5.0 / SQLite 3.51.1 (msvc-1944): necessary and
-- sufficient condition is a live posts_fts_update + UPDATE OF tags —
-- independent of mmap_size and batch size (single-row reproduces it).
--
-- Canonical pattern (SQLite fts5.html, "External Content Tables" /
-- delete command): remove index rows with
--   INSERT INTO posts_fts(posts_fts, rowid, tags) VALUES('delete', ...);
-- then re-insert for updates. Never DELETE FROM an external-content FTS5
-- table.
--
-- Companion constraint: do not fire this 'delete' command for a rowid that
-- was never inserted into the index (bulk sync drops posts_fts_insert AND
-- posts_fts_update together for that reason). Also never use
-- NOT IN (SELECT rowid FROM posts_fts) to find missing index rows — without
-- MATCH, that SELECT passes through to posts.
--
-- 0006 is not edited (historical). This migration replaces the two
-- broken triggers in place.

DROP TRIGGER IF EXISTS posts_fts_update;
DROP TRIGGER IF EXISTS posts_fts_delete;

CREATE TRIGGER posts_fts_update AFTER UPDATE OF tags ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, tags) VALUES('delete', old.id, old.tags);
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;

CREATE TRIGGER posts_fts_delete AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, tags) VALUES('delete', old.id, old.tags);
END;
