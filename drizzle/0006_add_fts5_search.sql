-- FTS5 Full Text Search Migration
-- Creates virtual table for fast tag searching and triggers to keep it in sync

-- CRITICAL: This migration assumes posts.id is INTEGER PRIMARY KEY (rowid alias)
-- In SQLite, INTEGER PRIMARY KEY is a synonym for rowid, which FTS5 requires
-- If posts.id were UUID or TEXT, this migration would fail
-- Verify: posts.id is defined as "integer PRIMARY KEY AUTOINCREMENT" in schema

-- Create FTS5 virtual table as external content table
-- Using content='posts' makes FTS5 reference the main table instead of duplicating data
-- This saves storage space: FTS5 stores only the index, tags data comes from posts table
-- content_rowid='id' maps posts.id to FTS5 rowid (required for external content)
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  tags,                    -- Index tags column for full-text search
  content='posts',         -- Reference main posts table (no data duplication)
  content_rowid='id'        -- Map posts.id to FTS5 rowid
);

-- Trigger: INSERT - Populate FTS index when new post is inserted
-- For external content tables, we insert rowid + tags to build the index
-- FTS5 doesn't store a copy of tags (saves space), but needs tags for index construction
-- Uses posts.id directly as it is INTEGER PRIMARY KEY (rowid alias)
CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;

-- Trigger: UPDATE - Update FTS index when post tags are modified
-- For FTS5 external content, DELETE + INSERT is required (UPDATE doesn't work)
-- Uses posts.id directly as it is INTEGER PRIMARY KEY (rowid alias)
CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE OF tags ON posts BEGIN
  DELETE FROM posts_fts WHERE rowid = old.id;
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;

-- Trigger: DELETE - Remove from FTS index when post is deleted
-- Uses posts.id directly as it is INTEGER PRIMARY KEY (rowid alias)
CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
  DELETE FROM posts_fts WHERE rowid = old.id;
END;

-- Populate FTS5 index with existing posts data
-- This ensures existing posts are searchable immediately after migration
-- For external content, we still need to insert rowid + tags to build the index
-- Uses posts.id directly as it is INTEGER PRIMARY KEY (rowid alias)
INSERT INTO posts_fts(rowid, tags)
SELECT id, tags FROM posts;

