/**
 * Shared utilities for media type detection
 * 
 * DRY: Single source of truth for media type logic
 * Used in both Main process (backfill) and Renderer process (filtering)
 */

/**
 * Video file extensions (case-insensitive)
 * Keep this list in sync with all places that check video extensions
 */
const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".mkv",
  ".flv",
  ".wmv",
  ".m4v", // Future-proof: add new extensions here
] as const;

/**
 * Image file extensions (case-insensitive)
 * Keep this list in sync with all places that check image extensions
 */
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
] as const;

/**
 * Determine media type from file URL
 * Returns "image" or "video" based on file extension
 * 
 * @param fileUrl - File URL to check
 * @returns "image" | "video" | null
 */
export function getMediaTypeFromUrl(fileUrl: string | null | undefined): "image" | "video" | null {
  if (!fileUrl) return null;
  
  const urlLower = fileUrl.toLowerCase();
  
  // Extract pathname: everything before ? or # (query params/hash)
  // Use regex to extract pathname without creating URL object (faster)
  const pathMatch = urlLower.match(/^[^?#]+/);
  const pathname = pathMatch ? pathMatch[0] : urlLower;
  
  // Check video extensions first (more specific)
  for (const ext of VIDEO_EXTENSIONS) {
    if (pathname.endsWith(ext)) {
      return "video";
    }
  }
  
  // Check image extensions
  for (const ext of IMAGE_EXTENSIONS) {
    if (pathname.endsWith(ext)) {
      return "image";
    }
  }
  
  // Default to image if extension unknown (most posts are images)
  return "image";
}

/**
 * Check if file URL is a video
 * Convenience wrapper for getMediaTypeFromUrl
 * 
 * @param fileUrl - File URL to check
 * @returns true if file is a video
 */
export function isVideoUrl(fileUrl: string | null | undefined): boolean {
  return getMediaTypeFromUrl(fileUrl) === "video";
}

/**
 * Check if file URL is an image
 * Convenience wrapper for getMediaTypeFromUrl
 * 
 * @param fileUrl - File URL to check
 * @returns true if file is an image
 */
export function isImageUrl(fileUrl: string | null | undefined): boolean {
  return getMediaTypeFromUrl(fileUrl) === "image";
}
