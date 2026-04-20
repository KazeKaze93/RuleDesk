import { describe, expect, it } from "vitest";
import { mapBooruToNewPost } from "@/main/services/post-mapper";
import type { BooruPost } from "@/main/providers/types";

describe("mapBooruToNewPost", () => {
  it("maps image posts to NewPost with expected defaults", () => {
    const booruPost: BooruPost = {
      id: 123,
      fileUrl: "https://cdn.example.com/post.jpg",
      sampleUrl: "https://cdn.example.com/post-sample.jpg",
      previewUrl: "https://cdn.example.com/post-preview.jpg",
      tags: ["artist_name", "tag1", "tag2"],
      rating: "s",
      score: 10,
      source: "",
      width: 1000,
      height: 800,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    };

    const mapped = mapBooruToNewPost(77, booruPost);

    expect(mapped).toEqual({
      artistId: 77,
      fileUrl: "https://cdn.example.com/post.jpg",
      postId: 123,
      previewUrl: "https://cdn.example.com/post-preview.jpg",
      sampleUrl: "https://cdn.example.com/post-sample.jpg",
      title: "",
      rating: "s",
      tags: "artist_name tag1 tag2",
      mediaType: "image",
      publishedAt: new Date("2025-01-01T00:00:00.000Z"),
      isViewed: false,
      isFavorited: false,
    });
  });

  it("maps video urls to video mediaType", () => {
    const booruPost: BooruPost = {
      id: 124,
      fileUrl: "https://cdn.example.com/post.mp4",
      sampleUrl: "https://cdn.example.com/post-sample.jpg",
      previewUrl: "https://cdn.example.com/post-preview.jpg",
      tags: ["artist_name"],
      rating: "e",
      score: 5,
      source: "",
      width: 1920,
      height: 1080,
      createdAt: new Date("2025-01-02T00:00:00.000Z"),
    };

    const mapped = mapBooruToNewPost(88, booruPost);

    expect(mapped.mediaType).toBe("video");
    expect(mapped.tags).toBe("artist_name");
  });
});
