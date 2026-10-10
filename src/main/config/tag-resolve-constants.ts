/**
 * Tag-resolve tuning constants (Main).
 * TTL for `tag_metadata` not_found lives in shared — used by Main maintenance
 * and Renderer TagsDrawer `staleTime` (must stay aligned).
 */
export { TAG_RESOLVE_NOT_FOUND_TTL_MS } from "../../shared/constants";

/**
 * SQLite TTL for `found` tag_metadata rows (Main eviction only).
 * Much larger than `TAG_RESOLVE_NOT_FOUND_TTL_MS` — tag type for a name almost
 * never flips, but the table must not grow without a bound. Maintenance DELETEs
 * expired rows; load path still serves found until the next tick (eviction-only).
 */
export const TAG_RESOLVE_FOUND_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Soft ceiling on `tag_metadata` row count inside the TTL window.
 * One row per resolved tag name; TTL alone cannot bound a long Browse/viewer
 * session that touches many unique tags. Eviction deletes oldest-by-`resolved_at`.
 */
export const MAX_TAG_METADATA_ROWS = 50_000;

/** HTTP timeout for a single tag metadata lookup. */
export const TAG_RESOLVE_REQUEST_TIMEOUT_MS = 10_000;

/** Retries after HTTP 429 before giving up on a tag in one wave. */
export const TAG_RESOLVE_MAX_RATE_LIMIT_RETRIES = 3;

/** Default backoff when Rule34 omits Retry-After (seconds → applied as ms). */
export const TAG_RESOLVE_DEFAULT_RETRY_AFTER_MS = 5_000;

/** Max Retry-After we honor (1 hour). */
export const TAG_RESOLVE_MAX_RETRY_AFTER_MS = 60 * 60 * 1000;

/** Collapse per-tag 429 logs into one warn per burst window. */
export const TAG_RESOLVE_429_BURST_LOG_WINDOW_MS = 10_000;
