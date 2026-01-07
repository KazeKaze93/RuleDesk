-- Composite Index Migration
-- Optimizes queries filtering by artistId + rating + isViewed simultaneously
-- This is a common filter combination used in PostsController.getPosts()

-- Create composite index covering the most frequent filter combination
-- Order: artistId (most selective) -> rating -> isViewed (least selective)
-- This order allows SQLite to efficiently filter by artist first, then rating, then view status
CREATE INDEX IF NOT EXISTS `posts_artist_rating_viewed_idx` 
ON `posts` (`artist_id`, `rating`, `is_viewed`);

