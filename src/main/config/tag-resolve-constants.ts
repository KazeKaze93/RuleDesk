/** In-memory TTL for tags confirmed absent from Rule34 tag DAPI (well-formed empty). */
export const TAG_RESOLVE_NEGATIVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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
