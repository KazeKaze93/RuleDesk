import path from "path";
import { randomUUID } from "node:crypto";

/**
 * Whitelist of allowed file extensions for downloads.
 * Only media files are permitted to prevent execution of malicious files.
 */
const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webm",
  ".mp4",
] as const;

/**
 * Maximum filename length (255 characters is the limit for most filesystems).
 */
const MAX_FILENAME_LENGTH = 255;

/**
 * Regular expression for safe filename characters.
 * Allows: alphanumeric, dash, underscore, dot.
 */
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Sanitizes a filename to prevent Path Traversal attacks and ensure filesystem safety.
 *
 * Security measures:
 * 1. Normalizes path by replacing all backslashes with forward slashes (cross-platform safety)
 * 2. Uses path.posix.basename() to extract filename (removes all path components)
 * 3. Filters out unsafe characters, leaving only alphanumeric, dash, underscore, dot
 * 4. Validates file extension against whitelist (media files only)
 * 5. Truncates filename to 255 characters to prevent filesystem errors
 *
 * ⚠️ PERFORMANCE NOTE: This function is synchronous and performs string operations.
 * For single file operations (typical use case), this is acceptable.
 * For bulk processing (1000+ files), consider batching or using Worker threads to avoid blocking Event Loop.
 *
 * @param fileName - Raw filename (potentially unsafe, may contain path traversal from any OS)
 * @returns Sanitized filename safe for filesystem operations
 * @throws {Error} If filename becomes empty after sanitization
 *
 * @example
 * ```typescript
 * const safeName = sanitizeFileName("../../../etc/passwd"); // Returns "passwd.bin"
 * const safeName2 = sanitizeFileName("C:\\Windows\\system32\\cmd.exe"); // Returns "cmd.bin"
 * const safeName3 = sanitizeFileName("image.jpg"); // Returns "image.jpg"
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  // Step 1: Normalize path separators to POSIX format
  // This handles Windows paths (C:\path\to\file) and mixed separators
  // Replace all backslashes with forward slashes for consistent processing
  const normalizedPath = fileName.replace(/\\/g, "/");
  
  // Step 2: Extract basename using POSIX methods
  // path.posix.basename() removes all path components, including:
  // - Directory separators (../, ./, /)
  // - Drive letters (C:, D:)
  // - UNC paths (\\server\share)
  // This is safe because basename() by definition strips path components
  const basename = path.posix.basename(normalizedPath);
  
  if (!basename || basename.trim().length === 0) {
    throw new Error("Filename cannot be empty after sanitization");
  }

  // Step 3: Extract extension and name separately
  const ext = path.posix.extname(basename).toLowerCase();
  const nameWithoutExt = path.posix.basename(basename, ext);

  // Step 4: Sanitize name part (remove unsafe characters)
  // Replace any character that is not alphanumeric, dash, underscore, or dot with underscore
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Step 5: Validate extension against whitelist
  // Note: For NSFW Booru client, we only allow media files for security.
  // Non-media extensions are replaced with .bin to prevent execution of malicious files.
  // If you need to support other file types (e.g., .txt, .json), add them to ALLOWED_EXTENSIONS.
  const safeExt = ALLOWED_EXTENSIONS.includes(
    ext as (typeof ALLOWED_EXTENSIONS)[number]
  )
    ? ext
    : ".bin"; // Replace unsafe extensions with .bin (prevents execution)

  // Step 6: Combine name and extension
  let safeFileName = sanitizedName + safeExt;

  // Step 7: Truncate to maximum length (preserve extension)
  if (safeFileName.length > MAX_FILENAME_LENGTH) {
    const extLength = safeExt.length;
    const maxNameLength = MAX_FILENAME_LENGTH - extLength;
    const truncatedName = sanitizedName.substring(0, maxNameLength);
    safeFileName = truncatedName + safeExt;
  }

  // Final validation: ensure result matches safe pattern
  if (!SAFE_FILENAME_REGEX.test(safeFileName)) {
    // If somehow still unsafe, use cryptographically secure fallback
    // Use UUID to prevent collisions when multiple files are sanitized simultaneously
    const uuid = randomUUID();
    const fallbackName = `file_${uuid}.bin`;
    return fallbackName.length > MAX_FILENAME_LENGTH
      ? fallbackName.substring(0, MAX_FILENAME_LENGTH)
      : fallbackName;
  }

  return safeFileName;
}
