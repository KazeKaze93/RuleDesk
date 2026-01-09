/**
 * Allowed hosts for external URL opening
 * This whitelist prevents opening arbitrary URLs and protects against XSS/SSRF attacks
 * 
 * To add new hosts, add them to this array. Only HTTPS URLs are allowed.
 */

// Domains that are allowed to use HTTP protocol (for compatibility with sites that don't support HTTPS)
export const HTTP_ALLOWED_DOMAINS = [
  "rule34.xxx",
  "www.rule34.xxx",
] as const;

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

