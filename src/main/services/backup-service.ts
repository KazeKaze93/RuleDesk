import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import log from "electron-log";
import { getBackupDirectory, getDatabasePaths } from "../db/paths";
import {
  closeDatabase,
  initializeDatabase,
} from "../db/client";
import { registerDatabaseInContainerAfterReinit } from "../core/di/databaseRegistration";
import { maintenanceQueue } from "../db/maintenance-queue";
import { getBackupRetention } from "../lib/backup-retention";
import {
  buildAutoBackupFilename,
  createConsistentBackup,
  listAutoBackupFilesOldestFirst,
  selectAutoBackupFilenamesToDelete,
} from "../lib/database-backup";
import { getBackupSidecarPath } from "../lib/backup-sidecar";
import { withSyncPausedForDbWork } from "../lib/sync-db-maintenance";
import type { SyncService } from "./sync-service";

export type AutoBackupInterval = "never" | "daily" | "weekly";

export const BACKUP_SETTINGS_STORE_NAME = "backup-settings";

/** Constructor / greenfield default for every install. */
const DEFAULT_AUTO_BACKUP_INTERVAL: AutoBackupInterval = "daily";

/**
 * Store field default is 0; bump when auto-backup policy semantics change.
 * v1: flip persisted `never` → `daily` only when the opt-in prompt was never seen.
 */
export const CURRENT_BACKUP_POLICY_VERSION = 1;

/**
 * Require free space on the backup volume ≥ this many times the live DB file
 * size before closing the DB for auto-backup (`VACUUM INTO` needs headroom).
 */
const AUTO_BACKUP_FREE_SPACE_SIZE_MULTIPLIER = 2;

type BackupStoreSchema = {
  autoBackupInterval: AutoBackupInterval;
  lastAutoBackupAt: number | null;
  hasSeenAutoBackupPrompt: boolean;
  backupPolicyVersion: number;
};

const AUTO_BACKUP_INTERVAL_MS: Record<Exclude<AutoBackupInterval, "never">, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/**
 * How often to re-evaluate whether the Daily/Weekly policy period has elapsed
 * while the app stays open (startup still runs an immediate check).
 */
export const AUTO_BACKUP_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export type BackupStoreContract = {
  get<K extends keyof BackupStoreSchema>(key: K): BackupStoreSchema[K];
  set<K extends keyof BackupStoreSchema>(key: K, value: BackupStoreSchema[K]): void;
};

type BackupStoreConstructor = new (options: {
  name: string;
  defaults: BackupStoreSchema;
  cwd?: string;
}) => BackupStoreContract;

export type AutoBackupFreeSpaceProbe = (directoryPath: string) => number;

function isBackupStoreConstructor(v: unknown): v is BackupStoreConstructor {
  return typeof v === "function";
}

let StoreConstructor: BackupStoreConstructor | null = null;

function getStoreConstructor(): BackupStoreConstructor {
  if (StoreConstructor !== null) {
    return StoreConstructor;
  }
  // Lazy require: top-level createRequire("electron-store") pulls the real
  // `electron` package (a binary path string) and has hung Vitest workers on CI.
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
  StoreConstructor = resolvedConstructor;
  return StoreConstructor;
}

let store: BackupStoreContract | null = null;
let freeSpaceProbeForTests: AutoBackupFreeSpaceProbe | null = null;

/**
 * Available bytes on the volume that holds `directoryPath` (`fs.statfsSync`).
 * Injectable in unit tests via `setAutoBackupFreeSpaceProbeForTests`.
 */
function getAvailableBytesOnVolume(directoryPath: string): number {
  if (freeSpaceProbeForTests !== null) {
    return freeSpaceProbeForTests(directoryPath);
  }
  const stats = fs.statfsSync(directoryPath);
  return Number(stats.bavail) * Number(stats.bsize);
}

function getBackupStore(): BackupStoreContract {
  if (!store) {
    store = new (getStoreConstructor())({
      name: BACKUP_SETTINGS_STORE_NAME,
      defaults: {
        autoBackupInterval: DEFAULT_AUTO_BACKUP_INTERVAL,
        lastAutoBackupAt: null,
        hasSeenAutoBackupPrompt: false,
        backupPolicyVersion: 0,
      },
    });
  }
  return store;
}

/**
 * Apply `backupPolicyVersion` migrations. Idempotent once version ≥ current.
 * Never overwrites `never` when the user has already seen the opt-in prompt.
 */
