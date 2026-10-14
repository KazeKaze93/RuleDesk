/**
 * Pure helpers for `scripts/check-release-artifacts.mjs`
 * (forbidden packaged paths / content rules).
 */

/**
 * Relative paths that must never appear inside a packaged app.asar extract.
 * Matches path segments or file suffixes (posix or Windows separators).
 */
export const FORBIDDEN_RELATIVE_PATH =
  /(?:^|[\\/])(?:tests|playwright-report|test-results|\.ai|\.cursor)(?:[\\/]|$)|\.cursorrules$|\.env(?:\.|$)|\.map$/i;

/**
 * @param {string} relativePath path relative to the asar extract root
 * @returns {boolean}
 */
export function isForbiddenRelativePath(relativePath) {
  const posixPath = String(relativePath).split(/[\\/]/).join("/");
  return FORBIDDEN_RELATIVE_PATH.test(posixPath);
}
