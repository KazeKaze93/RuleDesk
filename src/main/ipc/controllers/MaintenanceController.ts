import { type IpcMainInvokeEvent } from "electron";
import { app, dialog, type BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { registerDatabaseInContainerAfterReinit } from "../../core/di/databaseRegistration";
import { IPC_CHANNELS } from "../channels";
import {
  getSqliteInstance,
  closeDatabase,
  initializeDatabase,
} from "../../db/client";
import { maintenanceQueue } from "../../db/maintenance-queue";
import type { SyncService } from "../../services/sync-service";
import type { BackupService, AutoBackupInterval } from "../../services/backup-service";
import type { MaintenanceService } from "../../services/MaintenanceService";
import { getBackupDirectory, getDatabasePaths } from "../../db/paths";
import {
  getBackupSidecarPath,
  logRestoredSettingsSnapshot,
  restoreBackupSidecar,
} from "../../lib/backup-sidecar";
import { getBackupRetention } from "../../lib/backup-retention";
import { markBackupsExceedingSizeCap } from "../../lib/backup-retention-size-cap";
import {
  buildManualBackupFilename,
  createConsistentBackup,
  isManualBackupFilename,
} from "../../lib/database-backup";
import { restoreDatabaseFromBackup } from "../../lib/database-restore";
import { IdSchema } from "../../../shared/schemas/ipc";
import {
  SetVacuumScheduleArgsSchema,
  type VacuumSchedule,
  type VacuumStatusResponse,
  type RunVacuumResponse,
} from "../../../shared/schemas/maintenance";

const MAX_TOTAL_BACKUP_BYTES = (() => {
  const rawValue = process.env.BACKUP_RETENTION_MAX_TOTAL_MB;
  if (!rawValue) {
    return 0;
  }
  const parsedMb = Number(rawValue);
  if (!Number.isFinite(parsedMb) || parsedMb <= 0) {
    return 0;
  }
  return Math.floor(parsedMb * 1024 * 1024);
})();
const AutoBackupIntervalSchema = z.enum(["never", "daily", "weekly"]);

/**
 * Maintenance Controller
 *
 * Handles maintenance-related IPC operations:
 * - Database backup creation
 * - Database restore from backup
 * - Sync operations
 * - VACUUM status / schedule / run
 */
// Query style: Drizzle Builder API only in this controller.
export class MaintenanceController extends BaseController {
  private mainWindow: BrowserWindow | null = null;
  private readonly maintenanceService: MaintenanceService;

  constructor(maintenanceService: MaintenanceService) {
    super();
    this.maintenanceService = maintenanceService;
  }

  /**
   * Set main window reference (needed for backup/restore UI feedback)
   *
   * @param window - Main browser window instance
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private getSyncService(): SyncService {
    return container.resolve(DI_TOKENS.SYNC_SERVICE);
  }

  private getBackupService(): BackupService {
    return container.resolve(DI_TOKENS.BACKUP_SERVICE);
  }

  /**
   * Setup IPC handlers for maintenance operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.SYNC_ALL,
      z.tuple([]),
      this.syncAllArtists.bind(this)
    );
    this.handle(
      IPC_CHANNELS.SYNC.REPAIR,
      z.tuple([IdSchema]),
      (event, ...args) => this.repairArtist(event, IdSchema.parse(args[0]))
    );
    this.handle(
      IPC_CHANNELS.BACKUP.CREATE,
      z.tuple([]),
      this.createBackup.bind(this)
    );
    this.handle(
      IPC_CHANNELS.BACKUP.RESTORE,
      z.tuple([]),
      this.restoreBackup.bind(this)
    );
    this.handle(
      IPC_CHANNELS.BACKUP.INTEGRITY_CHECK,
      z.tuple([]),
      this.integrityCheck.bind(this)
    );
    this.handle(
      IPC_CHANNELS.BACKUP.GET_SCHEDULE,
      z.tuple([]),
      this.getBackupSchedule.bind(this),
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.BACKUP.SET_SCHEDULE,
      z.tuple([AutoBackupIntervalSchema]),
      (event, ...args) =>
        this.setBackupSchedule(event, AutoBackupIntervalSchema.parse(args[0]))
    );
    this.handle(
      IPC_CHANNELS.MAINTENANCE.GET_VACUUM_STATUS,
      z.tuple([]),
      this.getVacuumStatus.bind(this),
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.MAINTENANCE.RUN_VACUUM,
      z.tuple([]),
      this.runVacuum.bind(this)
    );
    this.handle(
      IPC_CHANNELS.MAINTENANCE.GET_VACUUM_SCHEDULE,
      z.tuple([]),
      this.getVacuumSchedule.bind(this),
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.MAINTENANCE.SET_VACUUM_SCHEDULE,
      SetVacuumScheduleArgsSchema,
      (event, args) => {
        // BaseController already validated; re-parse narrows unknown → typed (handle args are unknown[]).
        const payload = SetVacuumScheduleArgsSchema.parse(args);
        return this.setVacuumSchedule(event, payload.schedule);
      }
    );

    log.info("[MaintenanceController] All handlers registered");
  }

  private getVacuumStatus(_event: IpcMainInvokeEvent): VacuumStatusResponse {
    try {
      return this.maintenanceService.getVacuumStatus();
    } catch (error) {
      log.error("[MaintenanceController] get-vacuum-status failed:", error);
      throw error;
    }
  }

  private async runVacuum(_event: IpcMainInvokeEvent): Promise<RunVacuumResponse> {
    try {
      return await this.maintenanceService.runVacuum();
    } catch (error) {
      log.error("[MaintenanceController] run-vacuum failed:", error);
      throw error;
    }
  }

  private getVacuumSchedule(_event: IpcMainInvokeEvent): VacuumSchedule {
    try {
      return this.maintenanceService.getSchedule();
    } catch (error) {
      log.error("[MaintenanceController] get-vacuum-schedule failed:", error);
      throw error;
    }
  }

  private setVacuumSchedule(
    _event: IpcMainInvokeEvent,
    schedule: VacuumSchedule
  ): boolean {
    try {
      return this.maintenanceService.setSchedule(schedule);
    } catch (error) {
      log.error("[MaintenanceController] set-vacuum-schedule failed:", error);
      throw error;
    }
  }

  /**
   * Start background sync for all artists
   *
   * @param _event - IPC event (unused)
   * @returns true if sync started successfully
   */
  private async syncAllArtists(_event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      const syncService = this.getSyncService();
      log.info("[MaintenanceController] Starting background sync...");
      
      syncService.syncAllArtists().catch((error) => {
        log.error("[MaintenanceController] Critical background sync error:", error);
        syncService.sendEvent(
          IPC_CHANNELS.SYNC.ERROR,
          error instanceof Error ? error.message : "Sync failed."
        );
      });
      
      return true;
    } catch (error) {
      log.error("[MaintenanceController] Failed to start sync:", error);
      throw error;
    }
  }

  /**
   * Repair sync for a specific artist
   *
   * @param _event - IPC event (unused)
   * @param artistId - Artist ID to repair
   * @returns Success status object
   */
  private async repairArtist(
    _event: IpcMainInvokeEvent,
    artistId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const syncService = this.getSyncService();
      await syncService.repairArtist(artistId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create database backup
   *
   * @param _event - IPC event (unused)
   * @returns Backup result with path
   */
  private async createBackup(
    _event: IpcMainInvokeEvent
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    // Execute backup operation in maintenance queue to prevent race conditions
    return maintenanceQueue.execute(async () => {
      try {
      const backupDir = getBackupDirectory();
      const backupPath = path.join(backupDir, buildManualBackupFilename());

      // Ensure backup directory exists (getBackupDirectory already mkdir's; keep access check for races)
      try {
        await fs.promises.access(backupDir);
      } catch {
        await fs.promises.mkdir(backupDir, { recursive: true });
      }

      // Validate path is absolute and within the backup directory
      const normalizedBackupPath = path.resolve(backupPath);
      const normalizedBackupDir = path.resolve(backupDir);
      if (!normalizedBackupPath.startsWith(normalizedBackupDir)) {
        throw new Error("Backup path validation failed: path outside backup directory");
      }

      // Send loading event before VACUUM (which freezes the UI)
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("APP:LOADING", {
          loading: true,
          message: "Creating backup...",
        });
        // Notify OS that app is busy (prevents "app not responding" warnings)
        if (this.mainWindow.isVisible()) {
          this.mainWindow.flashFrame(true);
        }
        app.focus({ steal: false });
      }

      const sqlite = getSqliteInstance();
      createConsistentBackup(sqlite, backupPath);

      // Send loading complete event
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("APP:LOADING", { loading: false });
        this.mainWindow.flashFrame(false);
      }

        await this.cleanupOldBackups(backupDir);
        log.info(`[MaintenanceController] Backup created at ${backupPath}`);
        return {
          success: true,
          path: backupPath,
        };
      } catch (error) {
        // Ensure loading state is cleared on error
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("APP:LOADING", { loading: false });
        }
        log.error("[MaintenanceController] Backup failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }

  private async cleanupOldBackups(backupDir: string): Promise<void> {
    try {
      const backupRetention = getBackupRetention();
      const entries = await fs.promises.readdir(backupDir);

      // Manual retention only — excludes `.ruledesk-backup-auto-*` and legacy `.bin`.
      const backupFiles = entries
        .filter((name) => isManualBackupFilename(name))
        .map((name) => ({
          name,
          fullPath: path.join(backupDir, name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      const toDelete = new Set<string>();

      if (backupFiles.length > backupRetention) {
        const retainedByCount = backupFiles.slice(
          backupFiles.length - backupRetention
        );
        for (const file of backupFiles) {
          if (!retainedByCount.some((kept) => kept.fullPath === file.fullPath)) {
            toDelete.add(file.fullPath);
          }
        }
      }

      if (MAX_TOTAL_BACKUP_BYTES > 0) {
        const existingFiles = await Promise.all(
          backupFiles.map(async (file) => {
            const stat = await fs.promises.stat(file.fullPath);
            return {
              ...file,
              size: stat.size,
            };
          })
        );
        const newestFirst = [...existingFiles].sort((a, b) =>
          b.name.localeCompare(a.name)
        );
        markBackupsExceedingSizeCap(
          newestFirst,
          MAX_TOTAL_BACKUP_BYTES,
          toDelete
        );
      }

      for (const file of backupFiles) {
        if (!toDelete.has(file.fullPath)) {
          continue;
        }
        try {
          await fs.promises.rm(file.fullPath, { force: true });
          await fs.promises.rm(getBackupSidecarPath(file.fullPath), { force: true });
          log.info(`[MaintenanceController] Deleted old backup: ${file.name}`);
        } catch (deleteError) {
          // Non-fatal: log warning but don't fail the whole backup operation
          log.warn(`[MaintenanceController] Failed to delete old backup ${file.name}:`, deleteError);
        }
      }

      log.info(
        `[MaintenanceController] Retention cleanup: kept ${
          backupFiles.length - toDelete.size
        }, deleted ${toDelete.size}${
          MAX_TOTAL_BACKUP_BYTES > 0
            ? `, maxTotalBytes=${MAX_TOTAL_BACKUP_BYTES}`
            : ""
        }`
      );
    } catch (error) {
      // Non-fatal: retention cleanup failure should never break backup creation
      log.warn("[MaintenanceController] Backup retention cleanup failed:", error);
    }
  }

  /**
   * Restore database from backup
   *
   * @param _event - IPC event (unused)
   * @returns Restore result
   */
  private async restoreBackup(
    _event: IpcMainInvokeEvent
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return {
        success: false,
        error: "Main window not available",
      };
    }

    const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
      title: "Select backup file",
      defaultPath: getBackupDirectory(),
      // `.bin` = legacy auto-backups; `.db`/`.sqlite` = unified + manual format.
      // Integrity_check is the real validity gate — extensions are UX only.
      filters: [
        { name: "RuleDesk Backup", extensions: ["db", "sqlite", "bin"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (canceled || !filePaths.length) {
      return { success: false, error: "Canceled by user" };
    }

    // Execute restore operation in maintenance queue to prevent race conditions
    return maintenanceQueue.execute(async () => {
      try {
        const backupPath = filePaths[0];

        // Send loading event before restore operation
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("APP:LOADING", {
            loading: true,
            message: "Restoring database...",
          });
        }

        const result = await restoreDatabaseFromBackup(backupPath, {
          getPaths: getDatabasePaths,
          closeDatabase,
          initializeDatabase,
          afterSuccessfulReinit: registerDatabaseInContainerAfterReinit,
          restoreSidecar: restoreBackupSidecar,
          logSettingsSnapshot: logRestoredSettingsSnapshot,
        });

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("APP:LOADING", { loading: false });
        }

        return result;
      } catch (error) {
        // Ensure loading state is cleared on error
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("APP:LOADING", { loading: false });
        }
        log.error("[MaintenanceController] Restore failed:", error);
        // Attempt to reinitialize database even if restore failed (within queue, safe from concurrent access)
        try {
          await initializeDatabase();
          registerDatabaseInContainerAfterReinit();
        } catch (initError) {
          log.error("[MaintenanceController] Failed to reinitialize database after restore error:", initError);
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }

  private integrityCheck(
    _event: IpcMainInvokeEvent
  ): { ok: boolean; details: string } {
    try {
      const sqlite = getSqliteInstance();
      // PRAGMA/VACUUM: no Drizzle equivalent, raw SQL required
      // PRAGMA integrity_check returns rows: [{ integrity_check: "ok" }] if healthy
      // or multiple rows with problem descriptions if corrupted
      const rows = sqlite
        .prepare<[], { integrity_check: string }>("PRAGMA integrity_check")
        .all();

      const isOk = rows.length === 1 && rows[0]?.integrity_check === "ok";
      const details = rows.map((r) => r.integrity_check).join("\n");

      log.info(
        `[MaintenanceController] Integrity check result: ${
          isOk ? "ok" : "ISSUES FOUND"
        }`
      );

      return { ok: isOk, details };
    } catch (error) {
      log.error("[MaintenanceController] Integrity check failed:", error);
      throw error;
    }
  }

  private getBackupSchedule(_event: IpcMainInvokeEvent): AutoBackupInterval {
    return this.getBackupService().getAutoBackupSchedule();
  }

  private setBackupSchedule(
    _event: IpcMainInvokeEvent,
    interval: AutoBackupInterval
  ): boolean {
    this.getBackupService().scheduleAutoBackup(interval);
    return true;
  }
}

