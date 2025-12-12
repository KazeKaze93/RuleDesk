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
    // Логирование событий апдейтера
    autoUpdater.logger = logger;

    // Настраиваем поведение: качать тихо
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => {
      this.sendStatus("checking");
    });

    autoUpdater.on("update-available", () => {
      this.sendStatus("available");
    });

    autoUpdater.on("update-not-available", () => {
      this.sendStatus("not-available");
    });

    autoUpdater.on("error", (err) => {
      logger.error("Update error:", err);
      this.sendStatus("error", err.message);
    });

    autoUpdater.on("download-progress", (progressObj) => {
      this.sendProgress(progressObj.percent);
    });

    autoUpdater.on("update-downloaded", () => {
      this.sendStatus("downloaded");
    });

    // IPC для ручной проверки или перезагрузки
    ipcMain.handle("app:check-for-updates", async () => {
      return autoUpdater.checkForUpdatesAndNotify();
    });

    ipcMain.handle("app:quit-and-install", () => {
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

  public checkForUpdates() {
    if (process.env.NODE_ENV === "production" || process.env.devUpdate) {
      try {
        autoUpdater.checkForUpdatesAndNotify();
      } catch (e) {
        logger.warn("Could not check for updates:", e);
      }
    }
  }
}

export const updaterService = new UpdaterService();
