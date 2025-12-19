import { ipcMain, app, shell, dialog, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import axios, { AxiosProgressEvent } from "axios";
import { pipeline } from "stream/promises";
import { logger } from "../../lib/logger";
import { IPC_CHANNELS } from "../channels";
import { z } from "zod";
import { PostsService } from "../../services/posts.service";

// Вспомогательная функция для получения главного окна Electron
const getMainWindow = (): BrowserWindow | undefined => {
  const windows = BrowserWindow.getAllWindows();
  return windows.find((w) => w.isVisible() && !w.isDestroyed()) || windows[0];
};

const DOWNLOAD_ROOT = path.join(app.getPath("downloads"), "BooruClient");

const DownloadFileSchema = z.object({
  url: z
    .string()
    .url()
    .refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
      message: "Only HTTP/HTTPS protocols are allowed for downloads.",
    }),
  filename: z
    .string()
    .min(1)
    .regex(/^[\w\-. ]+$/, "Invalid filename characters"),
});

export const registerFileHandlers = (service: PostsService) => {
  let totalBytes = 0;

  // Хендлер скачивания с диалогом "Сохранить как"
  ipcMain.handle(
    IPC_CHANNELS.FILES.DOWNLOAD,
    async (_event, url: unknown, filename: unknown) => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        logger.error("IPC: Main window not found for download.");
        return { success: false, error: "Main window not available" };
      }

      // 1. Валидация входных данных через Zod
      const validation = DownloadFileSchema.safeParse({ url, filename });

      if (!validation.success) {
        logger.error("IPC: Download validation failed", validation.error);
        return { success: false, error: "Invalid URL or Filename" };
      }

      const { url: validUrl, filename: validFilename } = validation.data;

      try {
        const defaultDir = DOWNLOAD_ROOT;

        // 2. Безопасное создание директории
        if (!fs.existsSync(defaultDir)) {
          try {
            fs.mkdirSync(defaultDir, { recursive: true });
          } catch (e) {
            logger.error("Failed to create download directory", e);
            // Не падаем, диалог просто откроется в дефолтной папке ОС
          }
        }

        const defaultPath = path.join(defaultDir, validFilename);

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

        logger.info(`IPC: Downloading: ${validUrl} -> ${filePath}`);

        const response = await axios({
          method: "GET",
          url: validUrl,
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

            mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
              id: validFilename, // Используем валидированное имя как ID
              percent: percent,
            });
          },
        });

        const writer = fs.createWriteStream(filePath);
        await pipeline(response.data, writer);

        mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
          id: validFilename,
          percent: 100,
        });
        logger.info(`IPC: Download success -> ${filePath}`);
        return { success: true, path: filePath };
      } catch (error) {
        if (mainWindow) {
          mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
            id: validFilename,
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

  // Хендлер открытия папки
  ipcMain.handle(
    IPC_CHANNELS.FILES.OPEN_FOLDER,
    async (_, filePathOrName: string) => {
      if (!filePathOrName || typeof filePathOrName !== "string") return false;

      try {
        let fullPath = filePathOrName;

        if (!path.isAbsolute(filePathOrName)) {
          fullPath = path.join(DOWNLOAD_ROOT, filePathOrName);
        }

        const normalizedPath = path.normalize(fullPath);

        if (!normalizedPath.startsWith(DOWNLOAD_ROOT)) {
          logger.error(
            `SECURITY VIOLATION: Attempt to open path outside safe directory: ${normalizedPath}`
          );
          shell.openPath(DOWNLOAD_ROOT);
          return false;
        }

        if (fs.existsSync(normalizedPath)) {
          shell.showItemInFolder(normalizedPath);
          return true;
        }

        if (fs.existsSync(DOWNLOAD_ROOT)) {
          await shell.openPath(DOWNLOAD_ROOT);
          return true;
        }

        return false;
      } catch (error) {
        logger.error("Failed to open folder:", error);
        return false;
      }
    }
  );

  // Обработчик для Reset Post Cache
  ipcMain.handle(
    IPC_CHANNELS.DB.RESET_POST_CACHE,
    async (_, postId: unknown) => {
      const result = z.number().int().positive().safeParse(postId);
      if (!result.success) {
        logger.warn(
          `Validation failed for resetPostCache: ${result.error.message}`
        );
        return false;
      }

      try {
        return await service.resetPostCache(result.data);
      } catch (error) {
        logger.error(`[IPC] Failed to reset post cache`, error);
        return false;
      }
    }
  );
};
