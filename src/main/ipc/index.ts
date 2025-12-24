import { BrowserWindow, ipcMain, dialog, clipboard, app } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { SyncService } from "../services/sync-service";
import { UpdaterService } from "../services/updater-service";
import { IPC_CHANNELS } from "./channels";
import { getDb, getSqliteInstance, closeDatabase, initializeDatabase } from "../db/client";
import { settings } from "../db/schema";
import { logger } from "../lib/logger";
import { z } from "zod";

import { registerPostHandlers } from "./handlers/posts";
import { registerArtistHandlers } from "./handlers/artists";
import { registerViewerHandlers } from "./handlers/viewer";
import { registerSettingsHandlers } from "./handlers/settings";
import { registerFileHandlers } from "./handlers/files";

const DeleteArtistSchema = z.number().int().positive();

// --- Helper для Sync & Maintenance ---
const registerSyncAndMaintenanceHandlers = (
  syncService: SyncService,
  mainWindow: BrowserWindow
) => {
  ipcMain.handle(IPC_CHANNELS.DB.SYNC_ALL, () => {
    logger.info("IPC: [DB.SYNC_ALL] Starting background sync...");
    syncService.syncAllArtists().catch((error) => {
      logger.error("IPC: Critical background sync error:", error);
      syncService.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Sync failed."
      );
    });
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.SYNC.REPAIR, async (_, artistId: unknown) => {
    const validId = DeleteArtistSchema.safeParse(artistId);
    if (!validId.success) return { success: false, error: "Invalid ID" };

    try {
      await syncService.repairArtist(validId.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP.CREATE, async () => {
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
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("APP:LOADING", {
          loading: true,
          message: "Creating backup...",
        });
        // Notify OS that app is busy (prevents "app not responding" warnings)
        if (mainWindow.isVisible()) {
          mainWindow.flashFrame(true);
        }
        app.focus({ steal: false });
      }

      const sqlite = getSqliteInstance();
      const stmt = sqlite.prepare("VACUUM INTO ?");
      stmt.run(backupPath);

      // Send loading complete event
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("APP:LOADING", { loading: false });
        mainWindow.flashFrame(false);
      }

      logger.info(`IPC: Backup created at ${backupPath}`);
      return {
        success: true,
        path: backupPath,
      };
    } catch (error) {
      // Ensure loading state is cleared on error
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("APP:LOADING", { loading: false });
      }
      logger.error("IPC: Backup failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP.RESTORE, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Select backup file",
      filters: [{ name: "SQLite DB", extensions: ["db", "sqlite"] }],
      properties: ["openFile"],
    });
    if (canceled || !filePaths.length)
      return { success: false, error: "Canceled by user" };

    try {
      const backupPath = filePaths[0];

      // Check if backup file exists using promises
      try {
        await fs.promises.access(backupPath);
      } catch {
        return {
          success: false,
          error: "Backup file not found",
        };
      }

      // Send loading event before restore operation
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("APP:LOADING", {
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

          logger.info("IPC: Backup file integrity check passed");
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
              logger.warn(`IPC: Failed to delete backup file ${bakPath}:`, error);
            }
          }
        };

        await deleteBak(bakPaths.db);
        await deleteBak(bakPaths.wal);
        await deleteBak(bakPaths.shm);

        // Step 6: Reinitialize database connection
        initializeDatabase();

        // Send loading complete event
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("APP:LOADING", { loading: false });
        }

        logger.info(`IPC: Database restored from ${backupPath}`);
        return {
          success: true,
          message: "Database restored successfully.",
        };
      } catch (restoreError) {
        // Rollback: Restore .bak files back to original names
        logger.error("IPC: Restore failed, rolling back:", restoreError);

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
            logger.error(`IPC: Failed to restore ${originalPath} from backup:`, error);
          }
        };

        await restoreFromBak(bakPaths.db, dbPath);
        await restoreFromBak(bakPaths.wal, walPath);
        await restoreFromBak(bakPaths.shm, shmPath);

        // Attempt to reinitialize database with restored files
        try {
          initializeDatabase();
        } catch (initError) {
          logger.error("IPC: Failed to reinitialize database after rollback:", initError);
        }

        // Ensure loading state is cleared on error
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("APP:LOADING", { loading: false });
        }

        const errorMessage =
          restoreError instanceof Error
            ? restoreError.message
            : "Restore failed, rolled back to previous state.";
        logger.error(`IPC: Restore failed, rolled back. Error: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      // Ensure loading state is cleared on error
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("APP:LOADING", { loading: false });
      }
      logger.error("IPC: Restore failed:", error);
      // Attempt to reinitialize database even if restore failed
      try {
        initializeDatabase();
      } catch (initError) {
        logger.error("IPC: Failed to reinitialize database after restore error:", initError);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
};

// --- Main Registration Function ---
export const registerAllHandlers = (
  syncService: SyncService,
  _updaterService: UpdaterService,
  mainWindow: BrowserWindow
) => {
  logger.info("IPC: Registering modular handlers...");

  ipcMain.handle(IPC_CHANNELS.APP.WRITE_CLIPBOARD, async (_, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.APP.VERIFY_CREDS, async () => {
    return await syncService.checkCredentials();
  });

  ipcMain.handle(IPC_CHANNELS.APP.LOGOUT, async () => {
    try {
      const db = getDb();
      await db
        .update(settings)
        .set({ encryptedApiKey: "" })
        .where(eq(settings.id, 1));
      logger.info("IPC: User logged out (API key cleared)");
      return true;
    } catch (error) {
      logger.error("IPC: Logout failed:", error);
      return false;
    }
  });

  registerPostHandlers();
  registerArtistHandlers();
  registerViewerHandlers();
  registerSettingsHandlers();
  registerFileHandlers();
  registerSyncAndMaintenanceHandlers(syncService, mainWindow);

  logger.info("IPC: All modular handlers registered.");
};
