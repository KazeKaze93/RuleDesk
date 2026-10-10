CREATE INDEX IF NOT EXISTS `posts_artist_published_at_idx` ON `posts` (`artist_id`, `published_at`);
