import { type IpcMainInvokeEvent } from "electron";
import { app, dialog, type BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import log from "electron-log";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { IPC_CHANNELS } from "../channels";
import {
  getDb,
  getSqliteInstance,
  closeDatabase,
  initializeDatabase,
} from "../../db/client";
import { maintenanceQueue } from "../../db/maintenance-queue";
import { settings, SETTINGS_ID } from "../../db/schema";
import type { SyncService } from "../../services/sync-service";
import { BACKUP_FILE_PREFIX, getDatabasePaths } from "../../db/paths";
import { IdSchema } from "../../../shared/schemas/ipc";

const DEFAULT_BACKUP_RETENTION = 5;
const MIN_BACKUP_RETENTION = 1;
const MAX_BACKUP_RETENTION = 20;

/**
 * IPC controllers resolve the DB via DI. After closeDatabase + initializeDatabase the
 * underlying sqlite/drizzle instances are new, but the container still held the old
 * (closed) reference — every query would fail until full app restart.
 */
function registerDatabaseInContainerAfterReinit(): void {
  container.register(DI_TOKENS.DB, getDb());
}

/**
 * Maintenance Controller
 *
 * Handles maintenance-related IPC operations:
 * - Database backup creation
 * - Database restore from backup
 * - Sync operations
 */
// Query style: Drizzle Builder API only in this controller.
export class MaintenanceController extends BaseController {
  private mainWindow: BrowserWindow | null = null;

  /**
   * Set main window reference (needed for backup/restore UI feedback)
   *
   * @param window - Main browser window instance
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private getBackupRetention(): number {
    const db = container.resolve(DI_TOKENS.DB);
    const currentSettings = db
      .select({
        backupRetention: settings.backupRetention,
      })
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1)
      .all()[0];

    const retention = currentSettings?.backupRetention ?? DEFAULT_BACKUP_RETENTION;
    return Math.max(
      MIN_BACKUP_RETENTION,
      Math.min(MAX_BACKUP_RETENTION, retention)
    );
  }

  private getSyncService(): SyncService {
    return container.resolve(DI_TOKENS.SYNC_SERVICE);
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
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.repairArtist.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
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

    log.info("[MaintenanceController] All handlers registered");
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
      const backupDir = app.getPath("userData");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(
        backupDir,
        `${BACKUP_FILE_PREFIX}-${timestamp}.db`
      );

      // Ensure backup directory exists
      try {
        await fs.promises.access(backupDir);
      } catch {
        await fs.promises.mkdir(backupDir, { recursive: true });
      }

      // Validate path is absolute and within user data directory
      const normalizedBackupPath = path.resolve(backupPath);
      const normalizedBackupDir = path.resolve(backupDir);
      if (!normalizedBackupPath.startsWith(normalizedBackupDir)) {
        throw new Error("Backup path validation failed: path outside user data directory");
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
      // PRAGMA/VACUUM: no Drizzle equivalent, raw SQL required
      const stmt = sqlite.prepare("VACUUM INTO ?");
      stmt.run(backupPath);

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
      const backupRetention = this.getBackupRetention();
      const entries = await fs.promises.readdir(backupDir);
      const escapedBackupPrefix = BACKUP_FILE_PREFIX.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const backupFileRegex = new RegExp(`^${escapedBackupPrefix}-.+\\.db$`);

      // Sort ascending so oldest files come first; we keep the newest N.
      const backupFiles = entries
        .filter((name) => backupFileRegex.test(name))
        .map((name) => ({
          name,
          fullPath: path.join(backupDir, name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (backupFiles.length <= backupRetention) {
        return; // Nothing to clean up
      }

      const toDelete = backupFiles.slice(0, backupFiles.length - backupRetention);

      for (const file of toDelete) {
        try {
          await fs.promises.rm(file.fullPath, { force: true });
          log.info(`[MaintenanceController] Deleted old backup: ${file.name}`);
        } catch (deleteError) {
          // Non-fatal: log warning but don't fail the whole backup operation
          log.warn(`[MaintenanceController] Failed to delete old backup ${file.name}:`, deleteError);
        }
      }

      log.info(
        `[MaintenanceController] Retention cleanup: kept ${backupRetention}, deleted ${toDelete.length}`
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
      filters: [{ name: "SQLite DB", extensions: ["db", "sqlite"] }],
      properties: ["openFile"],
    });

    if (canceled || !filePaths.length) {
      return { success: false, error: "Canceled by user" };
    }

    // Execute restore operation in maintenance queue to prevent race conditions
    return maintenanceQueue.execute(async () => {
      try {
        const backupPath = filePaths[0];
        if (backupPath.includes("\0")) {
          return {
            success: false,
            error: "Invalid backup path",
          };
        }

      // Check if backup file exists
      try {
        await fs.promises.access(backupPath);
      } catch {
        return {
          success: false,
          error: "Backup file not found",
        };
      }

      // Send loading event before restore operation
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("APP:LOADING", {
          loading: true,
          message: "Restoring database...",
        });
      }

      // Close database to release file locks
      closeDatabase();

      // Define paths for DB and WAL/SHM files
      const { dbPath, walPath, shmPath } = getDatabasePaths();
      const tempDbPath = `${dbPath}.tmp`;

      // Safety rollback: Rename existing files to .bak instead of deleting
      const bakPaths = {
        db: `${dbPath}.bak`,
        wal: `${walPath}.bak`,
        shm: `${shmPath}.bak`,
      };

      const renameToBak = async (source: string, target: string) => {
        try {
          await fs.promises.access(source);
          await fs.promises.rename(source, target);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
          }
        }
      };

      // Step 1: Rename current files to .bak (preserve original state)
      await renameToBak(dbPath, bakPaths.db);
      await renameToBak(walPath, bakPaths.wal);
      await renameToBak(shmPath, bakPaths.shm);

      try {
        // Step 2: Copy backup file to temporary path (atomic operation)
        await fs.promises.copyFile(backupPath, tempDbPath);

        // Step 3: Verify integrity of temporary database before replacing main DB
        let tempDb: InstanceType<typeof Database> | null = null;
        try {
          tempDb = new Database(tempDbPath, {
            readonly: true,
          });

          // PRAGMA integrity_check returns rows: [{ integrity_check: "ok" }] when healthy
          // (better-sqlite3 pragma() with simple:false returns row objects, not string[])
          const integrityRows = tempDb
            .prepare("PRAGMA integrity_check")
            .all() as { integrity_check: string }[];
          const isValid =
            integrityRows.length === 1 && integrityRows[0]?.integrity_check === "ok";

          if (!isValid) {
            const errorMsg = integrityRows
              .map((r) => r.integrity_check)
              .join("; ");
            throw new Error(
              `Database integrity check failed: ${errorMsg || "unknown result"}`
            );
          }

          log.info("[MaintenanceController] Backup file integrity check passed");
        } finally {
          if (tempDb) {
            tempDb.close();
          }
        }

        // Step 4: Integrity check passed - atomically replace main DB with temp file
        await fs.promises.rename(tempDbPath, dbPath);

        // Step 5: Clean up .bak files (restore was successful)
        const deleteBak = async (bakPath: string) => {
          try {
            await fs.promises.access(bakPath);
            await fs.promises.rm(bakPath, { force: true });
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
              log.warn(`[MaintenanceController] Failed to delete backup file ${bakPath}:`, error);
            }
          }
        };

        await deleteBak(bakPaths.db);
        await deleteBak(bakPaths.wal);
        await deleteBak(bakPaths.shm);

        // Step 6: Reinitialize database connection (within queue, safe from concurrent access)
        await initializeDatabase();
        registerDatabaseInContainerAfterReinit();

        // Send loading complete event
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("APP:LOADING", { loading: false });
        }

        log.info(`[MaintenanceController] Database restored from ${backupPath}`);
        return {
          success: true,
          message: "Database restored successfully.",
        };
      } catch (restoreError) {
        // Rollback: Restore .bak files back to original names
        log.error("[MaintenanceController] Restore failed, rolling back:", restoreError);

        // Clean up temporary file if it exists
        try {
          await fs.promises.access(tempDbPath);
          await fs.promises.rm(tempDbPath, { force: true });
        } catch {
          // Ignore errors when cleaning up temp file
        }

        const restoreFromBak = async (bakPath: string, originalPath: string) => {
          try {
            await fs.promises.access(bakPath);
            await fs.promises.rename(bakPath, originalPath);
          } catch (error) {
            log.error(`[MaintenanceController] Failed to restore ${originalPath} from backup:`, error);
          }
        };

        await restoreFromBak(bakPaths.db, dbPath);
        await restoreFromBak(bakPaths.wal, walPath);
        await restoreFromBak(bakPaths.shm, shmPath);

        // Attempt to reinitialize database with restored files (within queue, safe from concurrent access)
        try {
          await initializeDatabase();
          registerDatabaseInContainerAfterReinit();
        } catch (initError) {
          log.error("[MaintenanceController] Failed to reinitialize database after rollback:", initError);
        }

        // Ensure loading state is cleared on error
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("APP:LOADING", { loading: false });
        }

        const errorMessage =
          restoreError instanceof Error
            ? restoreError.message
            : "Restore failed, rolled back to previous state.";
        log.error(`[MaintenanceController] Restore failed, rolled back. Error: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage,
        };
      }
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
}

