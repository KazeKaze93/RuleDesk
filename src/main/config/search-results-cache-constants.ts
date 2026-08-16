/**
 * SQLite TTL for Browse search page rows (found and not_found).
 * Expired rows are treated as cache-misses (re-fetch); maintenance DELETEs them.
 */
export const SEARCH_RESULTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Version of the JSON payload stored in search_results_cache.response_payload.
 * Bump when the DSL shape changes; unknown versions are cache-misses.
 */
export const SEARCH_RESULTS_CACHE_PAYLOAD_SCHEMA_VERSION = 1;
