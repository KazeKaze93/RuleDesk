import { BrowserWindow, ipcMain, shell, dialog, clipboard } from "electron";
import { DbWorkerClient } from "../db/db-worker-client";
import type { DbType } from "../db";
import { SyncService } from "../services/sync-service";
import { UpdaterService } from "../services/updater-service";
import { IPC_CHANNELS } from "./channels";
import { logger } from "../lib/logger";
import { z } from "zod";

// Services
import { PostsService } from "../services/posts.service";
import { ArtistsService } from "../services/artists.service";

// Handlers
import { registerPostHandlers } from "./handlers/posts";
import { registerArtistHandlers } from "./handlers/artists";
import { registerViewerHandlers } from "./handlers/viewer";
import { registerSettingsHandlers } from "./handlers/settings";
import { registerFileHandlers } from "./handlers/files";

const DeleteArtistSchema = z.number().int().positive();

// --- Helper для Sync & Maintenance ---
const registerSyncAndMaintenanceHandlers = (
  db: DbWorkerClient,
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

  // Backup
  ipcMain.handle(IPC_CHANNELS.BACKUP.CREATE, async () => {
    try {
      const result = await db.call<{ backupPath: string }>("backup");
      shell.showItemInFolder(result.backupPath);
      return { success: true, path: result.backupPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Restore
  ipcMain.handle(IPC_CHANNELS.BACKUP.RESTORE, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Select backup file",
      filters: [{ name: "SQLite DB", extensions: ["db", "sqlite"] }],
      properties: ["openFile"],
    });
    if (canceled || !filePaths.length)
      return { success: false, error: "Canceled by user" };

    try {
      await db.restore(filePaths[0]);
      mainWindow.reload();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
};

// --- Main Registration Function ---
export const registerAllHandlers = (
  dbWorkerClient: DbWorkerClient,
  db: DbType,
  syncService: SyncService,
  _updaterService: UpdaterService,
  mainWindow: BrowserWindow
) => {
  logger.info("IPC: Registering modular handlers...");

  // 0. System Handlers (Inline)
  // -------------------------------------------------------------

  // Запись в буфер обмена (для копирования метаданных и дебага)
  ipcMain.handle(IPC_CHANNELS.APP.WRITE_CLIPBOARD, async (_, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  // Обработчик проверки кредов
  ipcMain.handle(IPC_CHANNELS.APP.VERIFY_CREDS, async () => {
    return await syncService.checkCredentials();
  });

  // Logout
  ipcMain.handle(IPC_CHANNELS.APP.LOGOUT, async () => {
    await dbWorkerClient.call("logout");
    return true;
  });

  // 1. Init Services
  const postsService = new PostsService(db);
  const artistsService = new ArtistsService(dbWorkerClient);

  // 2. Register Domain Handlers
  registerPostHandlers(postsService);
  registerArtistHandlers(artistsService);
  registerViewerHandlers();

  // 3. Register Settings
  registerSettingsHandlers(dbWorkerClient);

  // 4. Register Sync and Maintenance
  registerSyncAndMaintenanceHandlers(dbWorkerClient, syncService, mainWindow);

  // 5. Register Files (Downloads)
  registerFileHandlers(postsService);

  logger.info("IPC: All modular handlers registered.");
};
