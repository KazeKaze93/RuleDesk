-- Add download behavior settings
-- duplicate_file_behavior: 'skip' | 'overwrite' - what to do when file exists
-- download_folder_structure: 'flat' | '{artist_id}' - subfolder structure
ALTER TABLE settings ADD COLUMN duplicate_file_behavior text DEFAULT 'skip';
ALTER TABLE settings ADD COLUMN download_folder_structure text DEFAULT 'flat';
