import { SYNC_SHUTDOWN_DRAIN_MS } from "../config/constants";
import type { SyncService } from "../services/sync-service";

/**
 * Cancel in-flight sync, wait until idle, and hold new sync until ``work`` finishes.
 * Used before VACUUM / restore / wipe that close the SQLite handle.
 */
export async function withSyncPausedForDbWork<T>(
  syncService: SyncService,
  work: () => Promise<T>,
  timeoutMs: number = SYNC_SHUTDOWN_DRAIN_MS
): Promise<T> {
  const idle = await syncService.pauseForDbMaintenance(timeoutMs);
  if (!idle) {
    syncService.resumeAfterDbMaintenance();
    throw new Error(
      `Sync did not idle within ${timeoutMs}ms; refusing DB maintenance`
    );
  }
  try {
    return await work();
  } finally {
    syncService.resumeAfterDbMaintenance();
  }
}
