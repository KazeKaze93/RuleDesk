CREATE TABLE IF NOT EXISTS tag_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag TEXT NOT NULL UNIQUE,
  -- Units: Unix seconds (SQLite unixepoch()). Not in Drizzle schema — keep raw SQL in seconds.
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blacklist_tag
  ON tag_blacklist(tag);
