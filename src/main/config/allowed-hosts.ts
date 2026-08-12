/**
 * Allowed hosts for shell.openExternal (user-initiated browser tabs).
 * This whitelist prevents opening arbitrary URLs and protects against XSS/SSRF attacks.
 *
 * Intentionally separate from provider.allowedDomains / provider.cdnDomains:
 * those lists are what the app may fetch (CSP vs video-proxy). This list is
 * what the user may open themselves.
 * Do not sync the two — different trust boundaries (user click vs app-originated request).
 *
 * To add new hosts, add them to this array. Only HTTPS URLs are allowed.
 */

export const ALLOWED_HOSTS = [
  "rule34.xxx",
  "www.rule34.xxx",
  // Add other booru sites here as needed
  // "gelbooru.com",
  // "www.gelbooru.com",
] as const;

/**
 * Creates a Set for O(1) hostname lookups
 * Using Set<string> to allow runtime string comparisons
 */
export const ALLOWED_HOSTS_SET = new Set<string>(ALLOWED_HOSTS);

