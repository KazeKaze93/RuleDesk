/**
 * SQLite TTL for confirmed empty (`not_found`) Browse search page rows.
 * Expired rows are treated as cache-misses (re-fetch); maintenance DELETEs them.
 */
export const SEARCH_RESULTS_CACHE_NOT_FOUND_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * SQLite TTL for successful (`found`) Browse search page rows.
 * Much larger than `SEARCH_RESULTS_CACHE_NOT_FOUND_TTL_MS` — empty pages are
 * cheap to re-confirm, while a found payload is reusable across a longer session
 * window. Bound growth with row + payload-byte caps below.
 */
export const SEARCH_RESULTS_CACHE_FOUND_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Soft ceiling on `search_results_cache` row count inside the TTL window.
 * Infinite Browse scroll mints one row per unique `beforePostId` (and per
 * query-shape key); TTL alone cannot bound growth during a long day.
 *
 * 2000 ≈ headroom for ~40 distinct query shapes × ~50 pages (or one marathon
 * ~2000-page cursor) without touching short sessions (tens of pages). Eviction
 * runs on the MaintenanceScheduler tick after TTL cleanup — intra-day overshoot
 * until the next tick is accepted (same class as other maintenance work).
 */
export const MAX_SEARCH_RESULTS_CACHE_ROWS = 2000;

/**
 * Soft ceiling on total `response_payload` UTF-8 bytes across all rows.
 * Row cap alone cannot bound a table of large JSON pages. Eviction deletes
 * oldest-by-`resolved_at` until under this sum. Measured as
 * `SUM(LENGTH(COALESCE(response_payload, '')))` — keys/status columns excluded.
 */
export const MAX_SEARCH_RESULTS_CACHE_PAYLOAD_BYTES = 32 * 1024 * 1024;

/**
 * Version of the JSON payload stored in search_results_cache.response_payload.
 * Bump when the DSL shape changes; unknown versions are cache-misses.
 */
export const SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION = 1;
