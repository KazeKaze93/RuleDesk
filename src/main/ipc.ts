// src/main/ipc.ts

import {
  app,
  ipcMain,
  shell,
  IpcMainInvokeEvent,
  BrowserWindow,
  safeStorage,
} from "electron";
import { DbWorkerClient } from "./db/db-worker-client";
import { NewArtist } from "./db/schema";
import { logger } from "./lib/logger";
import { SyncService } from "./services/sync-service";
import { URL } from "url";
import { z } from "zod";
import axios from "axios";
import { UpdaterService } from "./services/updater-service";

// === СХЕМЫ ZOD ===
const GetPostsSchema = z.object({
  artistId: z
    .number({ required_error: "artistId is required" })
    .int()
    .positive(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).default(50),
});

const DeleteArtistSchema = z
  .number({
    required_error: "ID is required",
    invalid_type_error: "ID must be a number",
  })
  .int("ID must be an integer")
  .positive("ID must be positive");

// 🛑 FIX: Removed unused SaveSettingsSchema to satisfy linter

interface Rule34AutocompleteItem {
  label: string;
  value: string;
  type?: string;
}

// --- 1. Отдельные функции-обработчики ---

const handleGetAppVersion = async (
  _event: IpcMainInvokeEvent
): Promise<string> => {
  return app.getVersion();
};

// --- 2. Функция Регистрации ---

