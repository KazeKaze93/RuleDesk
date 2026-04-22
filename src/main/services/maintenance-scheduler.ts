import log from "electron-log";
import { getSqliteInstance } from "../db/client";

const STARTUP_DELAY_MS = 10_000;
const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

export class MaintenanceScheduler {
  private startupTimer: ReturnType<typeof setTimeout> | null = null;
  private dailyTimer: ReturnType<typeof setInterval> | null = null;

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
        sqlite.exec("PRAGMA wal_checkpoint(PASSIVE);");
        sqlite.exec("PRAGMA optimize;");
        log.info(`[MaintenanceScheduler] Maintenance complete (trigger=${trigger})`);
      } catch (error) {
        log.error("[MaintenanceScheduler] Maintenance failed:", error);
      }
    });
  }
}
