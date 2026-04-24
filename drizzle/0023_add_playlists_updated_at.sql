ALTER TABLE playlists ADD COLUMN updated_at integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS playlists_updatedAt_idx ON playlists(updated_at);
UPDATE playlists
SET updated_at = created_at
WHERE updated_at = 0;
