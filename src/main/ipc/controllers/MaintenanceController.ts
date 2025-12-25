import { type IpcMainInvokeEvent } from "electron";
import { app, dialog, type BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { IPC_CHANNELS } from "../channels";
import { getSqliteInstance, closeDatabase, initializeDatabase } from "../../db/client";
import { maintenanceQueue } from "../../db/maintenance-queue";
import type { SyncService } from "../../services/sync-service";

/**
 * Maintenance Controller
 *
 * Handles maintenance-related IPC operations:
 * - Database backup creation
 * - Database restore from backup
 * - Sync operations
 */
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
      z.tuple([z.number().int().positive()]),
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
          "sync:error",
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
        `metadata-backup-${timestamp}.db`
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
      const stmt = sqlite.prepare("VACUUM INTO ?");
      stmt.run(backupPath);

      // Send loading complete event
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("APP:LOADING", { loading: false });
        this.mainWindow.flashFrame(false);
      }

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
      const dbPath = path.join(app.getPath("userData"), "metadata.db");
      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;
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

          // Run integrity check
          const integrityResult = tempDb.pragma("integrity_check", {
            simple: false,
          }) as string | string[];

          // integrity_check returns "ok" if database is valid, or an array of error messages
          const isValid =
            integrityResult === "ok" ||
            (Array.isArray(integrityResult) &&
              integrityResult.length === 1 &&
              integrityResult[0] === "ok");

          if (!isValid) {
            const errorMsg = Array.isArray(integrityResult)
              ? integrityResult.join("; ")
              : String(integrityResult);
            throw new Error(`Database integrity check failed: ${errorMsg}`);
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
}

