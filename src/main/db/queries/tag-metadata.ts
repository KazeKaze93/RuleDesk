import type Database from "better-sqlite3";
import { TAG_RESOLVE_NOT_FOUND_TTL_MS } from "../../config/tag-resolve-constants";
import { asMillis, nowMillis, type Millis } from "../../../shared/types/time";

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Delete expired not_found rows from tag_metadata.
 * `resolved_at` is stored in Millis (schema mode timestamp_ms).
 * Cutoff uses branded Millis — must stay aligned with Drizzle writes.
 *
 * @returns number of deleted rows
 */
export function deleteExpiredNotFoundTagMetadata(
  sqlite: SqliteDatabase,
  nowMs: Millis = nowMillis()
): number {
  const cutoffMs = asMillis(nowMs - TAG_RESOLVE_NOT_FOUND_TTL_MS);
  const result = sqlite
    .prepare(
      `DELETE FROM tag_metadata
       WHERE status = 'not_found' AND resolved_at < ?`
    )
    .run(cutoffMs);
  return result.changes;
}
