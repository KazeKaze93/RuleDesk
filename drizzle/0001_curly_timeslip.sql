CREATE INDEX `name_idx` ON `artists` (`name`);--> statement-breakpoint
CREATE INDEX `artist_id_idx` ON `posts` (`artist_id`);--> statement-breakpoint
CREATE INDEX `published_at_idx` ON `posts` (`published_at`);--> statement-breakpoint
CREATE INDEX `is_viewed_idx` ON `posts` (`is_viewed`);