-- Add default download folder setting
-- Allows users to choose a custom folder for batch downloads
ALTER TABLE settings ADD COLUMN download_folder text;
