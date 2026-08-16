import type Database from "better-sqlite3";
import { POST_LOOKUP_NOT_FOUND_TTL_MS } from "../../config/post-lookup-constants";

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Delete expired not_found rows from post_lookup_cache.
 * `resolved_at` is stored in milliseconds (schema mode timestamp_ms).
 * Cutoff uses Date.now()-based ms — must stay aligned with Drizzle writes.
 *
 * @returns number of deleted rows
 */
export function deleteExpiredNotFoundPostLookupCache(
  sqlite: SqliteDatabase,
  nowMs: number = Date.now()
): number {
  const cutoffMs = nowMs - POST_LOOKUP_NOT_FOUND_TTL_MS;
  const result = sqlite
    .prepare(
      `DELETE FROM post_lookup_cache
       WHERE status = 'not_found' AND resolved_at < ?`
    )
    .run(cutoffMs);
  return result.changes;
}
