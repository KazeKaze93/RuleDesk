-- Composite Index Migration
-- Optimizes queries filtering by artistId + rating + isViewed simultaneously
-- This is a common filter combination used in PostsController.getPosts()

-- Create composite index covering the most frequent filter combination
-- Order: artistId (most selective) -> rating -> isViewed (least selective)
-- 
-- SELECTIVITY ANALYSIS:
-- - artist_id: Very selective (hundreds/thousands of artists, each with their posts)
-- - rating: Moderate selectivity (3 values: "s", "q", "e")
--   WARNING: If rating distribution is skewed (e.g., 90% "q"), consider removing rating from index
--   or reordering to (artist_id, is_viewed) if rating filter is rarely used
-- - is_viewed: Least selective (boolean, typically 50/50 or skewed toward false)
-- 
-- This order allows SQLite to efficiently filter by artist first, then rating, then view status
-- SQLite can use this index for queries filtering by:
--   - artist_id only
--   - artist_id + rating
--   - artist_id + rating + is_viewed
--
-- PERFORMANCE NOTE: If rating has low selectivity (< 10% unique values), consider:
--   Option 1: Remove rating from index: (artist_id, is_viewed)
--   Option 2: Reorder to (artist_id, is_viewed, rating) if rating is rarely filtered
--   Monitor query performance and adjust if needed
CREATE INDEX IF NOT EXISTS `posts_artist_rating_viewed_idx` 
ON `posts` (`artist_id`, `rating`, `is_viewed`);

