import {
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  clipboard,
  app,
} from "electron";
import path from "path";
import fs from "fs/promises";
import { getRawDatabase } from "../db";
import { SyncService } from "../services/sync-service";
import { UpdaterService } from "../services/updater-service";
import { IPC_CHANNELS } from "./channels";
import { logger } from "../lib/logger";
import { z } from "zod";

// Services
import { PostsService } from "../services/posts.service";
import { ArtistsService } from "../services/artists.service";
import { SettingsService } from "../services/settings.service";

// Handlers
import { registerPostHandlers } from "./handlers/posts";
import { registerArtistHandlers } from "./handlers/artists";
import { registerViewerHandlers } from "./handlers/viewer";
import { registerSettingsHandlers } from "./handlers/settings";
import { registerFileHandlers } from "./handlers/files";

const DeleteArtistSchema = z.number().int().positive();

// --- Helper для Sync & Maintenance (ТЕПЕРЬ БЕЗ DbWorkerClient) ---
const registerSyncAndMaintenanceHandlers = (
  syncService: SyncService,
  mainWindow: BrowserWindow
) => {
  // Sync All
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

  // Repair Artist
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
      const db = getRawDatabase();

      const userDataPath = app.getPath("userData");
      const backupsDir = path.join(userDataPath, "backups");

      await fs.mkdir(backupsDir, { recursive: true });

      const fileName = `backup-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.db`;
      const backupPath = path.join(backupsDir, fileName);

      logger.info(`IPC: Starting backup to ${backupPath}`);

      await db.backup(backupPath);

      shell.showItemInFolder(backupPath);
      return { success: true, path: backupPath };
    } catch (error) {
      logger.error("Backup failed", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // --- RESTORE & RESTART ---
  ipcMain.handle(IPC_CHANNELS.BACKUP.RESTORE, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Select backup file",
      filters: [{ name: "SQLite DB", extensions: ["db", "sqlite"] }],
      properties: ["openFile"],
    });

    if (canceled || !filePaths.length)
      return { success: false, error: "Canceled by user" };

    const sourcePath = filePaths[0];

    try {
      logger.info(`IPC: Restoring database from ${sourcePath}`);

      try {
        const currentDb = getRawDatabase();
        if (currentDb && typeof currentDb.close === "function") {
          currentDb.close();
          logger.info("IPC: Database connection closed to allow overwrite.");
        }
      } catch (e) {
        logger.warn(
          "IPC: Could not close DB explicitly (might be already closed):",
          e
        );
      }

      const dbPath = path.join(app.getPath("userData"), "metadata.db");
      await fs.copyFile(sourcePath, dbPath);

      logger.info(
        "IPC: Restore successful. Relaunching app to apply migrations..."
      );

      app.relaunch();
      app.exit(0);

      return { success: true };
    } catch (error) {
      logger.error("Restore failed", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Restore failed (File Locked?)",
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

  // 0. System Handlers
  ipcMain.handle(IPC_CHANNELS.APP.WRITE_CLIPBOARD, async (_, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  // Verify Creds
  ipcMain.handle(IPC_CHANNELS.APP.VERIFY_CREDS, async () => {
    return await syncService.checkCredentials();
  });

  // Logout (очистка настроек)
  ipcMain.handle(IPC_CHANNELS.APP.LOGOUT, async () => {
    const settingsService = new SettingsService();
    await settingsService.updateSettings({ encryptedApiKey: "", userId: "" });
    return true;
  });

  // 1. Init Services
  const artistsService = new ArtistsService();
  const postsService = new PostsService();
  const settingsService = new SettingsService();

  syncService.setServices(settingsService, artistsService);

  // 2. Register Domain Handlers
  registerPostHandlers(postsService);
  registerArtistHandlers(artistsService);
  registerViewerHandlers();

  // 3. Register Settings
  registerSettingsHandlers(settingsService);

  // 4. Register Sync and Maintenance
  registerSyncAndMaintenanceHandlers(syncService, mainWindow);

  // 5. Register Files (Downloads)
  registerFileHandlers(postsService);

  logger.info("IPC: All modular handlers registered.");
};
