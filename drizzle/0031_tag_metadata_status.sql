ALTER TABLE `tag_metadata` ADD `status` text DEFAULT 'found' NOT NULL;--> statement-breakpoint
ALTER TABLE `tag_metadata` ADD `resolved_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `tag_metadata` SET `resolved_at` = CAST((strftime('%s', 'now') * 1000) AS INTEGER) WHERE `resolved_at` = 0;
