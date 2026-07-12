import type Database from "better-sqlite3";
import { TAG_RESOLVE_NOT_FOUND_TTL_MS } from "../../config/tag-resolve-constants";

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Delete expired not_found rows from tag_metadata.
 * `resolved_at` is stored in milliseconds (schema mode timestamp_ms).
 * Cutoff uses Date.now()-based ms — must stay aligned with Drizzle writes.
 *
 * @returns number of deleted rows
 */
export function deleteExpiredNotFoundTagMetadata(
  sqlite: SqliteDatabase,
  nowMs: number = Date.now()
): number {
  const cutoffMs = nowMs - TAG_RESOLVE_NOT_FOUND_TTL_MS;
  const result = sqlite
    .prepare(
      `DELETE FROM tag_metadata
       WHERE status = 'not_found' AND resolved_at < ?`
    )
    .run(cutoffMs);
  return result.changes;
}
