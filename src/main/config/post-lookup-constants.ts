/**
 * SQLite TTL for confirmed not_found post_lookup_cache rows.
 * Deleted/banned booru posts rarely return, unlike tags that may appear later —
 * 30 days vs tag TTL of 7 days. Expired rows are cache-misses (re-lookup);
 * maintenance DELETEs them.
 */
export const POST_LOOKUP_NOT_FOUND_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * SQLite TTL for `found` post_lookup_cache rows.
 * Much larger than `POST_LOOKUP_NOT_FOUND_TTL_MS`. Rows are outcome markers only
 * (no post body); they still need a bound so shadow-insert traffic cannot grow
 * the table forever. Expired `found` rows are cache-misses; maintenance DELETEs them.
 */
export const POST_LOOKUP_FOUND_TTL_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * Soft ceiling on `post_lookup_cache` row count inside the TTL window.
 * One row per provider+postId from shadow-insert traffic; TTL alone cannot bound
 * a long-lived library of external views. Eviction deletes oldest-by-`resolved_at`.
 */
export const MAX_POST_LOOKUP_CACHE_ROWS = 20_000;

/**
 * Page size for a single-id `id:${postId}` lookup. Matches the prior
 * PostsController shadow-insert default; not a full sync page.
 */
export const POST_LOOKUP_SINGLE_ID_PAGE_LIMIT = 50;
