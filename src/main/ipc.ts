// src/main/ipc.ts

import { app, ipcMain, IpcMainInvokeEvent } from "electron";
import { DbService } from "./db/db-service";
import { Artist, NewArtist } from "./db/schema";
import { logger } from "./lib/logger";

// --- 1. Определение API контрактов ---
// Мы не определяем их здесь, чтобы избежать циклической зависимости.
// Но здесь будет логика вызова API и Drizzle.

// --- 2. Типизированные обработчики ---
// Пример обработчика, который Main Process будет вызывать напрямую.
const handleGetAppVersion = async (
  _event: IpcMainInvokeEvent
): Promise<string> => {
  return app.getVersion();
};

/**
 * Регистрирует все асинхронные и синхронные обработчики IPC.
 * @param dbService - Инстанс сервиса для работы с БД.
 */
export function registerIpcHandlers(dbService: DbService) {
  // --- DB HANDLERS (определяем внутри, чтобы захватить dbService) ---

  const handleGetTrackedArtists = async (): Promise<Artist[]> => {
    return dbService.getTrackedArtists();
  };

  const handleAddArtist = async (
    _event: IpcMainInvokeEvent,
    artistData: NewArtist
  ): Promise<Artist | undefined> => {
    if (!artistData.username || artistData.username.trim().length === 0) {
      logger.warn("IPC: Попытка добавить автора с пустым именем");
      throw new Error("Username cannot be empty");
    }
    if (!artistData.apiEndpoint.startsWith("http")) {
      logger.warn("IPC: Невалидный endpoint", artistData.apiEndpoint);
      throw new Error("Invalid API endpoint");
    }

    return dbService.addArtist(artistData);

    // --- REGISTRATION ---

    ipcMain.handle("app:get-version", handleGetAppVersion);
    ipcMain.handle("db:get-artists", handleGetTrackedArtists);
    ipcMain.handle("db:add-artist", handleAddArtist);
  };
}
