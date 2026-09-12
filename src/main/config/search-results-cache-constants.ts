/**
 * SQLite TTL for Browse search page rows (found and not_found).
 * Expired rows are treated as cache-misses (re-fetch); maintenance DELETEs them.
 */
export const SEARCH_RESULTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
 * Version of the JSON payload stored in search_results_cache.response_payload.
 * Bump when the DSL shape changes; unknown versions are cache-misses.
 */
export const SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION = 1;
