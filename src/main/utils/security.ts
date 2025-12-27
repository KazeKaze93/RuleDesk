import path from "path";
import { randomUUID } from "crypto";

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
 * 1. Normalizes path separators (replaces \ with /) for cross-platform compatibility
 *    This prevents path.posix.basename from failing on Windows paths like 'C:\Windows\system32\cmd.exe'
 * 2. Removes any path components using `path.posix.basename()` to prevent directory traversal
 * 3. Filters out unsafe characters, leaving only alphanumeric, dash, underscore, dot
 * 4. Validates file extension against whitelist (media files only)
 * 5. Truncates filename to 255 characters to prevent filesystem errors
 *
 * @param fileName - Raw filename (potentially unsafe, may contain path traversal from any OS)
 * @returns Sanitized filename safe for filesystem operations
 * @throws {Error} If filename becomes empty after sanitization
 *
 * @example
 * ```typescript
 * const safeName = sanitizeFileName("../../../etc/passwd"); // Returns "passwd.bin"
 * const safeName2 = sanitizeFileName("C:\\Windows\\system32\\cmd.exe"); // Returns "cmd.bin" (Windows path handled)
 * const safeName3 = sanitizeFileName("image.jpg"); // Returns "image.jpg"
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  // Step 1: Normalize path separators for cross-platform compatibility
  // Replace all backslashes (Windows) with forward slashes (POSIX) to handle paths from any OS
  // This prevents path.posix.basename from failing on Windows paths like 'C:\Windows\system32\cmd.exe'
  const normalizedPath = fileName.replace(/\\/g, "/");

  // Step 2: Remove any path components (prevents path traversal)
  // Now path.posix.basename will correctly extract filename regardless of original OS
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
  const safeExt = ALLOWED_EXTENSIONS.includes(
    ext as (typeof ALLOWED_EXTENSIONS)[number]
  )
    ? ext
    : ".bin"; // Replace unsafe extensions with .bin

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
