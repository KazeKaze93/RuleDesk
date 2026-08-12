-- Defensive cleanup only.
--
-- Migrations 0010 / 0011 declared count and stamp-invalidation triggers
-- ON posts_fts (virtual FTS5). SQLite rejects CREATE TRIGGER on virtual
-- tables, so those objects never existed in normal installs. A brief
-- attempt to recreate invalidate triggers ON posts was abandoned: the
-- only consumer was an in-memory FTS count cache, which is replaced by
-- SELECT 1 FROM posts_fts LIMIT 1 (empty-guard). Tables fts5_count_meta
-- and fts5_cache_invalidation stay for downgrade safety but are unused.
--
-- DROP any of the five dead trigger names if they somehow exist.

DROP TRIGGER IF EXISTS fts5_cache_invalidate_insert;
DROP TRIGGER IF EXISTS fts5_cache_invalidate_update;
DROP TRIGGER IF EXISTS fts5_cache_invalidate_delete;
DROP TRIGGER IF EXISTS fts5_count_increment_insert;
DROP TRIGGER IF EXISTS fts5_count_decrement_delete;
