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
	`title` text,
	`rating` text,
	`tags` text,
	`published_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`is_viewed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`api_key` text
);
--> statement-breakpoint
CREATE INDEX `name_idx` ON `artists` (`name`);--> statement-breakpoint
CREATE INDEX `artist_id_idx` ON `posts` (`artist_id`);--> statement-breakpoint
CREATE INDEX `published_at_idx` ON `posts` (`published_at`);--> statement-breakpoint
CREATE INDEX `is_viewed_idx` ON `posts` (`is_viewed`);--> statement-breakpoint
CREATE UNIQUE INDEX `posts_artist_id_post_id_unique` ON `posts` (`artist_id`,`post_id`);