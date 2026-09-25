import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import log from "electron-log";
import { getBackupDirectory } from "../db/paths";
import { getSqliteInstance } from "../db/client";
import { maintenanceQueue } from "../db/maintenance-queue";
import { getBackupRetention } from "../lib/backup-retention";
import {
  buildAutoBackupFilename,
  createConsistentBackup,
  listAutoBackupFilesOldestFirst,
  selectAutoBackupFilenamesToDelete,
} from "../lib/database-backup";
import {
  getBackupSidecarPath,
  getElectronStoreConfigPath,
} from "../lib/backup-sidecar";
import type { SyncService } from "./sync-service";

export type AutoBackupInterval = "never" | "daily" | "weekly";

export const BACKUP_SETTINGS_STORE_NAME = "backup-settings";

const DEFAULT_AUTO_BACKUP_INTERVAL_NEW_INSTALL: AutoBackupInterval = "daily";
const DEFAULT_AUTO_BACKUP_INTERVAL_EXISTING: AutoBackupInterval = "never";

type BackupStoreSchema = {
  autoBackupInterval: AutoBackupInterval;
  lastAutoBackupAt: number | null;
  hasSeenAutoBackupPrompt: boolean;
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
  cwd?: string;
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
let settingsFileExistedBeforeInit: boolean | null = null;
/** When set, passed as `cwd` to electron-store (Vitest has no real Electron userData). */
let storeCwdForTests: string | null = null;

/**
 * Whether `backup-settings.json` already existed on disk **before** the first
 * `electron-store` / `conf` construction in this process. Cached on first call
 * so a constructor side-effect that creates the file cannot flip the answer.
 */
export function backupSettingsFileExistedBeforeInit(): boolean {
  if (settingsFileExistedBeforeInit === null) {
    settingsFileExistedBeforeInit = fs.existsSync(
      getElectronStoreConfigPath(BACKUP_SETTINGS_STORE_NAME)
    );
  }
  return settingsFileExistedBeforeInit;
}

// Eager probe at module load — must run before any getBackupStore() in this process.
backupSettingsFileExistedBeforeInit();

function defaultAutoBackupInterval(): AutoBackupInterval {
  return backupSettingsFileExistedBeforeInit()
    ? DEFAULT_AUTO_BACKUP_INTERVAL_EXISTING
    : DEFAULT_AUTO_BACKUP_INTERVAL_NEW_INSTALL;
}

function getBackupStore(): BackupStoreContract {
  if (!store) {
    store = new StoreConstructor({
      name: BACKUP_SETTINGS_STORE_NAME,
      defaults: {
        autoBackupInterval: defaultAutoBackupInterval(),
        lastAutoBackupAt: null,
        hasSeenAutoBackupPrompt: false,
      },
      ...(storeCwdForTests !== null ? { cwd: storeCwdForTests } : {}),
    });
  }
  return store;
}

/** Clears the module singleton so tests can simulate a fresh process. */
export function resetBackupStoreForTests(): void {
  store = null;
  settingsFileExistedBeforeInit = null;
  storeCwdForTests = null;
}

/** Points electron-store at a temp dir (createRequire bypasses Vitest electron mocks). */
export function setBackupStoreCwdForTests(cwd: string): void {
  storeCwdForTests = cwd;
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

  public shouldShowAutoBackupPrompt(): boolean {
    const backupStore = getBackupStore();
    return (
      backupStore.get("autoBackupInterval") === "never" &&
      backupStore.get("hasSeenAutoBackupPrompt") === false
    );
  }

  public markAutoBackupPromptSeen(): void {
    getBackupStore().set("hasSeenAutoBackupPrompt", true);
    log.info("[BackupService] Auto-backup opt-in prompt marked as seen");
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

    const backupDir = getBackupDirectory();
    const backupFilename = buildAutoBackupFilename(new Date(now));
    const backupPath = path.join(backupDir, backupFilename);

    try {
      const sqlite = getSqliteInstance();
      createConsistentBackup(sqlite, backupPath);
      backupStore.set("lastAutoBackupAt", now);
      this.cleanupOldAutoBackups(backupDir);
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
