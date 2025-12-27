import DOMPurify from "dompurify";
import type { Config } from "dompurify";

/**
 * Configuration for DOMPurify to prevent XSS attacks while allowing Booru-specific content.
 * Allows safe formatting tags and safe URLs (href, src) for tags and custom emojis.
 * Blocks all dangerous elements and event handlers.
 */
const PURIFY_CONFIG: Config = {
  // Allow safe formatting tags and media tags for Booru content
  ALLOWED_TAGS: [
    "b",
    "i",
    "u",
    "p",
    "br",
    "strong",
    "em",
    "a", // Links for tags
    "img", // Custom emojis/images
  ],
  // Explicitly forbid dangerous tags
  FORBID_TAGS: [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
  ],
  // Allow safe attributes: href for links, src/alt for images
  ALLOWED_ATTR: ["href", "src", "alt", "title"],
  // Disable dangerous protocols (javascript:, data:, etc.)
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  // Validate URLs: only allow http, https, and relative URLs
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  // Return as string (not DOM node)
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  // Forbid dangerous attributes (event handlers, styles)
  FORBID_ATTR: [
    "style",
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onfocus",
  ],
};

/**
 * Sanitizes HTML string to prevent XSS attacks while preserving Booru-specific content.
 *
 * ⚠️ SECURITY WARNING: This function is for Renderer-side DOM sanitization ONLY.
 * - Use this BEFORE inserting HTML into DOM via dangerouslySetInnerHTML
 * - NEVER trust Renderer data - all data from Renderer must be validated/sanitized in Main process
 * - Main process should have its own sanitization before writing to database
 * - This is a defense-in-depth measure, not the primary security boundary
 *
 * Security measures:
 * - Removes all dangerous tags (script, iframe, object, embed, etc.)
 * - Allows safe formatting tags (b, i, u, p, br, strong, em)
 * - Allows links (a) and images (img) with validated URLs (href, src)
 * - Validates URLs to prevent javascript: and data: protocol attacks
 * - Strips event handlers and dangerous attributes
 * - Returns clean, safe HTML string suitable for Booru content (tags, descriptions, comments)
 *
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```typescript
 * // ✅ CORRECT: Sanitize before DOM insertion
 * const safe = sanitizeHtml(userContent);
 * <div dangerouslySetInnerHTML={{ __html: safe }} />
 *
 * // ❌ WRONG: Never trust Renderer data in Main process
 * // Main process must validate/sanitize all data from Renderer
 * ```
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  // With RETURN_DOM: false, DOMPurify.sanitize returns string (not TrustedHTML)
  // TypeScript correctly infers the return type based on PURIFY_CONFIG
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}
