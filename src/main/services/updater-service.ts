import pkg from "electron-updater";
const { autoUpdater } = pkg;
import { logger } from "../lib/logger";
import { BrowserWindow, ipcMain, shell } from "electron";
import { IPC_CHANNELS } from "../ipc/channels";

const RELEASES_URL = "https://github.com/KazeKaze93/ruledesk/releases/latest";

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
      this.sendPayload(IPC_CHANNELS.UPDATER.STATUS, {
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

    ipcMain.handle(IPC_CHANNELS.APP.CHECK_FOR_UPDATES, async () => {
      return this.checkForUpdates();
    });

    ipcMain.handle(IPC_CHANNELS.APP.START_UPDATE_DOWNLOAD, async () => {
      logger.info("UPDATER: Opening GitHub releases for manual ZIP update.");
      await shell.openExternal(RELEASES_URL);
    });

    ipcMain.handle(IPC_CHANNELS.APP.QUIT_AND_INSTALL, async () => {
      logger.info("UPDATER: Opening GitHub releases (no in-app installer for ZIP build).");
      await shell.openExternal(RELEASES_URL);
    });
  }

  public async checkForUpdates(): Promise<void> {
    if (process.env.NODE_ENV === "development") {
      return;
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error("UPDATER: checkForUpdates failed:", error);
    }
  }

  private sendStatus(status: string, message?: string) {
    this.sendPayload(IPC_CHANNELS.UPDATER.STATUS, { status, message });
  }

  private sendPayload(channel: string, payload: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, payload);
    }
  }
}

export const updaterService = new UpdaterService();
