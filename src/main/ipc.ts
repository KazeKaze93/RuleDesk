import { app, ipcMain, shell, IpcMainInvokeEvent } from "electron";
import { DbService } from "./db/db-service";
import { NewArtist } from "./db/schema";
import { logger } from "./lib/logger";
import { SyncService } from "./services/sync-service";
import { URL } from "url";
import { z } from "zod";

// Схема для db:get-posts
const GetPostsSchema = z.object({
  artistId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
});

// Схема для db:delete-artist
const DeleteArtistSchema = z.number().int().positive();

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

  ipcMain.handle("app:save-settings", async (_event, { userId, apiKey }) => {
    if (!userId || !apiKey) {
      logger.warn(
        "IPC: [app:save-settings] Ошибка валидации: нет userId или apiKey"
      );
      throw new Error("Данные обязательны");
    }
    return dbService.saveSettings(userId, apiKey);
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
        logger.warn(
          `IPC: Blocked attempt to open unauthorized URL: ${urlString}`
        );
      }
    } catch (_e) {
      logger.error(`IPC: Invalid URL passed to open-external: ${urlString}`);
    }
  });

  // --- DB: ARTISTS ---
  ipcMain.handle("db:get-artists", async () => {
    return dbService.getTrackedArtists();
  });

  ipcMain.handle("db:add-artist", async (_event, artistData: NewArtist) => {
    if (!artistData.name || artistData.name.trim() === "") {
      logger.warn(
        "IPC: [db:add-artist] Отклонено: Имя автора не может быть пустым."
      );
      throw new Error("Artist name cannot be empty or just whitespace.");
    }

    logger.info(`IPC: [db:add-artist] Попытка добавить: ${artistData.name}`);

    if (!artistData.apiEndpoint) {
      logger.warn(
        `IPC: [db:add-artist] Отсутствует apiEndpoint для ${artistData.name}.`
      );
      throw new Error("API Endpoint URL is required.");
    }

    try {
      new URL(artistData.apiEndpoint);
    } catch (e) {
      logger.error("IPC: [db:add-artist] Невалидный URL:", e);
      throw new Error("Invalid API Endpoint URL format.");
    }

    try {
      return await dbService.addArtist(artistData);
    } catch (e) {
      logger.error("IPC: [db:add-artist] Ошибка добавления в БД:", e);

      const errorMessage =
        e instanceof Error ? e.message : "Unknown database error.";
      throw new Error(`Database error adding artist: ${errorMessage}`);
    }
  });

  // --- DB: SYNC ---
  ipcMain.handle("db:sync-all", async () => {
    logger.info("IPC: [db:sync-all] Инициирование фоновой синхронизации...");

    syncService.syncAllArtists().catch((error) => {
      logger.error("IPC: Критическая ошибка в фоновой синхронизации:", error);

      syncService.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Sync failed."
      );
    });
    return;
  });

  // --- DB: POSTS ---
  ipcMain.handle("db:get-posts", async (_event, data: unknown) => {
    const validation = GetPostsSchema.safeParse(data);
    if (!validation.success) {
      logger.error("IPC: [db:get-posts] Validation failed:", validation.error);
      throw new Error("Invalid input for db:get-posts");
    }

    const { artistId, page } = validation.data;

    const limit = 50;
    const offset = (page - 1) * limit;
    return dbService.getPostsByArtist(artistId, limit, offset);
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
    return dbService.deleteArtist(validatedId);
  });

  logger.info("IPC: Все обработчики успешно зарегистрированы.");
};
