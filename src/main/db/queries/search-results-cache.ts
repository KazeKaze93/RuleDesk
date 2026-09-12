import type Database from "better-sqlite3";
import {
  MAX_SEARCH_RESULTS_CACHE_ROWS,
  SEARCH_RESULTS_CACHE_TTL_MS,
} from "../../config/search-results-cache-constants";

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Delete expired search_results_cache rows (found and not_found).
 * `resolved_at` is stored in milliseconds (schema mode timestamp_ms).
 * Cutoff uses Date.now()-based ms — must stay aligned with Drizzle writes.
 *
 * @returns number of deleted rows
 */
export function deleteExpiredSearchResultsCache(
  sqlite: SqliteDatabase,
  nowMs: number = Date.now()
): number {
  const cutoffMs = nowMs - SEARCH_RESULTS_CACHE_TTL_MS;
  const result = sqlite
    .prepare(
      `DELETE FROM search_results_cache
       WHERE resolved_at < ?`
    )
    .run(cutoffMs);
  return result.changes;
}

/**
 * If row count exceeds `MAX_SEARCH_RESULTS_CACHE_ROWS`, delete the oldest rows
 * by `resolved_at` (tie-break `cache_key`) until at the cap.
 *
 * Trade-off: there is no `last_accessed` column and cache hits do not bump
 * `resolved_at`, so we cannot pin "recently read but written earlier" pages
 * without a schema change. Newest writes (active scroll tip) sort last and are
 * kept; the live Browse viewport is primarily React Query memory — an SQLite
 * miss only forces an HTTP re-fetch on the next cache-first lookup.
 *
 * Call after TTL cleanup on the same maintenance tick.
 *
 * @returns number of deleted rows
 */
export function enforceSearchResultsCacheRowCap(
  sqlite: SqliteDatabase,
  maxRows: number = MAX_SEARCH_RESULTS_CACHE_ROWS
): number {
  if (maxRows <= 0) {
    return 0;
  }

  // boundary: better-sqlite3 raw row — prepare().get() row typing
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const countRow = sqlite
    .prepare(`SELECT COUNT(*) AS count FROM search_results_cache`)
    .get() as { count: number } | undefined;
  const count = countRow?.count ?? 0;
  const excess = count - maxRows;
  if (excess <= 0) {
    return 0;
  }

  const result = sqlite
    .prepare(
      `DELETE FROM search_results_cache
       WHERE cache_key IN (
         SELECT cache_key FROM search_results_cache
         ORDER BY resolved_at ASC, cache_key ASC
         LIMIT ?
       )`
    )
    .run(excess);
  return result.changes;
}
