import { app, ipcMain, shell, IpcMainInvokeEvent } from "electron";
import { DbService } from "./db/db-service";
import { NewArtist } from "./db/schema";
import { logger } from "./lib/logger";
import { SyncService } from "./services/sync-service"; // <--- 1. ИМПОРТ

// --- 1. Отдельные функции-обработчики ---

const handleGetAppVersion = async (
  _event: IpcMainInvokeEvent
): Promise<string> => {
  return app.getVersion();
};

// --- 2. Функция Регистрации ---

export const registerIpcHandlers = (dbService: DbService) => {
  logger.info("IPC: Инициализация обработчиков...");

  // <--- 2. СОЗДАЕМ ЭКЗЕМПЛЯР СЕРВИСА
  const syncService = new SyncService(dbService);

  // --- APP ---
  ipcMain.handle("app:get-version", handleGetAppVersion);

  ipcMain.handle("app:get-settings", async () => {
    return dbService.getSettings();
  });

  ipcMain.handle("app:save-settings", async (_event, { userId, apiKey }) => {
    if (!userId || !apiKey) throw new Error("Данные обязательны");
    return dbService.saveSettings(userId, apiKey);
  });

  // Добавим на всякий случай, если захочешь открывать ссылки
  ipcMain.handle("app:open-external", async (_event, url: string) => {
    if (url.startsWith("https://rule34.xxx")) {
      await shell.openExternal(url);
    }
  });

  // --- DB: ARTISTS ---
  ipcMain.handle("db:get-artists", async () => {
    return dbService.getTrackedArtists();
  });

  ipcMain.handle("db:add-artist", async (_event, artistData: NewArtist) => {
    // Валидация
    if (!artistData.name || artistData.name.trim() === "") {
      throw new Error("Username is required");
    }
    try {
      new URL(artistData.apiEndpoint);
    } catch {
      throw new Error("Invalid API Endpoint URL");
    }
    return dbService.addArtist(artistData);
  });

  // --- DB: SYNC (ВОТ ЧЕГО НЕ ХВАТАЛО) ---
  ipcMain.handle("db:sync-all", async () => {
    logger.info("IPC: [db:sync-all] Запуск синхронизации...");
    await syncService.syncAllArtists();
    return true;
  });

  // --- DB: POSTS (Для галереи пригодится) ---
  ipcMain.handle("db:get-posts", async (_event, { artistId, page = 1 }) => {
    const limit = 1000;
    const offset = (page - 1) * limit;
    return dbService.getPostsByArtist(artistId, limit, offset);
  });

  // --- DB: DELETE ARTIST ---
  ipcMain.handle("db:delete-artist", async (_event, id: number) => {
    return dbService.deleteArtist(id);
  });

  logger.info("IPC: Все обработчики успешно зарегистрированы.");
};
