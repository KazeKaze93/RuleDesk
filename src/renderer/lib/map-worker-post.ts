import type { Post } from "@shared/types/db";
import type { WorkerPost } from "../../shared/types/post";
import { isVideoUrl } from "../../shared/utils/media";

/**
 * Maps a worker-filtered post back to the Drizzle Post shape used in the UI.
 */
export function mapWorkerPostToPost(workerPost: WorkerPost): Post {
  const publishedAt =
    workerPost.publishedAt instanceof Date
      ? workerPost.publishedAt
      : workerPost.publishedAt
      ? new Date(workerPost.publishedAt)
      : new Date();
  const createdAt =
    workerPost.createdAt instanceof Date
      ? workerPost.createdAt
      : workerPost.createdAt
      ? new Date(workerPost.createdAt)
      : new Date();
  const lastViewedAt =
    workerPost.lastViewedAt instanceof Date
      ? workerPost.lastViewedAt
      : workerPost.lastViewedAt
      ? new Date(workerPost.lastViewedAt)
      : null;
  const mediaType =
    workerPost.mediaType === "image" || workerPost.mediaType === "video"
      ? workerPost.mediaType
      : isVideoUrl(workerPost.fileUrl)
      ? "video"
      : "image";

  return {
    id: workerPost.id,
    postId: workerPost.postId,
    artistId: workerPost.artistId,
    fileUrl: workerPost.fileUrl,
    previewUrl: workerPost.previewUrl,
    sampleUrl: workerPost.sampleUrl,
    title: workerPost.title ?? "",
    rating: workerPost.rating ?? "",
    tags: workerPost.tags,
    mediaType,
    publishedAt,
    createdAt,
    isViewed: workerPost.isViewed,
    lastViewedAt,
    viewCount:
      typeof workerPost.viewCount === "number" ? workerPost.viewCount : 0,
    isFavorited: workerPost.isFavorited,
  };
}
