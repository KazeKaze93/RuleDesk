import pkg from "electron-updater";
const { autoUpdater } = pkg;
import { logger } from "../lib/logger";
import { BrowserWindow, shell } from "electron";
import { IPC_CHANNELS } from "../ipc/channels";
import { buildGitHubReleasePageUrl } from "../lib/github-release-url";

export class UpdaterService {
  private window: BrowserWindow | null = null;
  /** Last version from update-available; sole source for openReleasePage URL. */
  private lastAvailableVersion: string | null = null;

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

    autoUpdater.on("checking-for-update", () => {
      logger.info("UPDATER: Checking...");
      this.sendStatus("checking");
    });

    autoUpdater.on("update-available", (info) => {
      logger.info(`UPDATER: Update available: ${info.version}`);
      this.lastAvailableVersion = info.version;
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
      // Background (and unused IPC) checks must not surface errors in the UI.
      logger.error("UPDATER: Error:", err);
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
      throw error;
    }
  }

  /**
   * Open the GitHub release page for the last update-available version (or /latest).
   * Version never comes from the renderer — only from autoUpdater + semver validation.
   */
  public async openReleasePage(): Promise<void> {
    const url = buildGitHubReleasePageUrl(this.lastAvailableVersion);
    logger.info(`UPDATER: Opening release page: ${url}`);
    await shell.openExternal(url);
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
