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
    // 1. Подключаем логгер
    autoUpdater.logger = logger;

    // 2. Настройки для обновлений
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    // ⚠️ ОТКЛЮЧАЕМ ПРОВЕРКУ ПОДПИСИ (для GitHub Releases без сертификата)
    // @ts-expect-error: свойство может отсутствовать в типах, но работает в runtime
    autoUpdater.verifyUpdateCodeSignature = false;

    // 3. Слушаем события
    autoUpdater.on("checking-for-update", () => {
      logger.info("UPDATER: Checking for update...");
      this.sendStatus("checking");
    });

    autoUpdater.on("update-available", (info) => {
      logger.info(`UPDATER: Update available: ${info.version}`);
      this.sendStatus("available");
    });

    autoUpdater.on("update-not-available", (info) => {
      logger.info(`UPDATER: No update available. Current: ${info.version}`);
      this.sendStatus("not-available");
    });

    autoUpdater.on("error", (err) => {
      logger.error("UPDATER: Error in auto-updater:", err);
      this.sendStatus("error", err.message);
    });

    autoUpdater.on("download-progress", (progressObj) => {
      if (Math.floor(progressObj.percent) % 10 === 0) {
        logger.info(
          `UPDATER: Download progress: ${Math.floor(progressObj.percent)}%`
        );
      }
      this.sendProgress(progressObj.percent);
    });

    autoUpdater.on("update-downloaded", (info) => {
      logger.info(`UPDATER: Downloaded ${info.version}`);
      this.sendStatus("downloaded");
    });

    // IPC
    ipcMain.handle("app:check-for-updates", async () => {
      logger.info("UPDATER: Manual check triggered via IPC");
      return this.checkForUpdates();
    });

    ipcMain.handle("app:quit-and-install", () => {
      logger.info("UPDATER: Quitting and installing...");
      autoUpdater.quitAndInstall();
    });
  }

  private sendStatus(status: string, message?: string) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send("updater:status", { status, message });
    }
  }

  private sendProgress(percent: number) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send("updater:progress", percent);
    }
  }

  public async checkForUpdates() {
    logger.info("UPDATER: Check triggered from main process");
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      logger.error("UPDATER: Failed to check for updates", e);
    }
  }
}

export const updaterService = new UpdaterService();
