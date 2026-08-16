/** Version of the canonical cache-key tuple (not the JSON payload). */
export const SEARCH_RESULTS_CACHE_KEY_VERSION = 1;

/**
 * Cache-key dimensions that actually vary at the SearchController.write site.
 * IPC `searchBooru` does not carry source/sortOrder/rating/aiFilter/mediaType.
 * Those Browse flags either rewrite the formatted `tags` string (AI/media
 * injection) or never reach this table (local source, worker sort, removed
 * rating filter). Constants in the key would be dead weight.
 */
export type SearchResultsCacheKeyInput = {
  provider: string;
  /** Formatted API tag query (includes injected AI/media tokens and cursor tag). */
  tags: string;
  page: number;
  limit: number;
  beforePostId?: number;
};

/**
 * Stable cache key. Array form keeps field order independent of object key order.
 */
export function buildSearchResultsCacheKey(
  input: SearchResultsCacheKeyInput
): string {
  return JSON.stringify([
    SEARCH_RESULTS_CACHE_KEY_VERSION,
    input.provider,
    input.tags,
    input.page,
    input.limit,
    input.beforePostId ?? null,
  ]);
}
