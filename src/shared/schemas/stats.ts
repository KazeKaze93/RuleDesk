export interface DatabaseStats {
  totalArtists: number;
  totalPosts: number;
  totalViewed: number;
  totalFavorited: number;
  totalVideos: number;
  totalImages: number;
  postsByRating: { safe: number; questionable: number; explicit: number };
  topArtistsByPosts: Array<{
    name: string;
    postCount: number;
    newPostsCount: number;
  }>;
  dbFileSizeBytes: number;
}