function applyBackupPolicyMigration(): void {
  const backupStore = getBackupStore();
  const version = backupStore.get("backupPolicyVersion");
  if (version >= CURRENT_BACKUP_POLICY_VERSION) {
    return;
  }

  if (
    backupStore.get("autoBackupInterval") === "never" &&
    backupStore.get("hasSeenAutoBackupPrompt") === false
  ) {
    backupStore.set("autoBackupInterval", "daily");
    log.info(
      "[BackupService] Migrated autoBackupInterval never → daily (backup policy v1; prompt never seen)"
    );
  }

  backupStore.set("backupPolicyVersion", CURRENT_BACKUP_POLICY_VERSION);
}

/** Clears the module singleton so tests can simulate a fresh process. */
export function resetBackupStoreForTests(): void {
  store = null;
  freeSpaceProbeForTests = null;
}

/**
 * Install a pre-built store (e.g. `conf` with an explicit `cwd`) so tests never
 * construct `electron-store` (which loads the real `electron` package via createRequire).
 */
export function setBackupStoreForTests(next: BackupStoreContract): void {
  store = next;
}

/** Override free-space probe for unit tests (null restores `fs.statfsSync`). */
export function setAutoBackupFreeSpaceProbeForTests(
  probe: AutoBackupFreeSpaceProbe | null
): void {
  freeSpaceProbeForTests = probe;
}

export function buildBackupStoreDefaultsForTests(): BackupStoreSchema {
  return {
    autoBackupInterval: DEFAULT_AUTO_BACKUP_INTERVAL,
    lastAutoBackupAt: null,
    hasSeenAutoBackupPrompt: false,
    backupPolicyVersion: 0,
  };
}

export class BackupService {
  private readonly syncService: SyncService;
  private checkTimer: ReturnType<typeof setInterval> | null = null;

  constructor(syncService: SyncService) {
    this.syncService = syncService;
  }

  public scheduleAutoBackup(interval: AutoBackupInterval): void {
    applyBackupPolicyMigration();
    getBackupStore().set("autoBackupInterval", interval);
    log.info(`[BackupService] Auto-backup interval set to "${interval}"`);
  }

  public getAutoBackupSchedule(): AutoBackupInterval {
    applyBackupPolicyMigration();
    return getBackupStore().get("autoBackupInterval");
  }

  public shouldShowAutoBackupPrompt(): boolean {
    applyBackupPolicyMigration();
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

  /**
   * Start the hourly due-check timer. Does not run an immediate check —
   * callers still invoke `checkAndRunAutoBackup` on startup.
   */
  public startPeriodicCheck(): void {
    this.stopPeriodicCheck();
    this.checkTimer = setInterval(() => {
      this.checkAndRunAutoBackup();
    }, AUTO_BACKUP_CHECK_INTERVAL_MS);
    log.info(
      `[BackupService] Periodic auto-backup check started (every ${AUTO_BACKUP_CHECK_INTERVAL_MS}ms)`
    );
  }

  public stopPeriodicCheck(): void {
    if (this.checkTimer !== null) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      log.info("[BackupService] Periodic auto-backup check stopped");
    }
  }

  public checkAndRunAutoBackup(): void {
    applyBackupPolicyMigration();
    void this.runAutoBackupIfDue();
  }

  private async runAutoBackupIfDue(): Promise<void> {
    // Policy migration runs in checkAndRunAutoBackup (sync) before this async entry.
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
    const { dbPath } = getDatabasePaths();
    let dbFileSizeBytes = 0;
    try {
      dbFileSizeBytes = fs.statSync(dbPath).size;
    } catch (statError) {
      log.warn(
        "[BackupService] Skipping auto-backup because the database file could not be sized:",
        statError
      );
      return;
    }

    const requiredFreeBytes = dbFileSizeBytes * AUTO_BACKUP_FREE_SPACE_SIZE_MULTIPLIER;
    let availableBytes: number;
    try {
      availableBytes = getAvailableBytesOnVolume(backupDir);
    } catch (spaceError) {
      log.warn(
        "[BackupService] Skipping auto-backup because free space on the backup volume could not be read:",
        spaceError
      );
      return;
    }

    if (availableBytes < requiredFreeBytes) {
      log.warn(
        `[BackupService] Skipping auto-backup: free space on backup volume ` +
          `(${availableBytes} bytes) is below ${AUTO_BACKUP_FREE_SPACE_SIZE_MULTIPLIER}× DB size ` +
          `(${requiredFreeBytes} bytes required)`
      );
      return;
    }

    const backupFilename = buildAutoBackupFilename(new Date(now));
    const backupPath = path.join(backupDir, backupFilename);

    try {
      await maintenanceQueue.execute(async () => {
        await withSyncPausedForDbWork(this.syncService, async () => {
          closeDatabase();
          try {
            await createConsistentBackup(dbPath, backupPath);
          } finally {
            await initializeDatabase();
            registerDatabaseInContainerAfterReinit();
          }
        });
      });
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
