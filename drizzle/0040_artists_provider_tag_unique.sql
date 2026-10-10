DROP INDEX IF EXISTS `artists_tag_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `artists_provider_tag_unique` ON `artists` (`provider`, `tag`);
