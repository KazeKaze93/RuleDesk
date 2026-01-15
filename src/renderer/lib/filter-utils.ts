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
 * Optimized: avoids new URL() allocations, uses regex on pathname extraction
 * Handles query parameters and URL parsing correctly
 */
export function isVideoPost(fileUrl: string | undefined | null): boolean {
  if (!fileUrl) return false;
  
  // Fast path: check if URL contains query params or hash (needs parsing)
  // For simple paths without ? or #, use lastIndexOf for better performance
  const hasQueryOrHash = fileUrl.includes('?') || fileUrl.includes('#');
  
  if (!hasQueryOrHash) {
    // Simple path - use lastIndexOf for O(n) performance instead of regex
    const lastDot = fileUrl.lastIndexOf('.');
    if (lastDot === -1) return false;
    const ext = fileUrl.slice(lastDot).toLowerCase();
    return ext === '.mp4' || ext === '.webm' || ext === '.mov';
  }
  
  // Complex URL with query params - extract pathname first
  try {
    // Only create URL object if we have query params/hash
    const url = new URL(fileUrl);
    return VIDEO_EXTENSION_REGEX.test(url.pathname);
  } catch {
    // Fallback for relative paths or invalid URLs
    // Extract pathname manually if URL parsing fails
    const pathMatch = fileUrl.match(/^[^?#]+/);
    const path = pathMatch ? pathMatch[0] : fileUrl;
    return VIDEO_EXTENSION_REGEX.test(path);
  }
}
