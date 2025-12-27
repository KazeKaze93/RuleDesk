import DOMPurify from "dompurify";
import type { Config } from "dompurify";

/**
 * Configuration for DOMPurify to prevent XSS attacks.
 * Strict mode: only allows safe formatting tags, blocks all dangerous elements.
 */
const PURIFY_CONFIG: Config = {
  // Allow only safe formatting tags
  ALLOWED_TAGS: ["b", "i", "u", "p", "br", "strong", "em"],
  // Explicitly forbid dangerous tags (redundant but explicit for security)
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
  // Remove all attributes except basic formatting
  ALLOWED_ATTR: [],
  // Disable dangerous protocols
  ALLOW_DATA_ATTR: false,
  // Keep relative URLs safe (no href/src allowed anyway due to ALLOWED_ATTR: [])
  ALLOW_UNKNOWN_PROTOCOLS: false,
  // Return as string (not DOM node)
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  // Sanitize style attributes (not allowed anyway, but extra safety)
  FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
};

/**
 * Sanitizes HTML string to prevent XSS attacks.
 *
 * Security measures:
 * - Removes all dangerous tags (script, iframe, object, embed, etc.)
 * - Allows only safe formatting tags (b, i, u, p, br, strong, em)
 * - Strips all attributes to prevent event handlers and malicious URLs
 * - Returns clean, safe HTML string
 *
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```typescript
 * const safe = sanitizeHtml("<b>Hello</b><script>alert('XSS')</script>");
 * // Returns: "<b>Hello</b>"
 * ```
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  // DOMPurify.sanitize can return TrustedHTML, so we explicitly convert to string
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG) as string;
}

