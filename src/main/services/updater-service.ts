import pkg from "electron-updater";
const { autoUpdater } = pkg;
import { logger } from "../lib/logger";
import { BrowserWindow, shell } from "electron";

const isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;

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
        isPortable: isPortable,
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
  }

  private sendPayload(channel: string, data: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  private sendStatus(status: string, message?: string) {
    this.sendPayload("updater:status", { status, message });
  }

  // === PUBLIC API (Вызывается из IPC слоя) ===

  public async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      logger.error("UPDATER: Check failed", e);
    }
  }

  public async downloadUpdate() {
    if (isPortable) {
      logger.info("UPDATER: Portable detected. Opening GitHub releases.");
      await shell.openExternal(
        "https://github.com/KazeKaze93/ruledesk/releases/latest"
      );
      return;
    }

    logger.info("UPDATER: User requested download starting...");
    return autoUpdater.downloadUpdate();
  }

  public quitAndInstall() {
    logger.info("UPDATER: Quitting and installing...");
    autoUpdater.quitAndInstall();
  }
}

export const updaterService = new UpdaterService();
