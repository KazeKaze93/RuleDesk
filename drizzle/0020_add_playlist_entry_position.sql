ALTER TABLE playlist_entries ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Initialize positions based on current addedAt order
UPDATE playlist_entries
SET position = (
  SELECT COUNT(*)
  FROM playlist_entries pe2
  WHERE pe2.playlist_id = playlist_entries.playlist_id
    AND pe2.added_at <= playlist_entries.added_at
) - 1;
