CREATE TABLE IF NOT EXISTS `artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tag` text NOT NULL,
	`provider` text DEFAULT 'rule34' NOT NULL,
	`type` text NOT NULL,
	`api_endpoint` text NOT NULL,
	`last_post_id` integer DEFAULT 0 NOT NULL,
	`new_posts_count` integer DEFAULT 0 NOT NULL,
	`last_checked` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`file_url` text NOT NULL,
	`preview_url` text NOT NULL,
	`sample_url` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '',
	`rating` text DEFAULT '',
	`tags` text NOT NULL,
	`published_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`is_viewed` integer DEFAULT false NOT NULL,
	`is_favorited` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text DEFAULT '',
	`encrypted_api_key` text DEFAULT '',
	`is_safe_mode` integer DEFAULT true,
	`is_adult_confirmed` integer DEFAULT false,
	`is_adult_verified` integer DEFAULT false NOT NULL,
	`tos_accepted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `artists_tag_unique` ON `artists` (`tag`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `artists_lastChecked_idx` ON `artists` (`last_checked`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `artists_createdAt_idx` ON `artists` (`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `artistIdIdx` ON `posts` (`artist_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `isViewedIdx` ON `posts` (`is_viewed`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `publishedAtIdx` ON `posts` (`published_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `isFavoritedIdx` ON `posts` (`is_favorited`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `posts_artist_id_post_id_unique` ON `posts` (`artist_id`,`post_id`);
