/**
 * Database utility functions
 * 
 * Shared utilities for database operations across controllers.
 * Follows DRY principle - no code duplication.
 */

/**
 * Escape special characters for SQLite LIKE queries
 * SQLite LIKE treats % and _ as wildcards. To use them literally, we need to escape them.
 * This function escapes % and _ by prefixing them with backslash, which works with ESCAPE clause.
 *
 * @param text - Text to escape for LIKE query
 * @returns Escaped text safe for LIKE with ESCAPE '\'
 */
export function escapeLikePattern(text: string): string {
  // Escape backslash first (must be first to avoid double-escaping)
  // Then escape % and _ wildcards
  return text
    .replace(/\\/g, "\\\\") // Escape backslash: \ -> \\
    .replace(/%/g, "\\%") // Escape %: % -> \%
    .replace(/_/g, "\\_"); // Escape _: _ -> \_
}
