/**
 * Application constants
 */

// User-Agent mimicking a real browser to avoid bans from Cloudflare-protected sites
// Using Chrome on Windows (most common user agent)
// WARNING: Cloudflare can detect Electron/Axios via TLS fingerprinting despite correct UA
// If bans occur, consider: electron-fetch, Electron's net module, or session cookies
// See: https://github.com/electron/electron/issues/24334
export const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 15000;

// Autocomplete timeout in milliseconds
export const AUTOCOMPLETE_TIMEOUT = 10000;

