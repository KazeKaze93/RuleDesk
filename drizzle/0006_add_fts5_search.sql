-- FTS5 Full Text Search Migration
-- Creates virtual table for fast tag searching and triggers to keep it in sync

-- Create FTS5 virtual table for posts tags
-- Using standalone FTS5 table (not content table) for simplicity and reliability
-- This stores a copy of the tags data in the FTS5 index for fast searching
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  rowid UNINDEXED,  -- Store post ID (rowid) for joining, but don't index it
  tags              -- Index tags column for full-text search
);

-- Trigger: INSERT - Populate FTS table when new post is inserted
CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;

-- Trigger: UPDATE - Update FTS table when post tags are modified
-- For FTS5, DELETE + INSERT is more reliable than UPDATE
CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE OF tags ON posts BEGIN
  DELETE FROM posts_fts WHERE rowid = old.id;
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;

-- Trigger: DELETE - Remove from FTS table when post is deleted
CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
  DELETE FROM posts_fts WHERE rowid = old.id;
END;

-- Populate FTS5 table with existing posts data
-- This ensures existing posts are searchable immediately after migration
INSERT INTO posts_fts(rowid, tags)
SELECT id, tags FROM posts;

