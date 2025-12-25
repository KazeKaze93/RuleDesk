/**
 * Media utilities for booru providers
 */

/**
 * Check if URL points to a video file
 */
export function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(webm|mp4|mov)(\?|$)/i.test(url);
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

