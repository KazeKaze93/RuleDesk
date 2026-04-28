ALTER TABLE `settings` ADD `vacuum_schedule` text DEFAULT 'manual';
ALTER TABLE `settings` ADD `last_vacuum_at` integer;
ALTER TABLE `settings` ADD `last_vacuum_status` text;
ALTER TABLE `settings` ADD `last_vacuum_error` text;