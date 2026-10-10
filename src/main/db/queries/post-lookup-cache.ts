import type Database from "better-sqlite3";
import {
  MAX_POST_LOOKUP_CACHE_ROWS,
  POST_LOOKUP_FOUND_TTL_MS,
  POST_LOOKUP_NOT_FOUND_TTL_MS,
} from "../../config/post-lookup-constants";

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Delete expired post_lookup_cache rows (`found` and `not_found`) using
 * status-specific TTLs. `resolved_at` is stored in milliseconds
 * (schema mode timestamp_ms). Cutoff uses Date.now()-based ms — must stay
 * aligned with Drizzle writes.
 *
 * @returns number of deleted rows
 */
export function deleteExpiredPostLookupCache(
  sqlite: SqliteDatabase,
  nowMs: number = Date.now()
): number {
  const notFoundCutoffMs = nowMs - POST_LOOKUP_NOT_FOUND_TTL_MS;
  const foundCutoffMs = nowMs - POST_LOOKUP_FOUND_TTL_MS;
  const result = sqlite
    .prepare(
      `DELETE FROM post_lookup_cache
       WHERE (status = 'not_found' AND resolved_at < ?)
          OR (status = 'found' AND resolved_at < ?)`
    )
    .run(notFoundCutoffMs, foundCutoffMs);
  return result.changes;
}

/**
 * If row count exceeds `MAX_POST_LOOKUP_CACHE_ROWS`, delete the oldest rows by
 * `resolved_at` (tie-break provider, post_id) until at the cap.
 *
 * Call after TTL cleanup on the same maintenance tick.
 *
 * @returns number of deleted rows
 */
export function enforcePostLookupCacheRowCap(
  sqlite: SqliteDatabase,
  maxRows: number = MAX_POST_LOOKUP_CACHE_ROWS
): number {
  if (maxRows <= 0) {
    return 0;
  }

  // boundary: better-sqlite3 raw row — prepare().get() row typing
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const countRow = sqlite
    .prepare(`SELECT COUNT(*) AS count FROM post_lookup_cache`)
    .get() as { count: number } | undefined;
  const count = countRow?.count ?? 0;
  const excess = count - maxRows;
  if (excess <= 0) {
    return 0;
  }

  const result = sqlite
    .prepare(
      `DELETE FROM post_lookup_cache
       WHERE (provider, post_id) IN (
         SELECT provider, post_id FROM post_lookup_cache
         ORDER BY resolved_at ASC, provider ASC, post_id ASC
         LIMIT ?
       )`
    )
    .run(excess);
  return result.changes;
}
