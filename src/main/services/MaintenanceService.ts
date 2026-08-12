import log from "electron-log";
import path from "path";
import { Worker } from "worker_threads";
import { eq } from "drizzle-orm";
import {
  closeDatabase,
  getDatabasePaths,
  getDb,
  initializeDatabase,
} from "../db/client";
import { maintenanceQueue } from "../db/maintenance-queue";
import { settings, SETTINGS_ID } from "../db/schema";
import { registerDatabaseInContainerAfterReinit } from "../core/di/databaseRegistration";
import type {
  RunVacuumResponse,
  VacuumSchedule,
  VacuumStatusResponse,
} from "../../shared/schemas/maintenance";

type VacuumDbStatus = "success" | "error";

type CachedVacuumStatus = {
  lastVacuumAt: number | null;
  lastRunStatus: "never" | "success" | "error";
  lastError: string | null;
};

export class MaintenanceService {
  private isRunning = false;
  private cachedStatus: CachedVacuumStatus = {
    lastVacuumAt: null,
    lastRunStatus: "never",
    lastError: null,
  };

  private runVacuumWorker(
    dbPath: string
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, "workers", "vacuumWorker.cjs");
      const worker = new Worker(workerPath, { workerData: { dbPath } });
      let settled = false;

      const resolveOnce = (result: { success: boolean; error?: string }) => {
        if (!settled) {
          settled = true;
          resolve(result);
        }
      };

      const rejectOnce = (error: Error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      worker.once("message", (message: { success?: boolean; error?: string }) => {
        if (message.success) {
          resolveOnce({ success: true });
          return;
        }

        resolveOnce({
          success: false,
          error: message.error ?? "VACUUM failed in worker",
        });
      });

      worker.once("error", (error) => {
        rejectOnce(error);
      });

      worker.once("exit", (code) => {
        if (settled) {
          return;
        }
        if (code !== 0) {
          rejectOnce(new Error(`VACUUM worker exited with code ${code}`));
          return;
        }
        // Allow a queued 'message' to settle first; exit(0) without payload is a hang risk.
        setImmediate(() => {
          if (!settled) {
            rejectOnce(new Error("VACUUM worker exited without result"));
          }
        });
      });
    });
  }

  private ensureSettingsRecord(): void {
    const db = getDb();
    const existing = db
      .select({ id: settings.id })
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1)
      .all()[0];

    if (!existing) {
      db.insert(settings)
        .values({
          id: SETTINGS_ID,
          userId: "",
          provider: "rule34",
          encryptedApiKey: "",
          isSafeMode: true,
          isAdultConfirmed: false,
          isAdultVerified: false,
          vacuumSchedule: "manual",
        })
        .run();
    }
  }

  public getVacuumStatus(): VacuumStatusResponse {
    // DB is closed for the worker segment of VACUUM — never call getDb() then.
    if (this.isRunning) {
      return {
        ...this.cachedStatus,
        isRunning: true,
      };
    }

    try {
      this.ensureSettingsRecord();
      const db = getDb();
      const state = db
        .select({
          lastVacuumAt: settings.lastVacuumAt,
          lastVacuumStatus: settings.lastVacuumStatus,
          lastVacuumError: settings.lastVacuumError,
        })
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];

      const status = state?.lastVacuumStatus;
      const lastRunStatus: "never" | "success" | "error" =
        status === "success" || status === "error" ? status : "never";

      this.cachedStatus = {
        lastVacuumAt: state?.lastVacuumAt ?? null,
        lastRunStatus,
        lastError: state?.lastVacuumError ?? null,
      };

      return {
        ...this.cachedStatus,
        isRunning: false,
      };
    } catch (error) {
      log.error("[MaintenanceService] getVacuumStatus failed:", error);
      return {
        ...this.cachedStatus,
        isRunning: this.isRunning,
      };
    }
  }

  public async runVacuum(): Promise<RunVacuumResponse> {
    const startedAt = Date.now();

    if (this.isRunning) {
      return {
        success: false,
        startedAt,
        error: "Already running",
      };
    }

    // Claim the in-memory lock before queue wait so a second IPC call returns
    // "Already running" instead of enqueueing a duplicate VACUUM.
    this.isRunning = true;

    try {
      return await maintenanceQueue.execute(() => this.executeVacuum(startedAt));
    } catch (error) {
      this.isRunning = false;
      const finishedAt = Date.now();
      const errorMessage =
        error instanceof Error ? error.message : "VACUUM failed";
      log.error("[MaintenanceService] VACUUM queue execution failed:", error);
      return {
        success: false,
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        error: errorMessage,
      };
    }
  }

  private async executeVacuum(startedAt: number): Promise<RunVacuumResponse> {
    let success = false;
    let errorMessage: string | null = null;

    try {
      this.ensureSettingsRecord();
      const { dbPath } = getDatabasePaths();
      closeDatabase();

      const workerResult = await this.runVacuumWorker(dbPath);
      success = workerResult.success;
      errorMessage = workerResult.error ?? null;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : "VACUUM failed";
      log.error("[MaintenanceService] VACUUM worker execution failed:", error);
    }

    try {
      await initializeDatabase();
      registerDatabaseInContainerAfterReinit();
    } catch (error) {
      success = false;
      const reinitErrorMessage =
        error instanceof Error ? error.message : "Database reinitialization failed";
      errorMessage = errorMessage
        ? `${errorMessage}; reinit failed: ${reinitErrorMessage}`
        : `Database reinitialization failed: ${reinitErrorMessage}`;
      log.error(
        "[MaintenanceService] Failed to reinitialize database after VACUUM:",
        error
      );
    }

    const finishedAt = Date.now();
    const lastVacuumError = success ? null : errorMessage ?? "VACUUM failed";
    const lastVacuumStatus: VacuumDbStatus = success ? "success" : "error";

    this.cachedStatus = {
      lastVacuumAt: finishedAt,
      lastRunStatus: lastVacuumStatus,
      lastError: lastVacuumError,
    };
    this.isRunning = false;

    try {
      getDb()
        .update(settings)
        .set({
          lastVacuumAt: finishedAt,
          lastVacuumStatus,
          lastVacuumError,
        })
        .where(eq(settings.id, SETTINGS_ID))
        .run();
    } catch (error) {
      // Reinit may have failed — keep IPC/UI response; do not throw and lose the result.
      log.error("[MaintenanceService] Failed to persist VACUUM status:", error);
    }

    if (success) {
      return {
        success: true,
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
      };
    }

    return {
      success: false,
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      error: lastVacuumError ?? "VACUUM failed",
    };
  }

  public getSchedule(): VacuumSchedule {
    this.ensureSettingsRecord();
    const current = getDb()
      .select({ vacuumSchedule: settings.vacuumSchedule })
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1)
      .all()[0];

    const schedule = current?.vacuumSchedule;
    if (schedule === "weekly" || schedule === "monthly") {
      return schedule;
    }
    return "manual";
  }

  public setSchedule(schedule: VacuumSchedule): boolean {
    this.ensureSettingsRecord();
    getDb()
      .update(settings)
      .set({ vacuumSchedule: schedule })
      .where(eq(settings.id, SETTINGS_ID))
      .run();
    return true;
  }
}
