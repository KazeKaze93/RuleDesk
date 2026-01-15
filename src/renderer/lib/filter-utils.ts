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

/**
 * Check if post is a video based on file URL
 * Handles query parameters and URL parsing correctly
 */
export function isVideoPost(fileUrl: string | undefined | null): boolean {
  if (!fileUrl) return false;
  
  try {
    // Try to parse as URL to handle query parameters
    const url = new URL(fileUrl);
    const path = url.pathname;
    return /\.(mp4|webm|mov)$/i.test(path);
  } catch {
    // Fallback for relative paths or invalid URLs
    // Extract pathname manually if URL parsing fails
    const pathMatch = fileUrl.match(/^[^?#]+/);
    const path = pathMatch ? pathMatch[0] : fileUrl;
    return /\.(mp4|webm|mov)$/i.test(path);
  }
}
