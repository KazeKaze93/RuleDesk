ALTER TABLE `posts` ADD COLUMN `provider` text DEFAULT 'rule34' NOT NULL;--> statement-breakpoint
UPDATE `posts`
SET `provider` = (
  SELECT `a`.`provider` FROM `artists` AS `a` WHERE `a`.`id` = `posts`.`artist_id`
)
WHERE `artist_id` != 0
  AND EXISTS (
    SELECT 1 FROM `artists` AS `a` WHERE `a`.`id` = `posts`.`artist_id`
  );--> statement-breakpoint
UPDATE `posts`
SET `provider` = 'gelbooru'
WHERE `artist_id` = 0
  AND (
    lower(COALESCE(`file_url`, '')) LIKE '%gelbooru.com%'
    OR lower(COALESCE(`sample_url`, '')) LIKE '%gelbooru.com%'
    OR lower(COALESCE(`preview_url`, '')) LIKE '%gelbooru.com%'
  )
  AND lower(COALESCE(`file_url`, '')) NOT LIKE '%rule34.xxx%'
  AND lower(COALESCE(`sample_url`, '')) NOT LIKE '%rule34.xxx%'
  AND lower(COALESCE(`preview_url`, '')) NOT LIKE '%rule34.xxx%';--> statement-breakpoint
DROP INDEX IF EXISTS `posts_artist_id_post_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `posts_artist_id_provider_post_id_unique` ON `posts` (`artist_id`, `provider`, `post_id`);
