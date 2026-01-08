-- Tag Metadata Cache Migration
-- Creates persistent cache table for tag types to avoid redundant API calls
-- Even with 20k tags, the table size will be < 2MB

-- Create tag_metadata table
-- name: Primary key (the tag string, e.g., "jamesbron", "resident_evil")
-- type: Integer tag type (0=General, 1=Artist, 3=Copyright, 4=Character, 5=Meta)
CREATE TABLE IF NOT EXISTS `tag_metadata` (
	`name` text PRIMARY KEY NOT NULL,
	`type` integer NOT NULL
);

-- Create index on type for efficient filtering (e.g., find all artists: type=1)
-- This allows fast queries like: SELECT name FROM tag_metadata WHERE type = 1
CREATE INDEX IF NOT EXISTS `tag_metadata_type_idx` ON `tag_metadata` (`type`);


