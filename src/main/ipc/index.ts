// Cursor: select file:src/main/ipc/index.ts
import { BrowserWindow, ipcMain, shell, dialog, clipboard } from "electron";
import { DbWorkerClient } from "../db/db-worker-client";
import { SyncService } from "../services/sync-service";
import { UpdaterService } from "../services/updater-service";
import { IPC_CHANNELS } from "./channels";
import { logger } from "../lib/logger";
import { z } from "zod";

// Repos
import { PostsRepository } from "../db/repositories/posts.repo";
import { ArtistsRepository } from "../db/repositories/artists.repo";

// Handlers
import { registerPostHandlers } from "./handlers/posts";
import { registerArtistHandlers } from "./handlers/artists";
import { registerViewerHandlers } from "./handlers/viewer";
import { registerSettingsHandlers } from "./handlers/settings";
import { registerFileHandlers } from "./handlers/files";

const DeleteArtistSchema = z.number().int().positive(); // Для repair

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
  db: DbWorkerClient,
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

  // 🔥 FIX: Удален дубликат OPEN_EXTERNAL. Он уже регистрируется внутри registerViewerHandlers.
  // ipcMain.handle(IPC_CHANNELS.APP.OPEN_EXTERNAL, async (_, url: string) => {
  //   await shell.openExternal(url);
  // });

  // -------------------------------------------------------------

  // 1. Init Repos
  const postsRepo = new PostsRepository(db);
  const artistsRepo = new ArtistsRepository(db);

  // 2. Register Domain Handlers
  registerPostHandlers(postsRepo);
  registerArtistHandlers(artistsRepo);
  registerViewerHandlers(); // <--- Здесь внутри уже есть OPEN_EXTERNAL

  // 3. Register Settings
  registerSettingsHandlers(db); // <--- Теперь программа дойдет сюда и зарегистрирует get-settings

  // 4. Register Sync and Maintenance
  registerSyncAndMaintenanceHandlers(db, syncService, mainWindow);

  // 5. Register Files (Downloads)
  registerFileHandlers(postsRepo);

  logger.info("IPC: All modular handlers registered.");
};
