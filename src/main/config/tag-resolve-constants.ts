/**
 * Tag-resolve tuning constants (Main).
 * TTL for `tag_metadata` not_found lives in shared — used by Main maintenance
 * and Renderer TagsDrawer `staleTime` (must stay aligned).
 */
export { TAG_RESOLVE_NOT_FOUND_TTL_MS } from "../../shared/constants";

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
