import log from "electron-log";
import { getSqliteInstance } from "./client";
import { getMediaTypeFromUrl } from "@shared/utils/media";

/**
 * Background backfill of posts.media_type after startup.
 * Cursor by id so rows that stay NULL (URL yields no type) are visited once.
 */
export const BACKFILL_MEDIA_TYPE_BATCH_SIZE = 150;
const BATCH_DELAY_MS = 10;

type NullMediaPostRow = {
  id: number;
  file_url: string | null;
};

/**
 * Fill media_type where NULL. Completes in one pass over NULL rows.
 * Undetermined types remain NULL (no placeholder). Batch errors are logged;
 * they do not abort the app or the remaining cursor walk.
 */
export async function backfillMediaType(): Promise<void> {
  const sqlite = getSqliteInstance();
  if (!sqlite) {
    log.warn(
      "[backfillMediaType] SQLite instance not available, skipping backfill"
    );
    return;
  }

  // boundary: better-sqlite3 raw row — prepare().get() row typing
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const countResult = sqlite
    .prepare("SELECT COUNT(*) as count FROM posts WHERE media_type IS NULL")
    .get() as { count: number } | undefined;

  const totalNulls = countResult?.count ?? 0;

  if (totalNulls === 0) {
    log.info(
      "[backfillMediaType] All posts already have media_type, skipping backfill"
    );
    return;
  }

  log.info(
    `[backfillMediaType] Starting backfill for ${totalNulls.toLocaleString()} posts ` +
      `(batches of ${BACKFILL_MEDIA_TYPE_BATCH_SIZE}, cursor by id)`
  );

  let lastId = 0;
  let processed = 0;
  let filled = 0;
  let undetermined = 0;
  let batches = 0;

  const selectBatch = sqlite.prepare(
    `SELECT id, file_url FROM posts
     WHERE media_type IS NULL AND id > ?
     ORDER BY id
     LIMIT ?`
  );
  const updateStmt = sqlite.prepare(
    "UPDATE posts SET media_type = ? WHERE id = ?"
  );

  while (true) {
    await new Promise<void>((resolve) => setImmediate(resolve));

    let batch: NullMediaPostRow[];
    try {
      // boundary: better-sqlite3 raw row
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
      batch = selectBatch.all(
        lastId,
        BACKFILL_MEDIA_TYPE_BATCH_SIZE
      ) as NullMediaPostRow[];
    } catch (error) {
      log.error(
        `[backfillMediaType] SELECT failed after lastId=${lastId}:`,
        error
      );
      break;
    }

    if (batch.length === 0) {
      break;
    }

    batches += 1;
    const batchFirstId = batch[0].id;
    const batchLastId = batch[batch.length - 1].id;

    try {
      let batchFilled = 0;
      let batchUndetermined = 0;

      const updateBatch = sqlite.transaction((posts: NullMediaPostRow[]) => {
        for (const post of posts) {
          const mediaType = getMediaTypeFromUrl(post.file_url);
          if (mediaType) {
            updateStmt.run(mediaType, post.id);
            batchFilled += 1;
          } else {
            batchUndetermined += 1;
          }
        }
      });

      updateBatch(batch);
      filled += batchFilled;
      undetermined += batchUndetermined;
      processed += batch.length;
      lastId = batchLastId;
    } catch (error) {
      log.error(
        `[backfillMediaType] Batch failed ids ${batchFirstId}..${batchLastId} (lastId was ${lastId}):`,
        error
      );
      // Advance past this batch so a sticky bad row cannot spin forever
      lastId = batchLastId;
      processed += batch.length;
    }

    if (processed % (BACKFILL_MEDIA_TYPE_BATCH_SIZE * 20) === 0) {
      log.info(
        `[backfillMediaType] Progress: ${processed.toLocaleString()}/${totalNulls.toLocaleString()} ` +
          `(${Math.round((processed / totalNulls) * 100)}%)`
      );
    }

    if (batch.length === BACKFILL_MEDIA_TYPE_BATCH_SIZE && BATCH_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  log.info(
    `[backfillMediaType] Backfill complete: filled ${filled.toLocaleString()}, ` +
      `undetermined ${undetermined.toLocaleString()} ` +
      `(processed ${processed.toLocaleString()} NULL rows in ${batches} batches)`
  );
}
