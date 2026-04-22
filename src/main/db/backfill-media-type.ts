import log from "electron-log";
import { getSqliteInstance } from "./client";
import { getMediaTypeFromUrl } from "@shared/utils/media";

/**
 * Background process to backfill media_type column for existing posts
 * 
 * This runs after app startup to avoid blocking Main Process during migration.
 * Updates media_type in batches (chunks) to prevent database lock.
 * 
 * Strategy:
 * - Process in small chunks (100-200 rows) to prevent Main Process blocking
 * - Use file extension to determine media_type (image vs video)
 * - Update only NULL values to avoid overwriting existing data
 * - Use setImmediate to yield control between batches, allowing IPC to process
 * - CRITICAL: better-sqlite3 is synchronous and blocks Event Loop
 *   Small batches + setImmediate prevent UI freezes on slow HDDs
 */
const BATCH_SIZE = 150; // Reduced from 1000 to prevent Main Process blocking
const BATCH_DELAY_MS = 10; // Reduced delay, setImmediate provides better yielding

/**
 * Backfill media_type column for existing posts
 * 
 * Runs in background after app startup. Processes in batches to avoid blocking.
 * 
 * @returns Promise that resolves when backfill completes
 */
export async function backfillMediaType(): Promise<void> {
  const sqlite = getSqliteInstance();
  if (!sqlite) {
    log.warn("[backfillMediaType] SQLite instance not available, skipping backfill");
    return;
  }

  try {
    // Check how many posts need backfill
    const countResult = sqlite
      .prepare("SELECT COUNT(*) as count FROM posts WHERE media_type IS NULL")
      .get() as { count: number } | undefined;
    
    const totalNulls = countResult?.count ?? 0;
    
    if (totalNulls === 0) {
      log.info("[backfillMediaType] All posts already have media_type, skipping backfill");
      return;
    }
    
    log.info(
      `[backfillMediaType] Starting backfill for ${totalNulls.toLocaleString()} posts ` +
      `(processing in batches of ${BATCH_SIZE})`
    );
    
    let processed = 0;
    let updated = 0;
    
    // Process in batches to avoid blocking Main Process
    // CRITICAL: Use setImmediate to yield control after each batch
    // This allows IPC handlers to process while backfill runs
    while (true) {
      // Yield control before each batch to allow IPC to process
      await new Promise<void>((resolve) => setImmediate(resolve));
      
      // Get batch of posts with NULL media_type
      // CRITICAL: This is synchronous and blocks Event Loop
      // Small BATCH_SIZE (150) minimizes blocking time
      const batch = sqlite
        .prepare(
          `SELECT id, file_url FROM posts 
           WHERE media_type IS NULL 
           LIMIT ?`
        )
        .all(BATCH_SIZE) as Array<{ id: number; file_url: string | null }>;
      
      if (batch.length === 0) {
        break; // No more rows to process
      }
      
      // Update each post in the batch
      // Bulk batch update: raw SQL for performance, Drizzle overhead unacceptable
      const updateStmt = sqlite.prepare(
        "UPDATE posts SET media_type = ? WHERE id = ?"
      );
      
      const updateBatch = sqlite.transaction((posts) => {
        for (const post of posts) {
          const mediaType = getMediaTypeFromUrl(post.file_url);
          if (mediaType) {
            updateStmt.run(mediaType, post.id);
            updated++;
          }
        }
      });
      
      updateBatch(batch);
      processed += batch.length;
      
      // Log progress every 20 batches (reduced frequency due to smaller batches)
      if (processed % (BATCH_SIZE * 20) === 0) {
        log.info(
          `[backfillMediaType] Progress: ${processed.toLocaleString()}/${totalNulls.toLocaleString()} ` +
          `(${Math.round((processed / totalNulls) * 100)}%)`
        );
      }
      
      // Additional delay for very slow systems (optional)
      if (batch.length === BATCH_SIZE && BATCH_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
    
    log.info(
      `[backfillMediaType] Backfill complete: ${updated.toLocaleString()} posts updated ` +
      `out of ${processed.toLocaleString()} processed`
    );
  } catch (error) {
    log.error("[backfillMediaType] Backfill failed:", error);
    // Don't throw - backfill failure shouldn't crash the app
    // Filter will handle NULL values gracefully
  }
}
