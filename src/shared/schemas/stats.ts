export interface ExtendedStats {
  totalArtists: number;
  totalPosts: number;
  totalFavorites: number;
  totalUnviewed: number;
  ratingCounts: { safe: number; questionable: number; explicit: number };
  mediaCounts: { images: number; videos: number };
  /** rule34 = supported provider rows; other = legacy/unsupported (e.g. gelbooru). */
  providerCounts: { rule34: number; other: number };
  topArtists: Array<{ name: string; postCount: number }>;
  topTags: Array<{ tag: string; count: number }>;
  postsTimeline: Array<{ month: string; count: number }>;
  dbSizeBytes: number;
}
