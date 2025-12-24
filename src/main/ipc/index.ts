import { BrowserWindow, ipcMain, dialog, clipboard, app } from "electron";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import { SyncService } from "../services/sync-service";
import { UpdaterService } from "../services/updater-service";
import { IPC_CHANNELS } from "./channels";
import { getDb, getSqliteInstance } from "../db/client";
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

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Validate path is absolute and within user data directory
      const normalizedBackupPath = path.resolve(backupPath);
      const normalizedBackupDir = path.resolve(backupDir);
      if (!normalizedBackupPath.startsWith(normalizedBackupDir)) {
        throw new Error("Backup path validation failed: path outside user data directory");
      }

      const sqlite = getSqliteInstance();
      const stmt = sqlite.prepare('VACUUM INTO ?');
      stmt.run(backupPath);

      logger.info(`IPC: Backup created at ${backupPath}`);
      return {
        success: true,
        path: backupPath,
      };
    } catch (error) {
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

      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          error: "Backup file not found",
        };
      }

      const tempRestorePath = path.join(
        app.getPath("userData"),
        "metadata-restore.db"
      );

      fs.copyFileSync(backupPath, tempRestorePath);

      logger.info(
        `IPC: Backup file prepared for restore. User must restart application.`
      );

      await dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Restore Scheduled",
        message:
          "Database restore has been scheduled. Please restart the application for the restore to take effect.",
        buttons: ["OK"],
      });

      return {
        success: true,
        message: "Restore scheduled. Please restart the application.",
      };
    } catch (error) {
      logger.error("IPC: Restore failed:", error);
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
