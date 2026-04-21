ALTER TABLE posts ADD COLUMN last_viewed_at INTEGER;
ALTER TABLE posts ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
CREATE INDEX posts_last_viewed_at_idx ON posts(last_viewed_at);
