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
import { settings, SETTINGS_ID } from "../db/schema";
import { registerDatabaseInContainerAfterReinit } from "../core/di/databaseRegistration";
import type {
  RunVacuumResponse,
  VacuumSchedule,
  VacuumStatusResponse,
} from "../../shared/schemas/maintenance";

type VacuumDbStatus = "success" | "error";

export class MaintenanceService {
  private isRunning = false;

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
        if (!settled && code !== 0) {
          rejectOnce(new Error(`VACUUM worker exited with code ${code}`));
        }
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

    return {
      lastVacuumAt: state?.lastVacuumAt ?? null,
      lastRunStatus,
      lastError: state?.lastVacuumError ?? null,
      isRunning: this.isRunning,
    };
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

    this.ensureSettingsRecord();
    this.isRunning = true;

    let success = false;
    let errorMessage: string | null = null;

    try {
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
      log.error("[MaintenanceService] Failed to reinitialize database after VACUUM:", error);
    }

    const finishedAt = Date.now();
    this.isRunning = false;

    getDb()
      .update(settings)
      .set({
        lastVacuumAt: finishedAt,
        lastVacuumStatus: success ? "success" : ("error" satisfies VacuumDbStatus),
        lastVacuumError: success ? null : errorMessage ?? "VACUUM failed",
      })
      .where(eq(settings.id, SETTINGS_ID))
      .run();

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
      error: errorMessage ?? "VACUUM failed",
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
