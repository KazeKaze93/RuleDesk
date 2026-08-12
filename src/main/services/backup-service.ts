import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import log from "electron-log";
import { getDatabasePaths } from "../db/paths";
import { getDb } from "../db/client";
import { maintenanceQueue } from "../db/maintenance-queue";
import { settings, SETTINGS_ID } from "../db/schema";
import { eq } from "drizzle-orm";
import type { SyncService } from "./sync-service";

export type AutoBackupInterval = "never" | "daily" | "weekly";

type BackupStoreSchema = {
  autoBackupInterval: AutoBackupInterval;
  lastAutoBackupAt: number | null;
};

const AUTO_BACKUP_INTERVAL_MS: Record<Exclude<AutoBackupInterval, "never">, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};
const AUTO_BACKUP_FILE_REGEX = /^data\.backup\.\d{4}-\d{2}-\d{2}\.bin$/;
const DEFAULT_BACKUP_RETENTION = 5;
const MIN_BACKUP_RETENTION = 1;
const MAX_BACKUP_RETENTION = 20;

type BackupStoreContract = {
  get<K extends keyof BackupStoreSchema>(key: K): BackupStoreSchema[K];
  set<K extends keyof BackupStoreSchema>(key: K, value: BackupStoreSchema[K]): void;
};

type BackupStoreConstructor = new (options: {
  name: string;
  defaults: BackupStoreSchema;
}) => BackupStoreContract;

function isBackupStoreConstructor(v: unknown): v is BackupStoreConstructor {
  return typeof v === "function";
}

const require = createRequire(import.meta.url);
const storeModule: unknown = require("electron-store");
const storeModuleDefault: unknown =
  typeof storeModule === "object" && storeModule !== null && "default" in storeModule
    ? storeModule.default
    : null;
const resolvedConstructor = isBackupStoreConstructor(storeModule)
  ? storeModule
  : storeModuleDefault;
if (!isBackupStoreConstructor(resolvedConstructor)) {
  throw new Error("[backup-service] electron-store module did not export a constructor");
}
const StoreConstructor: BackupStoreConstructor = resolvedConstructor;

let store: BackupStoreContract | null = null;

function getBackupStore(): BackupStoreContract {
  if (!store) {
    store = new StoreConstructor({
      name: "backup-settings",
      defaults: {
        autoBackupInterval: "never",
        lastAutoBackupAt: null,
      },
    });
  }
  return store;
}

const getDateStamp = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export class BackupService {
  private readonly syncService: SyncService;

  constructor(syncService: SyncService) {
    this.syncService = syncService;
  }

  public scheduleAutoBackup(interval: AutoBackupInterval): void {
    getBackupStore().set("autoBackupInterval", interval);
    log.info(`[BackupService] Auto-backup interval set to "${interval}"`);
  }

  public getAutoBackupSchedule(): AutoBackupInterval {
    return getBackupStore().get("autoBackupInterval");
  }

  public checkAndRunAutoBackup(): void {
    const backupStore = getBackupStore();
    const interval = backupStore.get("autoBackupInterval");
    if (interval === "never") {
      return;
    }

    const intervalMs = AUTO_BACKUP_INTERVAL_MS[interval];
    const lastAutoBackupAt = backupStore.get("lastAutoBackupAt");
    const now = Date.now();
    const elapsedMs = lastAutoBackupAt === null ? Number.POSITIVE_INFINITY : now - lastAutoBackupAt;

    if (elapsedMs < intervalMs) {
      return;
    }

    if (this.syncService.getIsSyncing()) {
      log.warn("[BackupService] Skipping auto-backup because sync is in progress");
      return;
    }

    if (maintenanceQueue.isProcessing()) {
      log.warn(
        "[BackupService] Skipping auto-backup because a maintenance operation is in progress"
      );
      return;
    }

    const { dbPath } = getDatabasePaths();
    const dbDirectory = path.dirname(dbPath);
    const backupFilename = `data.backup.${getDateStamp(new Date(now))}.bin`;
    const backupPath = path.join(dbDirectory, backupFilename);

    try {
      fs.copyFileSync(dbPath, backupPath);
      backupStore.set("lastAutoBackupAt", now);
      this.cleanupOldAutoBackups(dbDirectory);
      log.info(`[BackupService] Auto-backup created at ${backupPath}`);
    } catch (error) {
      log.error("[BackupService] Failed to create auto-backup:", error);
    }
  }

  private getBackupRetention(): number {
    const db = getDb();
    const currentSettings = db
      .select({
        backupRetention: settings.backupRetention,
      })
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1)
      .all()[0];
    const retention = currentSettings?.backupRetention ?? DEFAULT_BACKUP_RETENTION;
    return Math.max(MIN_BACKUP_RETENTION, Math.min(MAX_BACKUP_RETENTION, retention));
  }

  private cleanupOldAutoBackups(backupDirectory: string): void {
    try {
      const retention = this.getBackupRetention();
      const autoBackups = fs
        .readdirSync(backupDirectory)
        .filter((filename) => AUTO_BACKUP_FILE_REGEX.test(filename))
        .sort((left, right) => left.localeCompare(right));

      if (autoBackups.length <= retention) {
        return;
      }

      const filesToDelete = autoBackups.slice(0, autoBackups.length - retention);
      for (const filename of filesToDelete) {
        const fullPath = path.join(backupDirectory, filename);
        fs.rmSync(fullPath, { force: true });
        log.info(`[BackupService] Deleted old auto-backup: ${filename}`);
      }
    } catch (error) {
      log.warn("[BackupService] Auto-backup retention cleanup failed:", error);
    }
  }
}
