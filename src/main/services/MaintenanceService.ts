import log from "electron-log";
import { eq } from "drizzle-orm";
import { getDb, getSqliteInstance } from "../db/client";
import { settings, SETTINGS_ID } from "../db/schema";
import type {
  RunVacuumResponse,
  VacuumSchedule,
  VacuumStatusResponse,
} from "../../shared/schemas/maintenance";

type VacuumDbStatus = "success" | "error";

export class MaintenanceService {
  private isRunning = false;

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

  public runVacuum(): RunVacuumResponse {
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

    try {
      const sqlite = getSqliteInstance();
      sqlite.exec("VACUUM;");

      const finishedAt = Date.now();
      getDb()
        .update(settings)
        .set({
          lastVacuumAt: finishedAt,
          lastVacuumStatus: "success",
          lastVacuumError: null,
        })
        .where(eq(settings.id, SETTINGS_ID))
        .run();

      return {
        success: true,
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
      };
    } catch (error) {
      const finishedAt = Date.now();
      const message = error instanceof Error ? error.message : "VACUUM failed";

      getDb()
        .update(settings)
        .set({
          lastVacuumAt: finishedAt,
          lastVacuumStatus: "error" satisfies VacuumDbStatus,
          lastVacuumError: message,
        })
        .where(eq(settings.id, SETTINGS_ID))
        .run();

      log.error("[MaintenanceService] VACUUM failed:", error);
      return {
        success: false,
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        error: message,
      };
    } finally {
      this.isRunning = false;
    }
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
