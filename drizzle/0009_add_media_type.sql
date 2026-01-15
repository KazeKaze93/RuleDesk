-- Add media_type column to posts table for efficient filtering
-- Replaces slow LIKE "%...%" queries with indexed column lookups
-- This migration adds the column, creates index, and backfills existing data

-- Add media_type column (nullable initially, will be populated)
ALTER TABLE `posts` ADD COLUMN `media_type` text;

-- NOTE: SQLite does not support adding CHECK constraints via ALTER TABLE.
-- CHECK constraints can only be added during CREATE TABLE.
-- Data integrity is enforced at application level via Zod schemas and TypeScript types.

-- Create index for efficient filtering by media type
CREATE INDEX IF NOT EXISTS `posts_media_type_idx` ON `posts` (`media_type`);

-- NOTE: Data backfill is NOT performed in this migration to prevent Main Process blocking.
-- For large databases (100k+ records), UPDATE would block SQLite and cause app freeze.
-- 
-- Backfill must be done in background after app startup:
-- 1. Migration only adds column (fast, non-blocking)
-- 2. Background process updates media_type in chunks (e.g., 1000 rows per batch)
-- 3. Use: UPDATE posts SET media_type = ... WHERE id IN (SELECT id FROM posts WHERE media_type IS NULL LIMIT 1000);
--
-- See: src/main/db/backfill-media-type.ts (to be implemented)
