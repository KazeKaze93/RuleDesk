-- Fix FTS cache invalidation triggers: declare them ON posts (content table),
-- not ON posts_fts. SQLite forbids CREATE TRIGGER on virtual FTS5 tables
-- (SQLITE_ERROR: cannot create triggers on virtual tables), so migration
-- 0010 never successfully created fts5_cache_invalidate_* in any database.
--
-- posts_fts is an external-content FTS5 table (content='posts'); every index
-- change is driven by posts mutations. Invalidate the stamp at that source.

DROP TRIGGER IF EXISTS fts5_cache_invalidate_insert;
DROP TRIGGER IF EXISTS fts5_cache_invalidate_update;
DROP TRIGGER IF EXISTS fts5_cache_invalidate_delete;

-- Ensure singleton stamp row exists (UPDATE triggers are no-ops without it).
-- Units: milliseconds (julianday → epoch ms); must match 0010 / PlaylistController.
INSERT OR IGNORE INTO fts5_cache_invalidation (id, invalidated_at)
VALUES (1, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));

CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_insert
AFTER INSERT ON posts BEGIN
  UPDATE fts5_cache_invalidation
  SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
  WHERE id = 1;
END;

-- Any posts row change (not only tags) may affect FTS count consumers.
CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_update
AFTER UPDATE ON posts BEGIN
  UPDATE fts5_cache_invalidation
  SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
  WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_delete
AFTER DELETE ON posts BEGIN
  UPDATE fts5_cache_invalidation
  SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
  WHERE id = 1;
END;
