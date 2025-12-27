import path from "path";
import { randomUUID } from "crypto";

/**
 * Whitelist of allowed file extensions for downloads.
 * Only media files are permitted to prevent execution of malicious files.
 */
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webm", ".mp4"] as const;

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
 * 1. Removes any path components using `path.basename()` to prevent directory traversal
 * 2. Filters out unsafe characters, leaving only alphanumeric, dash, underscore, dot
 * 3. Validates file extension against whitelist (media files only)
 * 4. Truncates filename to 255 characters to prevent filesystem errors
 *
 * @param fileName - Raw filename (potentially unsafe, may contain path traversal)
 * @returns Sanitized filename safe for filesystem operations
 * @throws {Error} If filename becomes empty after sanitization
 *
 * @example
 * ```typescript
 * const safeName = sanitizeFileName("../../../etc/passwd"); // Returns "passwd.bin"
 * const safeName2 = sanitizeFileName("image.jpg"); // Returns "image.jpg"
 * const safeName3 = sanitizeFileName("file.exe"); // Returns "file.bin"
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  // Step 1: Remove any path components (prevents path traversal)
  // Use posix path for cross-platform compatibility (handles both / and \ separators)
  // This ensures consistent behavior regardless of the OS where the app is built
  const basename = path.posix.basename(fileName);

  if (!basename || basename.trim().length === 0) {
    throw new Error("Filename cannot be empty after sanitization");
  }

  // Step 2: Extract extension and name separately
  // Use posix for consistency (extname works the same on both, but explicit is better)
  const ext = path.posix.extname(basename).toLowerCase();
  const nameWithoutExt = path.posix.basename(basename, ext);

  // Step 3: Sanitize name part (remove unsafe characters)
  // Replace any character that is not alphanumeric, dash, underscore, or dot with underscore
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Step 4: Validate extension against whitelist
  const safeExt = ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])
    ? ext
    : ".bin"; // Replace unsafe extensions with .bin

  // Step 5: Combine name and extension
  let safeFileName = sanitizedName + safeExt;

  // Step 6: Truncate to maximum length (preserve extension)
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

