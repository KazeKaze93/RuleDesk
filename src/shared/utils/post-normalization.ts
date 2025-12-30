import type { Post } from "../../main/db/schema";
import type { PostData } from "../schemas/post";

/**
 * Normalize rating: convert full words to single characters
 * API may return "explicit", "safe", "questionable" or "s", "q", "e"
 *
 * @param value - Rating value to normalize
 * @returns Normalized rating ("s", "q", or "e")
 */
export function normalizeRating(
  value: string | undefined | null
): "s" | "q" | "e" {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return "q";
  }

  const normalized = value.toLowerCase().trim();

  if (normalized === "explicit") return "e";
  if (normalized === "safe") return "s";
  if (normalized === "questionable") return "q";

  if (normalized === "e" || normalized === "s" || normalized === "q") {
    return normalized;
  }

  return "q";
}

/**
 * Convert Post to PostData format for IPC transmission
 *
 * Normalizes all fields and converts Date objects to timestamps.
 * This function handles both database posts and external API posts.
 *
 * @param post - Post object (from DB or API)
 * @returns PostData object ready for IPC transmission
 */
export function normalizePostToPostData(post: Post): PostData {
  // Normalize rating
  const rating = normalizeRating(post.rating);

  // Convert publishedAt to timestamp
  let publishedAt: number | undefined;
  if (post.publishedAt instanceof Date) {
    publishedAt = post.publishedAt.getTime();
  } else if (typeof post.publishedAt === "number") {
    publishedAt = post.publishedAt;
  }

  // Normalize tags (ensure string format)
  // Post.tags is always string in DB schema, but may be array in API responses
  // This handles both cases safely
  let tags: string | undefined;
  if (typeof post.tags === "string") {
    tags = post.tags;
  } else if (Array.isArray(post.tags)) {
    tags = (post.tags as string[]).join(" ");
  }

  return {
    postId: post.postId,
    artistId: post.artistId,
    fileUrl: post.fileUrl,
    previewUrl: post.previewUrl,
    sampleUrl: post.sampleUrl || undefined,
    rating: rating || undefined,
    tags: tags || undefined,
    publishedAt,
  };
}

