import type { Post } from "@shared/types/db";

const DEFAULT_TIMESTAMP = new Date("2024-01-01T00:00:00.000Z");

export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    postId: 100,
    artistId: 1,
    fileUrl: "https://example.com/image.jpg",
    previewUrl: "https://example.com/preview.jpg",
    sampleUrl: "",
    title: "",
    rating: "s",
    tags: "tag",
    mediaType: "image",
    publishedAt: DEFAULT_TIMESTAMP,
    createdAt: DEFAULT_TIMESTAMP,
    isViewed: false,
    lastViewedAt: null,
    viewCount: 0,
    isFavorited: false,
    ...overrides,
  };
}
