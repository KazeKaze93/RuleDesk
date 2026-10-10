import type Database from "better-sqlite3";
import {
  MAX_TAG_METADATA_ROWS,
  TAG_RESOLVE_FOUND_TTL_MS,
  TAG_RESOLVE_NOT_FOUND_TTL_MS,
} from "../../config/tag-resolve-constants";
import { asMillis, nowMillis, type Millis } from "../../../shared/types/time";

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Delete expired tag_metadata rows (`found` and `not_found`) using status-specific TTLs.
 * `resolved_at` is stored in Millis (schema mode timestamp_ms).
 * Cutoff uses branded Millis — must stay aligned with Drizzle writes.
 *
 * @returns number of deleted rows
 */
export function deleteExpiredTagMetadata(
  sqlite: SqliteDatabase,
  nowMs: Millis = nowMillis()
): number {
  const notFoundCutoffMs = asMillis(nowMs - TAG_RESOLVE_NOT_FOUND_TTL_MS);
  const foundCutoffMs = asMillis(nowMs - TAG_RESOLVE_FOUND_TTL_MS);
  const result = sqlite
    .prepare(
      `DELETE FROM tag_metadata
       WHERE (status = 'not_found' AND resolved_at < ?)
          OR (status = 'found' AND resolved_at < ?)`
    )
    .run(notFoundCutoffMs, foundCutoffMs);
  return result.changes;
}

/**
 * If row count exceeds `MAX_TAG_METADATA_ROWS`, delete the oldest rows by
 * `resolved_at` (tie-break `name`) until at the cap.
 *
 * Call after TTL cleanup on the same maintenance tick.
 *
 * @returns number of deleted rows
 */
export function enforceTagMetadataRowCap(
  sqlite: SqliteDatabase,
  maxRows: number = MAX_TAG_METADATA_ROWS
): number {
  if (maxRows <= 0) {
    return 0;
  }

  // boundary: better-sqlite3 raw row — prepare().get() row typing
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const countRow = sqlite
    .prepare(`SELECT COUNT(*) AS count FROM tag_metadata`)
    .get() as { count: number } | undefined;
  const count = countRow?.count ?? 0;
  const excess = count - maxRows;
  if (excess <= 0) {
    return 0;
  }

  const result = sqlite
    .prepare(
      `DELETE FROM tag_metadata
       WHERE name IN (
         SELECT name FROM tag_metadata
         ORDER BY resolved_at ASC, name ASC
         LIMIT ?
       )`
    )
    .run(excess);
  return result.changes;
}
