/**
 * Utility functions for post filtering
 */

import { isVideoUrl } from "../../shared/utils/media";

/** Re-export shared predicate — single source in `@shared/ai-tags`. */
export { hasAiGeneratedTag } from "../../shared/ai-tags";

/**
 * Check if post is a video based on file URL
 * DRY: Uses shared media type detection logic
 */
export function isVideoPost(fileUrl: string | undefined | null): boolean {
  return isVideoUrl(fileUrl);
}
