/**
 * Parse HTTPS URL and return normalized hostname, or null if invalid / not https.
 */
export function tryParseHttpsUrlHostname(href: string): string | null {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "https:") {
      return null;
    }
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}
