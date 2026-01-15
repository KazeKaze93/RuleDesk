/**
 * Media utilities for booru providers
 */

// PERFORMANCE: Compile regex once (static) to avoid recompilation on every call
// This prevents 1000+ regex allocations in bulkUpsertPosts
const VIDEO_EXTENSION_REGEX = /\.(webm|mp4|mov)(\?|$)/i;

/**
 * Check if URL points to a video file
 * PERFORMANCE: Uses pre-compiled regex to avoid allocations in hot paths
 */
export function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  return VIDEO_EXTENSION_REGEX.test(url);
}

/**
 * Select best preview URL from available options
 * Prioritizes non-video URLs for thumbnail display
 */
export function selectBestPreview(options: {
  preview?: string;
  sample?: string;
  file?: string;
}): string {
  const { preview, sample, file } = options;

  // Try preview first
  if (preview && !isVideoUrl(preview)) {
    return preview;
  }

  // Fallback to sample
  if (sample && !isVideoUrl(sample)) {
    return sample;
  }

  // Fallback to file
  if (file && !isVideoUrl(file)) {
    return file;
  }

  // If all are videos or missing, return whatever is available
  return preview || sample || file || "";
}

