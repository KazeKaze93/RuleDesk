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

/**
 * Soft cap for on-disk video proxy cache under userData/video-cache.
 * Eviction is LRU by last-accessed time (atime bumped on hit), not mtime.
 */
export const VIDEO_CACHE_MAX_BYTES = 2 * 1024 * 1024 * 1024;

/** Age after which orphaned `*.bin.tmp-*` files are deleted during eviction. */
export const VIDEO_CACHE_SWEEP_ORPHAN_TMP_AGE_MS = 60 * 60 * 1000;

/** Deferred one-shot eviction after VideoProxyServer.start(). */
export const VIDEO_CACHE_EVICT_AFTER_START_MS = 15_000;

/** Max time to wait for in-flight sync to finish after cancel on app quit. */
export const SYNC_SHUTDOWN_DRAIN_MS = 8000;

/**
 * Max time deleteArtist waits for a per-artist sync cancel + finally
 * (FTS rebuild + trigger restore) before refusing the delete.
 */
export const DELETE_ARTIST_SYNC_DRAIN_MS = 120_000;

/** Max time to wait for in-flight mass download cancel/drain before closing DB on quit. */
export const DOWNLOAD_SHUTDOWN_DRAIN_MS = 8000;

/**
 * Atomic tmp+rename retries for EPERM/EBUSY/EACCES (Windows AV / indexer).
 * Attempt 0 waits base, then 2×, 4×, … before the next try.
 */
export const ATOMIC_WRITE_RETRY_MAX_ATTEMPTS = 5;

/** Base delay (ms) for atomic-write rename/write backoff. */
export const ATOMIC_WRITE_RETRY_BASE_DELAY_MS = 20;

/** Parallel axios downloads inside downloadWorker. */
export const BATCH_DOWNLOAD_CONCURRENCY = 3;

/** Pause between items on each worker lane (rate-limit hygiene). */
export const BATCH_DOWNLOAD_DELAY_MS = 500;

/** Axios timeout until response headers (connect / first byte). */
export const DOWNLOAD_CONNECT_TIMEOUT_MS = 30_000;

/** Abort if no download progress for this long (large files OK if bytes keep flowing). */
export const DOWNLOAD_IDLE_TIMEOUT_MS = 60_000;

/** 429 retries before the item is recorded as HTTP_429. */
export const DOWNLOAD_429_MAX_RETRIES = 3;

/** Base delay for exponential backoff on 429 (attempt 0 → base, then 2×, 4×, …). */
export const DOWNLOAD_429_BASE_DELAY_MS = 1000;

/**
 * Bytes of `app.log` included in Help diagnostics (tail only; file is append-only).
 * Kept at 32 KiB so header + redacted tail stay under GitHub's issue body limit
 * (`GITHUB_ISSUE_BODY_MAX_CHARS` = 65_536). Read path re-applies log redaction.
 */
export const DIAGNOSTICS_LOG_TAIL_BYTES = 32 * 1024;

/** GitHub issue / comment body character limit — diagnostics paste must stay under this. */
export const GITHUB_ISSUE_BODY_MAX_CHARS = 65_536;

/**
 * Max acceptable Main event-loop lag (ms) while `VACUUM INTO` / `PRAGMA integrity_check`
 * run in `backupIntegrityWorker`. Sync SQLite for those ops must not run on Main.
 */
export const MAX_MAIN_EVENT_LOOP_LAG_DURING_BACKUP_MS = 100;

