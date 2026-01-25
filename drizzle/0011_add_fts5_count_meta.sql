-- FTS5 Count Meta Table Migration
-- Adds O(1) count lookup for FTS5 table to avoid blocking Main Process with COUNT(*)
-- This ensures UI remains responsive even on databases with 100k+ records

-- Create table to store FTS5 count (maintained by triggers)
-- This provides O(1) read performance instead of O(n) COUNT(*) scan
CREATE TABLE IF NOT EXISTS fts5_count_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- Single row constraint
  count INTEGER NOT NULL DEFAULT 0         -- Current count of posts_fts entries
);

-- Initialize the single row if it doesn't exist
INSERT OR IGNORE INTO fts5_count_meta (id, count) 
VALUES (1, (SELECT COUNT(*) FROM posts_fts));

-- Trigger: INSERT - Increment count when new post is inserted into posts_fts
-- This trigger fires AFTER posts_fts_insert, ensuring FTS5 index is updated first
CREATE TRIGGER IF NOT EXISTS fts5_count_increment_insert 
AFTER INSERT ON posts_fts BEGIN
  UPDATE fts5_count_meta 
  SET count = count + 1
  WHERE id = 1;
END;

-- Trigger: DELETE - Decrement count when post is deleted from posts_fts
-- This trigger fires AFTER posts_fts_delete, ensuring FTS5 index is updated first
CREATE TRIGGER IF NOT EXISTS fts5_count_decrement_delete 
AFTER DELETE ON posts_fts BEGIN
  UPDATE fts5_count_meta 
  SET count = count - 1
  WHERE id = 1;
END;

-- Note: UPDATE trigger is not needed because FTS5 UPDATE is implemented as DELETE + INSERT
-- The DELETE trigger will decrement, and INSERT trigger will increment, maintaining correct count
