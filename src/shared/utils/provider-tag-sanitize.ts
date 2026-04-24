/**
 * Sanitization for tag strings before they are sent to Booru provider APIs.
 * Strips control characters and limits length to avoid abuse and broken requests.
 */

/** Per-tag cap (Rule34-style tags are typically short; room for OR-groups). */
export const PROVIDER_TAG_TOKEN_MAX_LENGTH = 200;

/** Whole query string cap after join (space-separated tags). */
export const PROVIDER_TAG_QUERY_MAX_LENGTH = 2000;

function stripControlAndDeleteChars(s: string): string {
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp < 32 || cp === 127) continue;
    out += ch;
  }
  return out;
}

/**
 * Strip control characters and cap length for a single tag token.
 */
export function sanitizeProviderTagToken(tag: string): string {
  return stripControlAndDeleteChars(tag).slice(0, PROVIDER_TAG_TOKEN_MAX_LENGTH);
}

/**
 * Sanitize a full tag query string (e.g. space-separated, may include OR-groups).
 */
export function sanitizeProviderTagQuery(query: string): string {
  return stripControlAndDeleteChars(query).slice(0, PROVIDER_TAG_QUERY_MAX_LENGTH);
}
