import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { AutoBackupInterval } from "../services/backup-service";
import { settings, SETTINGS_ID } from "../db/schema";
import { getDb } from "../db/client";
import { isErrnoException } from "../../shared/utils/type-guards";

export const BACKUP_SIDECAR_SUFFIX = ".settings.json";

export type BackupSidecarV1 = {
  version: 1;
  exportedAt: string;
  backupSchedule: {
    autoBackupInterval: AutoBackupInterval;
    lastAutoBackupAt: number | null;
  };
};

function getElectronStoreConfigPath(storeName: string): string {
  return path.join(app.getPath("userData"), `${storeName}.json`);
}

function readBackupScheduleFromDisk(): BackupSidecarV1["backupSchedule"] {
  const defaults: BackupSidecarV1["backupSchedule"] = {
    autoBackupInterval: "never",
    lastAutoBackupAt: null,
  };

  const BackupScheduleSchema = z.object({
    autoBackupInterval: z.enum(["never", "daily", "weekly"]).optional(),
    lastAutoBackupAt: z.number().nullable().optional(),
  });

  const configPath = getElectronStoreConfigPath("backup-settings");
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = BackupScheduleSchema.safeParse(JSON.parse(raw));
    const data = parsed.success ? parsed.data : {};

    return {
      autoBackupInterval: data.autoBackupInterval ?? defaults.autoBackupInterval,
      lastAutoBackupAt:
        typeof data.lastAutoBackupAt === "number" ? data.lastAutoBackupAt : null,
    };
  } catch (error) {
    if (isErrnoException(error) && error.code !== "ENOENT") {
      log.warn("[BackupSidecar] Failed to read backup schedule file:", error);
    }
    return defaults;
  }
}

export function getBackupSidecarPath(backupDbPath: string): string {
  return `${backupDbPath}${BACKUP_SIDECAR_SUFFIX}`;
}

export function writeBackupSidecar(backupDbPath: string): void {
  const sidecar: BackupSidecarV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    backupSchedule: readBackupScheduleFromDisk(),
  };

  const sidecarPath = getBackupSidecarPath(backupDbPath);
  fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2), "utf-8");
  log.info(`[BackupSidecar] Wrote settings sidecar: ${sidecarPath}`);
}

export function restoreBackupSidecar(backupDbPath: string): boolean {
  const sidecarPath = getBackupSidecarPath(backupDbPath);
  if (!fs.existsSync(sidecarPath)) {
    return false;
  }

  const BackupSidecarSchema = z.object({
    version: z.literal(1),
    exportedAt: z.string(),
    backupSchedule: z.object({
      autoBackupInterval: z.enum(["never", "daily", "weekly"]),
      lastAutoBackupAt: z.number().nullable(),
    }),
  });

  try {
    const raw = fs.readFileSync(sidecarPath, "utf-8");
    const parseResult = BackupSidecarSchema.safeParse(JSON.parse(raw));
    if (!parseResult.success) {
      log.warn("[BackupSidecar] Unsupported sidecar version, skipping restore");
      return false;
    }
    const parsed = parseResult.data;

    const configPath = getElectronStoreConfigPath("backup-settings");
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          autoBackupInterval: parsed.backupSchedule.autoBackupInterval,
          lastAutoBackupAt: parsed.backupSchedule.lastAutoBackupAt,
        },
        null,
        2
      ),
      "utf-8"
    );

    log.info(`[BackupSidecar] Restored backup schedule from ${sidecarPath}`);
    return true;
  } catch (error) {
    log.warn("[BackupSidecar] Failed to restore sidecar:", error);
    return false;
  }
}

/** Confirms settings row exists in restored DB (for logging only). */
export function logRestoredSettingsSnapshot(): void {
  try {
    const db = getDb();
    const row = db
      .select({
        userId: settings.userId,
        provider: settings.provider,
        hasApiKey: settings.encryptedApiKey,
        theme: settings.theme,
        backupRetention: settings.backupRetention,
      })
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1)
      .all()[0];

    if (row) {
      log.info(
        `[BackupSidecar] Restored DB settings: provider=${row.provider}, userId=${
          row.userId ? "set" : "empty"
        }, hasApiKey=${!!row.hasApiKey}, theme=${row.theme}, backupRetention=${
          row.backupRetention
        }`
      );
    }
  } catch (error) {
    log.warn("[BackupSidecar] Could not read settings after restore:", error);
  }
}
