import pkg from "electron-updater";
const { autoUpdater } = pkg;
import { BrowserWindow, ipcMain } from "electron";
import { logger } from "../lib/logger";

export class UpdaterService {
  private window: BrowserWindow | null = null;

  constructor() {
    this.initListeners();
  }

  public setWindow(window: BrowserWindow) {
    this.window = window;
  }

  private initListeners() {
    autoUpdater.logger = logger;

    // 👇 Вежливый режим: не качаем сами
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    // @ts-expect-error: signature validation disabled
    autoUpdater.verifyUpdateCodeSignature = false;

    autoUpdater.on("checking-for-update", () => {
      logger.info("UPDATER: Checking...");
      this.sendStatus("checking");
    });

    autoUpdater.on("update-available", (info) => {
      logger.info(`UPDATER: Update available: ${info.version}`);
      // Отправляем версию UI, но не качаем
      this.sendPayload("updater:status", {
        status: "available",
        version: info.version,
      });
    });

    autoUpdater.on("update-not-available", (info) => {
      logger.info(`UPDATER: No update. Current: ${info.version}`);
      this.sendStatus("not-available");
    });

    autoUpdater.on("error", (err) => {
      logger.error("UPDATER: Error:", err);
      this.sendStatus("error", err.message);
    });

    autoUpdater.on("download-progress", (progressObj) => {
      this.sendPayload("updater:progress", progressObj.percent);
    });

    autoUpdater.on("update-downloaded", (info) => {
      logger.info(`UPDATER: Downloaded ${info.version}`);
      this.sendStatus("downloaded");
    });

    // IPC Handler: Проверка
    ipcMain.handle("app:check-for-updates", async () => {
      return this.checkForUpdates();
    });

    // IPC Handler: Старт скачивания (по кнопке)
    ipcMain.handle("app:start-download", () => {
      logger.info("UPDATER: User requested download starting...");
      autoUpdater.downloadUpdate();
    });

    // IPC Handler: Перезагрузка
    ipcMain.handle("app:quit-and-install", () => {
      autoUpdater.quitAndInstall();
    });
  }

  // Универсальный отправитель
  private sendPayload(channel: string, data: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  // Обертка для статусов (для обратной совместимости внутри класса)
  private sendStatus(status: string, message?: string) {
    this.sendPayload("updater:status", { status, message });
  }

  public async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      logger.error("UPDATER: Check failed", e);
    }
  }
}

export const updaterService = new UpdaterService();
