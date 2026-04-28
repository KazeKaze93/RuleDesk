UPDATE artists
SET new_posts_count = MIN(
  new_posts_count,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM posts
      WHERE posts.artist_id = artists.id
    ),
    0
  )
);
