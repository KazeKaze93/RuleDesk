CREATE TABLE `tag_metadata` (
	`name` text PRIMARY KEY NOT NULL,
	`type` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tag_metadata_type_idx` ON `tag_metadata` (`type`);--> statement-breakpoint
CREATE INDEX `postIdIdx` ON `posts` (`post_id`);--> statement-breakpoint
CREATE INDEX `posts_artist_rating_viewed_idx` ON `posts` (`artist_id`,`rating`,`is_viewed`);