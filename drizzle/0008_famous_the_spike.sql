CREATE TABLE IF NOT EXISTS `playlist_entries` (
	`playlist_id` integer NOT NULL,
	`post_id` integer NOT NULL,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`playlist_id`, `post_id`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `playlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_smart` integer DEFAULT false NOT NULL,
	`query_json` text DEFAULT '',
	`icon_name` text DEFAULT '',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `playlist_entries_playlist_id_idx` ON `playlist_entries` (`playlist_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `playlist_entries_post_id_idx` ON `playlist_entries` (`post_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `playlist_entries_playlist_post_idx` ON `playlist_entries` (`playlist_id`,`post_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `playlist_entries_added_at_idx` ON `playlist_entries` (`added_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `playlists_createdAt_idx` ON `playlists` (`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `playlists_isSmart_idx` ON `playlists` (`is_smart`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `posts_artist_media_type_idx` ON `posts` (`artist_id`,`media_type`);