export const registerIpcHandlers = (
  dbWorkerClient: DbWorkerClient,
  syncService: SyncService, // 🛑 FIX: Используем правильное имя аргумента
  _updaterService: UpdaterService,
  _mainWindow: BrowserWindow
) => {
  logger.info("IPC: Инициализация обработчиков...");

  // --- APP ---
  ipcMain.handle("app:get-version", handleGetAppVersion);

  ipcMain.handle("app:get-settings", async () => {
    // 1. Получаем СЫРЫЕ (зашифрованные) данные от Worker'а
    const settings = await dbWorkerClient.call<{
      userId: string;
      apiKey: string;
    }>("getApiKeyDecrypted");

    let decryptedKey = "";

    // 2. Дешифруем здесь, в Main Process
    if (settings && settings.apiKey) {
      if (safeStorage.isEncryptionAvailable()) {
        try {
          const buffer = Buffer.from(settings.apiKey, "base64");
          decryptedKey = safeStorage.decryptString(buffer);
        } catch (e) {
          console.error("IPC: Failed to decrypt key", e);
          decryptedKey = settings.apiKey;
        }
      } else {
        decryptedKey = settings.apiKey;
      }
    }

    return {
      userId: settings?.userId || "",
      apiKey: decryptedKey,
    };
  });

  ipcMain.handle("app:save-settings", async (_event, { userId, apiKey }) => {
    let encryptedKey = apiKey;

    // 1. Шифруем здесь, в Main Process
    if (apiKey && safeStorage.isEncryptionAvailable()) {
      try {
        encryptedKey = safeStorage.encryptString(apiKey).toString("base64");
      } catch (e) {
        console.error("IPC: Encryption failed", e);
      }
    }

    await dbWorkerClient.call("saveSettings", {
      userId,
      apiKey: encryptedKey,
    });

    // 🛑 FIX: Убрали блок if (_syncService), так как он был пустой и с ошибкой имени

    return { success: true };
  });

  ipcMain.handle("app:open-external", async (_event, urlString: string) => {
    try {
      if (!urlString || urlString.trim() === "") {
        throw new Error("URL string is empty.");
      }

      const parsedUrl = new URL(urlString.trim());
      // Security check
      if (
        parsedUrl.protocol === "https:" &&
        (parsedUrl.hostname === "rule34.xxx" ||
          parsedUrl.hostname === "www.rule34.xxx")
      ) {
        await shell.openExternal(urlString);
      } else {
        logger.warn(
          `IPC: Blocked attempt to open unauthorized URL: ${urlString}`
        );
      }
    } catch (error: unknown) {
      logger.error(`IPC: Error opening external URL (${urlString}):`, error);
    }
  });

  // --- DB: ARTISTS (Через RPC) ---
  ipcMain.handle("db:get-artists", async () => {
    try {
      return await dbWorkerClient.call("getTrackedArtists");
    } catch (error: unknown) {
      logger.error("IPC: [db:get-artists] Database error:", error);
      throw new Error("Failed to fetch artists from database.");
    }
  });

  ipcMain.handle("db:add-artist", async (_event, artistData: NewArtist) => {
    const name = artistData.name?.trim();
    const endpoint = artistData.apiEndpoint?.trim();

    if (!name || name === "") {
      throw new Error("Artist name cannot be empty or just whitespace.");
    }
    if (!endpoint || endpoint === "") {
      throw new Error("API Endpoint URL is required.");
    }
    try {
      new URL(endpoint);
    } catch (_error: unknown) {
      throw new Error("Invalid API Endpoint URL format.");
    }

    logger.info(`IPC: [db:add-artist] Попытка добавить: ${name}`);

    try {
      const dataToSave: NewArtist = {
        ...artistData,
        name: name,
        apiEndpoint: endpoint,
      };
      return await dbWorkerClient.call("addArtist", dataToSave);
    } catch (error: unknown) {
      logger.error("IPC: [db:add-artist] Database error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown database error.";
      throw new Error(`Database error adding artist: ${errorMessage}`);
    }
  });

  ipcMain.handle("db:delete-artist", async (_event, id: unknown) => {
    const validation = DeleteArtistSchema.safeParse(id);

    if (!validation.success) {
      logger.error(
        `[IPC Validation] Invalid schema for db:delete-artist: ${JSON.stringify(
          validation.error.flatten()
        )}`
      );
      throw new Error("Invalid input format received.");
    }

    const validatedId = validation.data;

    try {
      return await dbWorkerClient.call("deleteArtist", { id: validatedId });
    } catch (error: unknown) {
      logger.error(
        `IPC: [db:delete-artist] Database error for ID ${validatedId}:`,
        error
      );
      throw new Error("Failed to delete artist from database.");
    }
  });

  // --- DB: POSTS (Через RPC) ---
  ipcMain.handle("db:get-posts", async (_event, payload: unknown) => {
    const validation = GetPostsSchema.safeParse(payload);

    if (!validation.success) {
      logger.error("IPC: [db:get-posts] Validation failed:", validation.error);
      throw new Error(`Validation Error: ${validation.error.message}`);
    }

    const { artistId, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    try {
      logger.info(
        `IPC: [db:get-posts] Fetching artist ${artistId}, page ${page}`
      );

      return await dbWorkerClient.call("getPostsByArtist", {
        artistId,
        limit,
        offset,
      });
    } catch (error: unknown) {
      logger.error(
        `IPC: [db:get-posts] Database error for artist ${artistId}:`,
        error
      );
      throw new Error("Failed to fetch posts from database.");
    }
  });

  ipcMain.handle("db:mark-post-viewed", async (_event, postId: unknown) => {
    const idSchema = z.number().int().positive();
    const result = idSchema.safeParse(postId);

    if (!result.success) {
      logger.error(`[IPC] Invalid postId for mark-viewed: ${postId}`);
      return false;
    }

    try {
      await dbWorkerClient.call("markPostAsViewed", { postId: result.data });
      return true;
    } catch (error: unknown) {
      logger.error(`[IPC] Failed to mark post ${result.data} as viewed`, error);
      return false;
    }
  });

  // --- SYNC & REPAIR ---
  ipcMain.handle("db:sync-all", async () => {
    logger.info("IPC: [db:sync-all] Инициирование фоновой синхронизации...");

    syncService.syncAllArtists().catch((error) => {
      logger.error("IPC: Critical background sync error:", error);
      syncService.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Sync failed."
      );
    });
    return;
  });

  ipcMain.handle("sync:repair-artist", async (_, artistId: number) => {
    logger.info(
      `IPC: [sync:repair-artist] Запрос ремонта для автора ${artistId}`
    );
    try {
      await syncService.repairArtist(artistId);
      return { success: true };
    } catch (error) {
      logger.error(`IPC: Ошибка ремонта автора ${artistId}`, error);
      return { success: false, error: (error as Error).message };
    }
  });

  // --- SEARCH ---
  ipcMain.handle("db:search-tags", async (_, query: string) => {
    try {
      return await dbWorkerClient.call("searchArtists", { query });
    } catch (error: unknown) {
      logger.error("IPC: [db:search-tags] Error:", error);
      return [];
    }
  });

  ipcMain.handle("api:search-remote-tags", async (_, query: string) => {
    if (!query || query.length < 2) return [];

    try {
      const url = `https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(
        query
      )}`;

      const { data } = await axios.get<Rule34AutocompleteItem[]>(url);

      if (Array.isArray(data)) {
        return data.map((item) => ({
          id: item.value,
          label: item.label,
        }));
      }
      return [];
    } catch (error: unknown) {
      logger.error(
        `IPC: [api:search-remote-tags] Error searching for ${query}:`,
        error
      );
      return [];
    }
  });

  logger.info("IPC: Все обработчики успешно зарегистрированы.");
};
