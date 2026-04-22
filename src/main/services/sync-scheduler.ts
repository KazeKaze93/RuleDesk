import log from "electron-log";
import type { SyncService } from "./sync-service";

const MIN_INTERVAL_MINUTES = 5;

export class SyncScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private syncService: SyncService;

  constructor(syncService: SyncService) {
    this.syncService = syncService;
  }

  /** Start or restart the scheduler with the given interval.
   *  Pass 0 or negative to disable. */
  public restart(intervalMinutes: number): void {
    this.stop();
    if (intervalMinutes < MIN_INTERVAL_MINUTES) {
      log.info(`[SyncScheduler] Disabled (interval=${intervalMinutes})`);
      return;
    }
    const ms = intervalMinutes * 60 * 1000;
    log.info(`[SyncScheduler] Started with interval=${intervalMinutes}min`);
    this.timer = setInterval(() => {
      this.runSync();
    }, ms);
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
      log.info("[SyncScheduler] Stopped");
    }
  }

  private runSync(): void {
    if (this.syncService.getIsSyncing()) {
      log.info("[SyncScheduler] Skipping scheduled sync - already syncing");
      return;
    }
    log.info("[SyncScheduler] Running scheduled sync");
    this.syncService.syncAllArtists().catch((error) => {
      log.error("[SyncScheduler] Scheduled sync failed:", error);
    });
  }
}
