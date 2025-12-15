import { ipcMain, app, shell, dialog, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import axios, { AxiosProgressEvent } from "axios";
import { pipeline } from "stream/promises";
import { logger } from "../../lib/logger";
import { IPC_CHANNELS } from "../channels";
import { z } from "zod";

// Вспомогательная функция для получения главного окна Electron
// Требуется для отправки асинхронных событий (прогресса) в рендерер
const getMainWindow = (): BrowserWindow | undefined => {
  const windows = BrowserWindow.getAllWindows();
  return windows.find((w) => w.isVisible() && !w.isDestroyed()) || windows[0];
};

const FilePathSchema = z
  .string()
  .min(1, "File path must be a non-empty string.");

const DOWNLOAD_ROOT = path.join(app.getPath("downloads"), "BooruClient");

export const registerFileHandlers = () => {
  let totalBytes = 0;

  // Хендлер скачивания с диалогом "Сохранить как"
  ipcMain.handle(
    IPC_CHANNELS.FILES.DOWNLOAD,
    async (_, url: string, filename: string) => {
      const mainWindow = getMainWindow(); // Получаем главное окно
      if (!mainWindow) {
        logger.error("IPC: Main window not found for download.");
        return { success: false, error: "Main window not available" };
      }

      try {
        // Инициализация пути
        const defaultDir = DOWNLOAD_ROOT;
        if (!fs.existsSync(defaultDir)) {
          fs.mkdirSync(defaultDir, { recursive: true });
        }
        const defaultPath = path.join(defaultDir, filename);

        // 1. Диалог "Сохранить как"
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
          title: "Скачать файл",
          defaultPath: defaultPath,
          buttonLabel: "Скачать",
          filters: [
            {
              name: "Media Files",
              extensions: ["jpg", "jpeg", "png", "gif", "mp4", "webm"],
            },
            { name: "All Files", extensions: ["*"] },
          ],
        });

        if (canceled || !filePath) {
          logger.info("IPC: Download canceled by user");
          return { success: false, canceled: true };
        }

        logger.info(`IPC: Downloading: ${url} -> ${filePath}`);

        // 2. HTTP-запрос с отслеживанием прогресса
        const response = await axios({
          method: "GET",
          url: url,
          responseType: "stream",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
            if (!mainWindow || !progressEvent.total) return;

            totalBytes = progressEvent.total;
            const percent = Math.round(
              (progressEvent.loaded * 100) / totalBytes
            );

            // Отправляем прогресс на фронтенд
            mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
              id: filename,
              percent: percent,
            });
          },
        });

        // 3. Запись файла
        const writer = fs.createWriteStream(filePath);
        await pipeline(response.data, writer);

        // 4. Финальный прогресс и успех
        mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
          id: filename,
          percent: 100,
        });
        logger.info(`IPC: Download success -> ${filePath}`);
        return { success: true, path: filePath };
      } catch (error) {
        // В случае ошибки сбрасываем прогресс
        if (mainWindow) {
          mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
            id: filename,
            percent: 0,
          });
        }
        logger.error("IPC: Download failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  // Хендлер открытия папки (отрефакторен для лучшей логики)
  ipcMain.handle(
    IPC_CHANNELS.FILES.OPEN_FOLDER,
    async (_, filePath: string) => {
      // 1. Валидация входных данных
      const validation = FilePathSchema.safeParse(filePath);
      if (!validation.success) {
        logger.warn(
          `IPC: OPEN_FOLDER failed validation: ${validation.error.message}`
        );
        return false;
      }
      const validatedPath = validation.data;

      try {
        // 2. 🔥 ПРОВЕРКА RCE (CRITICAL SECURITY FIX)
        // Нормализуем путь для защиты от '..' и убеждаемся, что он находится
        // внутри контролируемой папки загрузок.
        const normalizedPath = path.normalize(validatedPath);

        // Убеждаемся, что путь начинается с DOWNLOAD_ROOT
        if (!normalizedPath.startsWith(DOWNLOAD_ROOT)) {
          logger.error(
            `SECURITY VIOLATION: Attempt to open external path outside safe directory: ${normalizedPath}`
          );
          // Открываем только корневую папку, если путь невалиден
          shell.openPath(DOWNLOAD_ROOT);
          return false;
        }

        // 3. Безопасное выполнение
        if (fs.existsSync(normalizedPath)) {
          // Открываем и выделяем конкретный файл
          shell.showItemInFolder(normalizedPath);
          return true;
        }

        // 4. Если файл не найден, открываем папку по умолчанию
        if (fs.existsSync(DOWNLOAD_ROOT)) {
          await shell.openPath(DOWNLOAD_ROOT);
          return true;
        }

        logger.error(`Failed to open path or folder: ${normalizedPath}`);
        return false;
      } catch (error) {
        logger.error("Failed to open folder:", error);
        return false;
      }
    }
  );
};
