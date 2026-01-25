-- Remove description column that was incorrectly added in migration 0008_famous_the_spike.sql
-- This column was added by mistake and is not part of the schema.
-- Migration 0008 should not have created this column, but it's safer to remove it here
-- rather than rewriting migration history (which would break existing databases).
ALTER TABLE `playlists` DROP COLUMN `description`;