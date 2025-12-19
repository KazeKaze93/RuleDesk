CREATE TABLE `artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tag` text NOT NULL,
	`type` text NOT NULL,
	`api_endpoint` text NOT NULL,
	`last_post_id` integer DEFAULT 0 NOT NULL,
	`new_posts_count` integer DEFAULT 0 NOT NULL,
	`last_checked` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
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
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text DEFAULT '',
	`encrypted_api_key` text DEFAULT '',
	`is_safe_mode` integer DEFAULT true,
	`is_adult_confirmed` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_tag_unique` ON `artists` (`tag`);--> statement-breakpoint
CREATE INDEX `artistIdIdx` ON `posts` (`artist_id`);--> statement-breakpoint
CREATE INDEX `isViewedIdx` ON `posts` (`is_viewed`);--> statement-breakpoint
CREATE INDEX `publishedAtIdx` ON `posts` (`published_at`);--> statement-breakpoint
CREATE INDEX `isFavoritedIdx` ON `posts` (`is_favorited`);--> statement-breakpoint
CREATE UNIQUE INDEX `posts_artist_id_post_id_unique` ON `posts` (`artist_id`,`post_id`);