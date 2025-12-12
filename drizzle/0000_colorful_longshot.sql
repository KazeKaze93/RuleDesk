CREATE TABLE `artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tag` text NOT NULL,
	`type` text DEFAULT 'tag' NOT NULL,
	`api_endpoint` text NOT NULL,
	`last_post_id` integer DEFAULT 0 NOT NULL,
	`new_posts_count` integer DEFAULT 0 NOT NULL,
	`last_checked` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY NOT NULL,
	`artist_id` integer NOT NULL,
	`file_url` text NOT NULL,
	`preview_url` text,
	`rating` text,
	`tags` text,
	`title` text DEFAULT '',
	`published_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`is_viewed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`apiKey` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag_string` text NOT NULL,
	`last_post_id` integer DEFAULT 0 NOT NULL,
	`new_posts_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_tag_string_unique` ON `subscriptions` (`tag_string`);