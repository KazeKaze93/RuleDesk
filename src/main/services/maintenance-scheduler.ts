import log from "electron-log";
import { getSqliteInstance } from "../db/client";
import type { VideoProxyServer } from "./video-proxy-server";
import { TAG_RESOLVE_NOT_FOUND_TTL_MS } from "../config/tag-resolve-constants";

const STARTUP_DELAY_MS = 10_000;
const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

export class MaintenanceScheduler {
  private startupTimer: ReturnType<typeof setTimeout> | null = null;
  private dailyTimer: ReturnType<typeof setInterval> | null = null;
  private readonly videoProxyServer: VideoProxyServer | null;

  constructor(videoProxyServer?: VideoProxyServer) {
    this.videoProxyServer = videoProxyServer ?? null;
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
      try {
        const sqlite = getSqliteInstance();
        // PRAGMA/VACUUM: no Drizzle equivalent, raw SQL required
        sqlite.exec("PRAGMA wal_checkpoint(PASSIVE);");
        sqlite.exec("PRAGMA optimize;");

        const expiredNotFoundCutoffMs =
          Date.now() - TAG_RESOLVE_NOT_FOUND_TTL_MS;
        const deletedExpiredNotFound = sqlite
          .prepare(
            `DELETE FROM tag_metadata
             WHERE status = 'not_found' AND resolved_at < ?`
          )
          .run(expiredNotFoundCutoffMs);
        if (deletedExpiredNotFound.changes > 0) {
          log.info(
            `[MaintenanceScheduler] Deleted ${deletedExpiredNotFound.changes} expired not_found tag_metadata rows`
          );
        }

        log.info(`[MaintenanceScheduler] Maintenance complete (trigger=${trigger})`);
      } catch (error) {
        log.error("[MaintenanceScheduler] Maintenance failed:", error);
      }

      if (this.videoProxyServer !== null) {
        try {
          this.videoProxyServer.evictCache();
        } catch (error) {
          log.error("[MaintenanceScheduler] Video cache eviction failed:", error);
        }
      }
    });
  }
}
