/**
 * Canonical GitHub Releases URLs for this app (no user-supplied hosts).
 * Tag URLs require a validated semver; otherwise fall back to /latest.
 */
export const GITHUB_REPO_RELEASES_BASE =
  "https://github.com/KazeKaze93/ruledesk/releases" as const;

export const GITHUB_RELEASES_LATEST_URL =
  `${GITHUB_REPO_RELEASES_BASE}/latest` as const;

/** Semver with optional leading v and optional prerelease (no build metadata). */
const SEMVER_PATTERN = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

/**
 * Build a releases page URL for an optional version from update-available.
 * Invalid / empty versions → /releases/latest (never interpolate untrusted text).
 */
export function buildGitHubReleasePageUrl(
  version: string | undefined | null
): string {
  if (version === undefined || version === null) {
    return GITHUB_RELEASES_LATEST_URL;
  }
  const trimmed = version.trim();
  if (trimmed.length === 0) {
    return GITHUB_RELEASES_LATEST_URL;
  }
  const match = SEMVER_PATTERN.exec(trimmed);
  if (!match) {
    return GITHUB_RELEASES_LATEST_URL;
  }
  return `${GITHUB_REPO_RELEASES_BASE}/tag/v${match[1]}`;
}
