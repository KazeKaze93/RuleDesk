import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import log from "electron-log";
import { getDatabasePaths } from "../db/paths";
import { getSqliteInstance } from "../db/client";
import { maintenanceQueue } from "../db/maintenance-queue";
import { getBackupRetention } from "../lib/backup-retention";
import {
  buildAutoBackupFilename,
  createConsistentBackup,
  listAutoBackupFilesOldestFirst,
  selectAutoBackupFilenamesToDelete,
} from "../lib/database-backup";
import { getBackupSidecarPath } from "../lib/backup-sidecar";
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
    const backupFilename = buildAutoBackupFilename(new Date(now));
    const backupPath = path.join(dbDirectory, backupFilename);

    try {
      const sqlite = getSqliteInstance();
      createConsistentBackup(sqlite, backupPath);
      backupStore.set("lastAutoBackupAt", now);
      this.cleanupOldAutoBackups(dbDirectory);
      log.info(`[BackupService] Auto-backup created at ${backupPath}`);
    } catch (error) {
      log.error("[BackupService] Failed to create auto-backup:", error);
    }
  }

  private cleanupOldAutoBackups(backupDirectory: string): void {
    try {
      const retention = getBackupRetention();
      // Counts both legacy `.bin` and new `.ruledesk-backup-auto-*.db`, ordered by
      // mtime (not localeCompare — dotted new names sort before legacy `data.*`).
      const autoBackups = listAutoBackupFilesOldestFirst(backupDirectory);
      const filesToDelete = selectAutoBackupFilenamesToDelete(
        autoBackups,
        retention
      );

      for (const filename of filesToDelete) {
        const fullPath = path.join(backupDirectory, filename);
        try {
          fs.rmSync(fullPath, { force: true });
          fs.rmSync(getBackupSidecarPath(fullPath), { force: true });
          log.info(`[BackupService] Deleted old auto-backup: ${filename}`);
        } catch (deleteError) {
          // Non-fatal: continue pruning remaining files (mirrors manual backup path)
          log.warn(
            `[BackupService] Failed to delete old auto-backup ${filename}:`,
            deleteError
          );
        }
      }
    } catch (error) {
      log.warn("[BackupService] Auto-backup retention cleanup failed:", error);
    }
  }
}
