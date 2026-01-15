/**
 * Utility functions for post filtering
 */

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
  
  // Check for various AI tag formats
  const aiTags = [
    "ai_generated",
    "ai generated",
    "ai-generated",
    "ai_generation",
    "ai generation",
    "ai-generated_content",
    "ai generated content",
  ];
  
  return aiTags.some((aiTag) => tagArray.includes(aiTag));
}

// Compiled regex for video extension check (reused across calls)
const VIDEO_EXTENSION_REGEX = /\.(mp4|webm|mov)$/i;

/**
 * Check if post is a video based on file URL
 * Optimized: uses only string operations, no URL object creation
 * Handles query parameters and hash fragments by extracting pathname manually
 */
export function isVideoPost(fileUrl: string | undefined | null): boolean {
  if (!fileUrl) return false;
  
  // Extract pathname: everything before ? or # (query params/hash)
  // Use regex to extract pathname without creating URL object
  const pathMatch = fileUrl.match(/^[^?#]+/);
  const pathname = pathMatch ? pathMatch[0] : fileUrl;
  
  // Check if pathname ends with video extension (case-insensitive)
  return VIDEO_EXTENSION_REGEX.test(pathname);
}
