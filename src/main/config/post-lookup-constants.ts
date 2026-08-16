/**
 * SQLite TTL for confirmed not_found post_lookup_cache rows.
 * Deleted/banned booru posts rarely return, unlike tags that may appear later —
 * 30 days vs tag TTL of 7 days. Expired rows are cache-misses (re-lookup);
 * maintenance DELETEs them.
 */
export const POST_LOOKUP_NOT_FOUND_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Page size for a single-id `id:${postId}` lookup. Matches the prior
 * PostsController shadow-insert default; not a full sync page.
 */
export const POST_LOOKUP_SINGLE_ID_PAGE_LIMIT = 50;
