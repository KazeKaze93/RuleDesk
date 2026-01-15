/**
 * Media utilities for booru providers
 * 
 * DRY: Uses shared media type detection logic from @shared/utils/media
 */

import { isVideoUrl as isVideoUrlShared } from "@shared/utils/media";

/**
 * Check if URL points to a video file
 * DRY: Re-exports shared implementation to maintain backward compatibility
 * 
 * @deprecated Use isVideoUrl from @shared/utils/media directly
 * This re-export is kept for backward compatibility with existing imports
 */
export function isVideoUrl(url?: string): boolean {
  return isVideoUrlShared(url);
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

