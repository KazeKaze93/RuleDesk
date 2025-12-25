-- Expression index for COALESCE(lastChecked, createdAt) DESC
-- This index is critical for performance when sorting artists by lastChecked/createdAt
-- Without this index, SQLite performs full table scan on every query
-- SQLite 3.9+ supports expression indexes
CREATE INDEX IF NOT EXISTS artists_sort_idx ON artists(COALESCE(last_checked, created_at) DESC);

