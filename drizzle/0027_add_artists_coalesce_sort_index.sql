CREATE INDEX IF NOT EXISTS artists_last_checked_or_created_idx
  ON artists(COALESCE(last_checked, created_at) DESC);
