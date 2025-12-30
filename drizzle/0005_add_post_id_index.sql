-- Add index on post_id for efficient lookups in SearchController
-- This prevents N+1 queries when fetching local state for external posts
CREATE INDEX IF NOT EXISTS `postIdIdx` ON `posts` (`post_id`);

