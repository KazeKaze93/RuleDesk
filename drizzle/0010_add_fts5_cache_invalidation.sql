-- FTS5 Cache Invalidation Migration
-- Adds mechanism to track when FTS5 table changes, allowing Main process to invalidate cache
-- This ensures fts5CountCache in PlaylistController stays accurate even if posts are added
-- through other controllers or direct database operations

-- Create table to track FTS5 cache invalidation timestamp
-- This table has a single row that is updated whenever posts_fts changes
-- Main process checks this timestamp before using cached count
CREATE TABLE IF NOT EXISTS fts5_cache_invalidation (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- Single row constraint
  invalidated_at INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))  -- Timestamp in milliseconds
);

-- Initialize the single row if it doesn't exist
-- Units: milliseconds (julianday → epoch ms); must match Date.now() cache stamps in PlaylistController.
INSERT OR IGNORE INTO fts5_cache_invalidation (id, invalidated_at) 
VALUES (1, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));

-- Trigger: INSERT - Invalidate cache when new post is inserted into posts_fts
-- This trigger fires AFTER posts_fts_insert, ensuring FTS5 index is updated first
-- Units: milliseconds (same julianday formula as column DEFAULT).
CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_insert 
AFTER INSERT ON posts_fts BEGIN
  UPDATE fts5_cache_invalidation 
  SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
  WHERE id = 1;
END;

-- Trigger: UPDATE - Invalidate cache when post is updated in posts_fts
-- This trigger fires AFTER posts_fts_update, ensuring FTS5 index is updated first
-- Units: milliseconds (same julianday formula as column DEFAULT).
CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_update 
AFTER UPDATE ON posts_fts BEGIN
  UPDATE fts5_cache_invalidation 
  SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
  WHERE id = 1;
END;

-- Trigger: DELETE - Invalidate cache when post is deleted from posts_fts
-- This trigger fires AFTER posts_fts_delete, ensuring FTS5 index is updated first
-- Units: milliseconds (same julianday formula as column DEFAULT).
CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_delete 
AFTER DELETE ON posts_fts BEGIN
  UPDATE fts5_cache_invalidation 
  SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
  WHERE id = 1;
END;
