-- Add media_type column to posts table for efficient filtering
-- Replaces slow LIKE "%...%" queries with indexed column lookups
-- This migration adds the column, creates index, and backfills existing data

-- Add media_type column (nullable initially, will be populated)
ALTER TABLE `posts` ADD COLUMN `media_type` text;

-- Add CHECK constraint to enforce enum values at database level
-- This provides data integrity even if application code has bugs
ALTER TABLE `posts` ADD CONSTRAINT `posts_media_type_check` 
  CHECK (`media_type` IS NULL OR `media_type` IN ('image', 'video'));

-- Create index for efficient filtering by media type
CREATE INDEX IF NOT EXISTS `posts_media_type_idx` ON `posts` (`media_type`);

-- Backfill existing data: determine media_type from fileUrl extension
-- Videos: .mp4, .webm, .mov (case-insensitive)
-- Images: everything else
-- CRITICAL: Use LIKE '%.ext' (not '%.ext%') to match only files ending with extension
-- This prevents false positives like "video.mp4.backup.jpg" being marked as video
UPDATE `posts`
SET `media_type` = CASE
  WHEN LOWER(`file_url`) LIKE '%.mp4' OR 
       LOWER(`file_url`) LIKE '%.webm' OR 
       LOWER(`file_url`) LIKE '%.mov' 
  THEN 'video'
  ELSE 'image'
END
WHERE `media_type` IS NULL;
