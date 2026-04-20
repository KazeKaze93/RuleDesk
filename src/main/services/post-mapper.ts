import type { NewPost } from "../db/schema";
import type { BooruPost } from "../providers/types";
import { isVideoUrl } from "@shared/utils/media";

export function mapBooruToNewPost(
  artistId: number,
  booruPost: BooruPost
): NewPost {
  return {
    artistId,
    fileUrl: booruPost.fileUrl,
    postId: booruPost.id,
    previewUrl: booruPost.previewUrl,
    sampleUrl: booruPost.sampleUrl,
    title: "",
    rating: booruPost.rating,
    tags: booruPost.tags.join(" "),
    mediaType: isVideoUrl(booruPost.fileUrl) ? "video" : "image",
    publishedAt: booruPost.createdAt,
    isViewed: false,
    isFavorited: false,
  };
}
