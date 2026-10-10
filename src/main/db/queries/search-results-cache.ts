import type Database from "better-sqlite3";
import {
  MAX_SEARCH_RESULTS_CACHE_PAYLOAD_BYTES,
  MAX_SEARCH_RESULTS_CACHE_ROWS,
  SEARCH_RESULTS_CACHE_FOUND_TTL_MS,
  SEARCH_RESULTS_CACHE_NOT_FOUND_TTL_MS,
} from "../../config/search-results-cache-constants";
import { asMillis, nowMillis, type Millis } from "../../../shared/types/time";

type SqliteDatabase = InstanceType<typeof Database>;

type PayloadSizeRow = {
  cache_key: string;
  payload_bytes: number;
};

/**
 * Delete expired search_results_cache rows (`found` and `not_found`) using
 * status-specific TTLs. `resolved_at` is stored in Millis (schema mode timestamp_ms).
 * Cutoff uses branded Millis — must stay aligned with Drizzle writes.
 *
 * @returns number of deleted rows
 */
export function deleteExpiredSearchResultsCache(
  sqlite: SqliteDatabase,
  nowMs: Millis = nowMillis()
): number {
  const notFoundCutoffMs = asMillis(nowMs - SEARCH_RESULTS_CACHE_NOT_FOUND_TTL_MS);
  const foundCutoffMs = asMillis(nowMs - SEARCH_RESULTS_CACHE_FOUND_TTL_MS);
  const result = sqlite
    .prepare(
      `DELETE FROM search_results_cache
       WHERE (status = 'not_found' AND resolved_at < ?)
          OR (status = 'found' AND resolved_at < ?)`
    )
    .run(notFoundCutoffMs, foundCutoffMs);
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

/**
 * If total `response_payload` bytes exceed `MAX_SEARCH_RESULTS_CACHE_PAYLOAD_BYTES`,
 * delete oldest rows by `resolved_at` until under the cap.
 *
 * Call after row-cap eviction on the same maintenance tick.
 *
 * @returns number of deleted rows
 */
export function enforceSearchResultsCachePayloadByteCap(
  sqlite: SqliteDatabase,
  maxBytes: number = MAX_SEARCH_RESULTS_CACHE_PAYLOAD_BYTES
): number {
  if (maxBytes <= 0) {
    return 0;
  }

  // boundary: better-sqlite3 raw row — prepare().get() row typing
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const sumRow = sqlite
    .prepare(
      `SELECT COALESCE(SUM(LENGTH(COALESCE(response_payload, ''))), 0) AS total
       FROM search_results_cache`
    )
    .get() as { total: number } | undefined;
  let totalBytes = sumRow?.total ?? 0;
  if (totalBytes <= maxBytes) {
    return 0;
  }

  // boundary: better-sqlite3 raw rows — prepare().all() row typing
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw rows
  const candidates = sqlite
    .prepare(
      `SELECT cache_key,
              LENGTH(COALESCE(response_payload, '')) AS payload_bytes
       FROM search_results_cache
       ORDER BY resolved_at ASC, cache_key ASC`
    )
    .all() as PayloadSizeRow[];

  const deleteStmt = sqlite.prepare(
    `DELETE FROM search_results_cache WHERE cache_key = ?`
  );
  let deleted = 0;
  for (const row of candidates) {
    if (totalBytes <= maxBytes) {
      break;
    }
    deleteStmt.run(row.cache_key);
    totalBytes -= row.payload_bytes;
    deleted += 1;
  }
  return deleted;
}
