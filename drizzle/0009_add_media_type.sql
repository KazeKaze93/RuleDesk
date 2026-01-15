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

-- Backfill existing data: determine media_type from fileUrl extension
-- Videos: .mp4, .webm, .mov (case-insensitive)
-- Images: everything else
-- CRITICAL: Use LIKE '%.ext' (not '%.ext%') to match only files ending with extension
-- This prevents false positives like "video.mp4.backup.jpg" being marked as video
--
-- PERFORMANCE NOTE: For large databases (100k+ records), this UPDATE may block the database
-- during migration. Consider chunked updates in a background process after app startup:
--   UPDATE posts SET media_type = ... WHERE media_type IS NULL LIMIT 1000;
--   (Repeat until no rows affected)
-- For typical databases (< 50k records), this single UPDATE is acceptable.
UPDATE `posts`
SET `media_type` = CASE
  WHEN LOWER(`file_url`) LIKE '%.mp4' OR 
       LOWER(`file_url`) LIKE '%.webm' OR 
       LOWER(`file_url`) LIKE '%.mov' 
  THEN 'video'
  ELSE 'image'
END
WHERE `media_type` IS NULL;
