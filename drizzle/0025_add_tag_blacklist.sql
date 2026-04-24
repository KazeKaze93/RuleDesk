CREATE TABLE IF NOT EXISTS tag_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blacklist_tag
  ON tag_blacklist(tag);
