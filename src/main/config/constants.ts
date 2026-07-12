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

/**
 * SQLite busy handler (better-sqlite3 `timeout` option, ms).
 * Prevents immediate SQLITE_BUSY when two writers contend briefly.
 */
export const SQLITE_BUSY_TIMEOUT_MS = 5000;

/** Soft cap for on-disk video proxy cache under userData/video-cache. */
export const VIDEO_CACHE_MAX_BYTES = 2 * 1024 * 1024 * 1024;

/** Age after which orphaned `*.bin.tmp-*` files are deleted during eviction. */
export const VIDEO_CACHE_SWEEP_ORPHAN_TMP_AGE_MS = 60 * 60 * 1000;

/** Deferred one-shot eviction after VideoProxyServer.start(). */
export const VIDEO_CACHE_EVICT_AFTER_START_MS = 15_000;

