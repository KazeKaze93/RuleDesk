// src/main/ipc.ts

import { app, ipcMain, IpcMainInvokeEvent } from "electron";
import { DbService } from "./db/db-service";
import { NewArtist } from "./db/schema";
import { logger } from "./lib/logger";

// --- 1. Отдельные функции-обработчики (чистые функции) ---

const handleGetAppVersion = async (
  _event: IpcMainInvokeEvent
): Promise<string> => {
  return app.getVersion();
};

// --- 2. Функция Регистрации (Точка входа) ---

export const registerIpcHandlers = (dbService: DbService) => {
  logger.info("IPC: Инициализация обработчиков...");

  // 1. Версия
  ipcMain.handle("app:get-version", handleGetAppVersion);

  // 2. Получение авторов
  ipcMain.handle("db:get-artists", async () => {
    logger.info("IPC: [db:get-artists] Запрос списка");
    return dbService.getTrackedArtists();
  });

  // 3. Добавление автора
  ipcMain.handle("db:add-artist", async (_event, artistData: NewArtist) => {
    logger.info(
      `IPC: [db:add-artist] Попытка добавить: ${artistData.username}`
    );

    if (!artistData.username || artistData.username.trim() === "") {
      throw new Error("Username is required");
    }

    return dbService.addArtist(artistData);
  });

  logger.info("IPC: Все обработчики успешно зарегистрированы.");
};
