import type Database from "better-sqlite3";
import { SEARCH_RESULTS_CACHE_TTL_MS } from "../../config/search-results-cache-constants";

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
