import { describe, expect, it } from "vitest";
import { mapWorkerPostToPost } from "@/renderer/lib/map-worker-post";
import type { WorkerPost } from "@/shared/types/post";

describe("mapWorkerPostToPost", () => {
  const workerPost: WorkerPost = {
    id: 1,
    postId: 100,
    artistId: 1,
    fileUrl: "https://example.com/video.mp4",
    previewUrl: "https://example.com/preview.jpg",
    sampleUrl: "https://example.com/sample.jpg",
    title: "Test",
    rating: "s",
    tags: "tag1 tag2",
    publishedAt: 1_700_000_000_000,
    createdAt: 1_700_000_000_000,
    isViewed: false,
    isFavorited: true,
    viewCount: 42,
    lastViewedAt: 1_700_000_000_100,
    mediaType: "video",
  };

  it("preserves mediaType from worker output", () => {
    const post = mapWorkerPostToPost(workerPost);
    expect(post.mediaType).toBe("video");
    expect(post.mediaType).not.toBeNull();
  });

  it("preserves viewCount from worker output", () => {
    const post = mapWorkerPostToPost(workerPost);
    expect(post.viewCount).toBe(42);
  });

  it("maps lastViewedAt to a valid Date", () => {
    const post = mapWorkerPostToPost(workerPost);
    expect(post.lastViewedAt).toBeInstanceOf(Date);
    expect(post.lastViewedAt?.getTime()).toBe(1_700_000_000_100);
  });

  it("preserves isFavorited", () => {
    const post = mapWorkerPostToPost(workerPost);
    expect(post.isFavorited).toBe(true);
  });

  it("maps publishedAt to a Date instance", () => {
    const post = mapWorkerPostToPost(workerPost);
    expect(post.publishedAt).toBeInstanceOf(Date);
    expect(post.publishedAt.getTime()).toBe(1_700_000_000_000);
  });

  it("infers mediaType from fileUrl when worker omits mediaType", () => {
    const { mediaType: _omit, ...withoutMediaType } = workerPost;
    const post = mapWorkerPostToPost(withoutMediaType as WorkerPost);
    expect(post.mediaType).toBe("video");
  });

  it("defaults viewCount to 0 when missing", () => {
    const { viewCount: _omit, ...withoutViewCount } = workerPost;
    const post = mapWorkerPostToPost(withoutViewCount as WorkerPost);
    expect(post.viewCount).toBe(0);
  });
});
