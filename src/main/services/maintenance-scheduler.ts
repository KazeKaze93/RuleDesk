import log from "electron-log";
import { getSqliteInstance } from "../db/client";
import { maintenanceQueue } from "../db/maintenance-queue";
import {
  deleteExpiredTagMetadata,
  enforceTagMetadataRowCap,
} from "../db/queries/tag-metadata";
import {
  deleteExpiredSearchResultsCache,
  enforceSearchResultsCachePayloadByteCap,
  enforceSearchResultsCacheRowCap,
} from "../db/queries/search-results-cache";
import {
  deleteExpiredPostLookupCache,
  enforcePostLookupCacheRowCap,
} from "../db/queries/post-lookup-cache";
import type { MaintenanceService } from "./MaintenanceService";
import type { VideoProxyServer } from "./video-proxy-server";

const STARTUP_DELAY_MS = 10_000;
const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

export class MaintenanceScheduler {
  private startupTimer: ReturnType<typeof setTimeout> | null = null;
  private dailyTimer: ReturnType<typeof setInterval> | null = null;
  private readonly videoProxyServer: VideoProxyServer | null;
  private readonly maintenanceService: MaintenanceService | null;

  constructor(
    videoProxyServer?: VideoProxyServer,
    maintenanceService?: MaintenanceService
  ) {
    this.videoProxyServer = videoProxyServer ?? null;
    this.maintenanceService = maintenanceService ?? null;
  }

  public start(): void {
    this.startupTimer = setTimeout(() => {
      this.runMaintenance("startup");
      this.dailyTimer = setInterval(() => {
        this.runMaintenance("scheduled");
      }, DAILY_INTERVAL_MS);
    }, STARTUP_DELAY_MS);
  }

  public stop(): void {
    if (this.startupTimer !== null) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }

    if (this.dailyTimer !== null) {
      clearInterval(this.dailyTimer);
      this.dailyTimer = null;
    }
  }

  private runMaintenance(trigger: "startup" | "scheduled"): void {
    // Yield to event loop to keep startup/UI responsive.
    setImmediate(() => {
      void maintenanceQueue
        .execute(async () => {
          const sqlite = getSqliteInstance();
          // PRAGMA/VACUUM: no Drizzle equivalent, raw SQL required
          sqlite.exec("PRAGMA wal_checkpoint(PASSIVE);");
          sqlite.exec("PRAGMA optimize;");

          const deletedExpiredTags = deleteExpiredTagMetadata(sqlite);
          if (deletedExpiredTags > 0) {
            log.info(
              `[MaintenanceScheduler] Deleted ${deletedExpiredTags} expired tag_metadata rows`
            );
          }

          const deletedOverCapTags = enforceTagMetadataRowCap(sqlite);
          if (deletedOverCapTags > 0) {
            log.info(
              `[MaintenanceScheduler] Evicted ${deletedOverCapTags} tag_metadata rows over row cap`
            );
          }

          const deletedExpiredSearchPages = deleteExpiredSearchResultsCache(sqlite);
          if (deletedExpiredSearchPages > 0) {
            log.info(
              `[MaintenanceScheduler] Deleted ${deletedExpiredSearchPages} expired search_results_cache rows`
            );
          }

          const deletedOverCapSearchPages = enforceSearchResultsCacheRowCap(sqlite);
          if (deletedOverCapSearchPages > 0) {
            log.info(
              `[MaintenanceScheduler] Evicted ${deletedOverCapSearchPages} search_results_cache rows over row cap`
            );
          }

          const deletedOverBytesSearchPages =
            enforceSearchResultsCachePayloadByteCap(sqlite);
          if (deletedOverBytesSearchPages > 0) {
            log.info(
              `[MaintenanceScheduler] Evicted ${deletedOverBytesSearchPages} search_results_cache rows over payload-byte cap`
            );
          }

          const deletedExpiredPostLookups = deleteExpiredPostLookupCache(sqlite);
          if (deletedExpiredPostLookups > 0) {
            log.info(
              `[MaintenanceScheduler] Deleted ${deletedExpiredPostLookups} expired post_lookup_cache rows`
            );
          }

          const deletedOverCapPostLookups = enforcePostLookupCacheRowCap(sqlite);
          if (deletedOverCapPostLookups > 0) {
            log.info(
              `[MaintenanceScheduler] Evicted ${deletedOverCapPostLookups} post_lookup_cache rows over row cap`
            );
          }

          log.info(
            `[MaintenanceScheduler] Maintenance complete (trigger=${trigger})`
          );
        })
        .catch((error: unknown) => {
          log.error("[MaintenanceScheduler] Maintenance failed:", error);
        })
        .finally(() => {
          // Yield after sync SQLite work so IPC can run before the cache directory walk.
          const videoProxy = this.videoProxyServer;
          if (videoProxy !== null) {
            setImmediate(() => {
              try {
                videoProxy.evictCache();
              } catch (error) {
                log.error(
                  "[MaintenanceScheduler] Video cache eviction failed:",
                  error
                );
              }
            });
          }

          // After lightweight maintenance: due weekly/monthly VACUUM (closes DB).
          // Uses the existing daily tick — day granularity is enough for 7d/30d schedules;
          // do not change STARTUP_DELAY_MS / DAILY_INTERVAL_MS frequencies.
          this.scheduleVacuumIfDue();
        });
    });
  }

  private scheduleVacuumIfDue(): void {
    const maintenanceService = this.maintenanceService;
    if (maintenanceService === null) {
      return;
    }

    setImmediate(() => {
      void maintenanceService
        .runVacuumIfScheduleDue()
        .then((result) => {
          if (result === null) {
            return;
          }
          if (result.success) {
            log.info(
              `[MaintenanceScheduler] Scheduled VACUUM succeeded (durationMs=${result.durationMs ?? "n/a"})`
            );
            return;
          }
          log.error(
            `[MaintenanceScheduler] Scheduled VACUUM failed: ${result.error ?? "unknown"}`
          );
        })
        .catch((error: unknown) => {
          log.error("[MaintenanceScheduler] Scheduled VACUUM threw:", error);
        });
    });
  }
}
