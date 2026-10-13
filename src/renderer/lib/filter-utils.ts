/**
 * Utility functions for post filtering
 */

import { AI_TAGS } from "../../shared/ai-tags";
import { isVideoUrl } from "../../shared/utils/media";

/**
 * Check if post has AI generated tag
 * Tags are stored as space-separated string, so we need to check exact tag match
 */
export function hasAiGeneratedTag(tags: string | undefined | null): boolean {
  if (!tags) return false;

  // Normalize tags: split by space and check for exact matches
  const tagArray = tags
    .toLowerCase()
    .split(/\s+/)
    .filter((tag) => tag.length > 0);

  // Exact booru tokens (`_` / `-`). Space phrases cannot match after split(/\s+/).
  return AI_TAGS.some((aiTag) => tagArray.includes(aiTag));
}

/**
 * Check if post is a video based on file URL
 * DRY: Uses shared media type detection logic
 */
export function isVideoPost(fileUrl: string | undefined | null): boolean {
  return isVideoUrl(fileUrl);
}
