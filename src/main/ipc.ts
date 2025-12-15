import {
  app,
  ipcMain,
  shell,
  IpcMainInvokeEvent,
  BrowserWindow,
  dialog,
} from "electron";
import { DbWorkerClient } from "./db/db-worker-client";
import { NewArtist } from "./db/schema";
import { logger } from "./lib/logger";
import { SyncService } from "./services/sync-service";
import { SecureStorage } from "./services/secure-storage"; // 👈 IMPORT
import { URL } from "url";
import { z } from "zod";
import axios from "axios";
import { UpdaterService } from "./services/updater-service";

// === ZOD SCHEMAS (Centralized) ===

const GetPostsSchema = z.object({
  artistId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).default(50),
});

const DeleteArtistSchema = z.number().int().positive();

const AddArtistSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  type: z.enum(["tag", "uploader", "query"]),
  apiEndpoint: z.string().url().trim(),
});

const MarkViewedSchema = z.number().int().positive();

const SearchTagsSchema = z.string().trim();

interface Rule34AutocompleteItem {
  label: string;
  value: string;
  type?: string;
}

const handleGetAppVersion = async (
  _event: IpcMainInvokeEvent
): Promise<string> => {
  return app.getVersion();
};

export const registerIpcHandlers = (
  dbWorkerClient: DbWorkerClient,
  syncService: SyncService,
  _updaterService: UpdaterService,
  _mainWindow: BrowserWindow
) => {
  logger.info("IPC: Initializing handlers...");

  // --- APP ---
  ipcMain.handle("app:get-version", handleGetAppVersion);

  // === SETTINGS (SECURE) ===
  ipcMain.handle("app:get-settings", async () => {
    const settings = await dbWorkerClient.call<{
      userId: string;
      apiKey: string;
    }>("getApiKeyDecrypted");
    let decryptedKey = "";
    if (settings && settings.apiKey) {
      const decrypted = SecureStorage.decrypt(settings.apiKey);
      decryptedKey = decrypted || "";
    }
    return { userId: settings?.userId || "", apiKey: decryptedKey };
  });

  ipcMain.handle("app:save-settings", async (_event, { userId, apiKey }) => {
    let encryptedKey = "";
    if (apiKey) {
      try {
        encryptedKey = SecureStorage.encrypt(apiKey);
      } catch (error) {
        logger.error("IPC: Aborting save due to encryption failure", error);
        throw new Error("Cannot save settings: Encryption unavailable.");
      }
    }
    await dbWorkerClient.call("saveSettings", { userId, apiKey: encryptedKey });
    return { success: true };
  });

  ipcMain.handle("app:open-external", async (_event, urlString: string) => {
    try {
      const parsedUrl = new URL(urlString);
      if (
        parsedUrl.protocol === "https:" &&
        (parsedUrl.hostname === "rule34.xxx" ||
          parsedUrl.hostname === "www.rule34.xxx")
      ) {
        await shell.openExternal(urlString);
      } else {
        logger.warn(`IPC: Blocked unauthorized URL: ${urlString}`);
      }
    } catch (error) {
      logger.error(`IPC: Invalid URL passed to open-external`, error);
    }
  });

  // --- DB Operations ---

  ipcMain.handle("db:get-artists", async () => {
    try {
      return await dbWorkerClient.call("getTrackedArtists");
    } catch (error) {
      logger.error("IPC: [db:get-artists] error:", error);
      throw new Error("Failed to fetch artists.");
    }
  });

  ipcMain.handle("db:add-artist", async (_event, payload: unknown) => {
    // 🛡️ STRICT ZOD VALIDATION
    const validation = AddArtistSchema.safeParse(payload);
    if (!validation.success) {
      logger.error("IPC: Invalid artist data", validation.error);
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const artistData = validation.data;
    logger.info(`IPC: [db:add-artist] Adding: ${artistData.name}`);

    try {
      return await dbWorkerClient.call("addArtist", artistData as NewArtist);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("IPC: [db:add-artist] error:", error);
      throw new Error(`Database error: ${msg}`);
    }
  });

  ipcMain.handle("db:delete-artist", async (_event, id: unknown) => {
    // 🛡️ STRICT ZOD VALIDATION
    const validation = DeleteArtistSchema.safeParse(id);
    if (!validation.success) throw new Error("Invalid ID.");
    try {
      return await dbWorkerClient.call("deleteArtist", { id: validation.data });
    } catch (error) {
      logger.error(`IPC: [db:delete-artist] error:`, error);
      throw new Error("Failed to delete artist.");
    }
  });

  ipcMain.handle("db:get-posts", async (_event, payload: unknown) => {
    // 🛡️ STRICT ZOD VALIDATION
    const validation = GetPostsSchema.safeParse(payload);
    if (!validation.success)
      throw new Error(`Validation Error: ${validation.error.message}`);

    const { artistId, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    try {
      return await dbWorkerClient.call("getPostsByArtist", {
        artistId,
        limit,
        offset,
      });
    } catch (error) {
      logger.error(`IPC: [db:get-posts] error:`, error);
      throw new Error("Failed to fetch posts.");
    }
  });

  ipcMain.handle("db:mark-post-viewed", async (_event, postId: unknown) => {
    // 🛡️ STRICT ZOD VALIDATION
    const result = MarkViewedSchema.safeParse(postId);
    if (!result.success) return false;

    try {
      await dbWorkerClient.call("markPostAsViewed", { postId: result.data });
      return true;
    } catch (error) {
      logger.error(`[IPC] Failed to mark post viewed`, error);
      return false;
    }
  });

  // --- SYNC & REPAIR ---
  ipcMain.handle("db:sync-all", async () => {
    logger.info("IPC: [db:sync-all] Start background sync...");
    syncService.syncAllArtists().catch((error) => {
      logger.error("IPC: Critical background sync error:", error);
      syncService.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Sync failed."
      );
    });
    return;
  });

  ipcMain.handle("sync:repair-artist", async (_, artistId: unknown) => {
    const validId = DeleteArtistSchema.safeParse(artistId); // Re-use simple number schema
    if (!validId.success) return { success: false, error: "Invalid ID" };

    logger.info(`IPC: [sync:repair-artist] Artist ${validId.data}`);
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

  // --- BACKUP ---
  ipcMain.handle("db:create-backup", async () => {
    try {
      const result = await dbWorkerClient.call<{ backupPath: string }>(
        "backup"
      );
      shell.showItemInFolder(result.backupPath);
      return { success: true, path: result.backupPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle("db:restore-backup", async () => {
    if (!_mainWindow) return { success: false, error: "No window" };
    const { canceled, filePaths } = await dialog.showOpenDialog(_mainWindow, {
      title: "Select backup file",
      filters: [{ name: "SQLite DB", extensions: ["db", "sqlite"] }],
      properties: ["openFile"],
    });
    if (canceled || !filePaths.length)
      return { success: false, error: "Canceled by user" };

    try {
      await dbWorkerClient.restore(filePaths[0]);
      _mainWindow.reload();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // --- SEARCH ---
  ipcMain.handle("db:search-tags", async (_, query: unknown) => {
    const validQuery = SearchTagsSchema.safeParse(query);
    if (!validQuery.success) return [];
    try {
      return await dbWorkerClient.call("searchArtists", {
        query: validQuery.data,
      });
    } catch {
      return [];
    }
  });

  ipcMain.handle("api:search-remote-tags", async (_, query: unknown) => {
    const validQuery = SearchTagsSchema.safeParse(query);
    if (!validQuery.success || validQuery.data.length < 2) return [];

    try {
      const { data } = await axios.get<Rule34AutocompleteItem[]>(
        `https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(
          validQuery.data
        )}`
      );
      return Array.isArray(data)
        ? data.map((item) => ({ id: item.value, label: item.label }))
        : [];
    } catch {
      return [];
    }
  });

  logger.info("IPC: Handlers registered.");
};
