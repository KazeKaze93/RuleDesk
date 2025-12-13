import { app, ipcMain, shell, IpcMainInvokeEvent } from "electron";
import { DbService } from "./db/db-service";
import { NewArtist } from "./db/schema";
import { logger } from "./lib/logger";
import { SyncService } from "./services/sync-service";
import { URL } from "url";
import { z } from "zod";

const GetPostsSchema = z.object({
  artistId: z
    .number({ required_error: "artistId is required" })
    .int()
    .positive(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).default(50),
});

const DeleteArtistSchema = z.number().int().positive();

const SaveSettingsSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  apiKey: z.string().min(5, { message: "API Key is too short" }),
});

// --- 1. Отдельные функции-обработчики ---

const handleGetAppVersion = async (
  _event: IpcMainInvokeEvent
): Promise<string> => {
  return app.getVersion();
};

// --- 2. Функция Регистрации ---

export const registerIpcHandlers = (
  dbService: DbService,
  syncService: SyncService
) => {
  logger.info("IPC: Инициализация обработчиков...");

  // --- APP ---
  ipcMain.handle("app:get-version", handleGetAppVersion);

  ipcMain.handle("app:get-settings", async () => {
    return dbService.getSettings();
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

  ipcMain.handle("app:save-settings", async (_event, data: unknown) => {
    const validation = SaveSettingsSchema.safeParse(data);

    if (!validation.success) {
      logger.warn(
        "IPC: [app:save-settings] Validation failed (Renderer data):",
        validation.error
      );
      throw new Error(`Validation Error: ${validation.error.message}`);
    }

    const { userId, apiKey } = validation.data;

    return dbService.saveSettings(userId.trim(), apiKey.trim());
  });

  ipcMain.handle("app:open-external", async (_event, urlString: string) => {
    try {
      if (!urlString || urlString.trim() === "") {
        throw new Error("URL string is empty.");
      }

      const parsedUrl = new URL(urlString.trim());
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
    } catch (e) {
      logger.error(`IPC: Error opening external URL (${urlString}):`, e);
    }
  });

  // --- DB: ARTISTS ---
  ipcMain.handle("db:get-artists", async () => {
    try {
      return await dbService.getTrackedArtists();
    } catch (e) {
      logger.error("IPC: [db:get-artists] Database error:", e);
      throw new Error("Failed to fetch artists from database.");
    }
  });

  ipcMain.handle("db:add-artist", async (_event, artistData: NewArtist) => {
    // 1. САНИТАЙЗИНГ И ВАЛИДАЦИЯ ИМЕНИ (name)
    const name = artistData.name?.trim();
    if (!name || name === "") {
      logger.warn(
        "IPC: [db:add-artist] Отклонено: Имя автора не может быть пустым."
      );
      throw new Error("Artist name cannot be empty or just whitespace.");
    }

    // 2. САНИТАЙЗИНГ И ВАЛИДАЦИЯ API ENDPOINT
    const endpoint = artistData.apiEndpoint?.trim();
    if (!endpoint || endpoint === "") {
      logger.warn(`IPC: [db:add-artist] Отсутствует apiEndpoint для ${name}.`);
      throw new Error("API Endpoint URL is required.");
    }

    logger.info(`IPC: [db:add-artist] Попытка добавить: ${name}`);

    // 3. ВАЛИДАЦИЯ ФОРМАТА URL
    try {
      new URL(endpoint);
    } catch (e) {
      logger.error("IPC: [db:add-artist] Invalid URL format:", e);
      throw new Error("Invalid API Endpoint URL format.");
    }

    // 4. ОБРАБОТКА ОШИБОК БД
    try {
      const dataToSave: NewArtist = {
        ...artistData,
        name: name,
        apiEndpoint: endpoint,
      };
      return await dbService.addArtist(dataToSave);
    } catch (e) {
      logger.error("IPC: [db:add-artist] Database error:", e);

      const errorMessage =
        e instanceof Error ? e.message : "Unknown database error.";
      throw new Error(`Database error adding artist: ${errorMessage}`);
    }
  });

  // --- DB: SYNC ---
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

  // --- GET POSTS ---
  ipcMain.handle("db:get-posts", async (_event, payload: unknown) => {
    const validation = GetPostsSchema.safeParse(payload);

    if (!validation.success) {
      logger.error("IPC: [db:get-posts] Validation failed:", validation.error);
      throw new Error(`Validation Error: ${validation.error.message}`);
    }

    const { artistId, page, limit } = validation.data;

    try {
      const offset = (page - 1) * limit;

      logger.info(
        `IPC: [db:get-posts] Fetching artist ${artistId}, page ${page}`
      );

      return await dbService.getPostsByArtist(artistId, limit, offset);
    } catch (e) {
      logger.error(
        `IPC: [db:get-posts] Database error for artist ${artistId}:`,
        e
      );
      throw new Error("Failed to fetch posts from database.");
    }
  });

  // --- DB: DELETE ARTIST ---
  ipcMain.handle("db:delete-artist", async (_event, id: unknown) => {
    const validation = DeleteArtistSchema.safeParse(id);
    if (!validation.success) {
      logger.error(
        "IPC: [db:delete-artist] Validation failed:",
        validation.error
      );
      throw new Error("Invalid input for db:delete-artist");
    }

    const validatedId = validation.data;
    try {
      return await dbService.deleteArtist(validatedId);
    } catch (e) {
      logger.error(
        `IPC: [db:delete-artist] Database error for ID ${validatedId}:`,
        e
      );
      throw new Error("Failed to delete artist from database.");
    }
  });

  logger.info("IPC: Все обработчики успешно зарегистрированы.");
};
