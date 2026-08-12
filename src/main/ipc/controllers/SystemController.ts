import { app, clipboard, type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import path from "node:path";
import { readFileSync, existsSync, promises as fs } from "fs";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { closeDatabase } from "../../db/client";
import { IPC_CHANNELS } from "../channels";
import { getDatabasePaths } from "../../db/paths";
import { getAppIconsDirectory } from "../../lib/app-resources";
import { isResolvedPathWithinBase } from "../../utils/path-within-base";
import type { VideoProxyServer } from "../../services/video-proxy-server";
import type { UpdaterService } from "../../services/updater-service";

const GetIconPathArgsSchema = z.tuple([z.enum(["light", "dark"]).optional()]);
const WriteClipboardArgsSchema = z.tuple([z.string().min(1)]);

/**
 * System Controller
 *
 * Handles system-level IPC operations:
 * - Application version info
 * - Application lifecycle (quit, wipe all local data)
 * - Clipboard operations
 * - Manual update checks / release-page openers
 */
export class SystemController extends BaseController {
  private readonly videoProxyServer: VideoProxyServer;
  private readonly updaterService: UpdaterService;

  constructor(videoProxyServer: VideoProxyServer, updaterService: UpdaterService) {
    super();
    this.videoProxyServer = videoProxyServer;
    this.updaterService = updaterService;
  }

  public setup(): void {
    this.handle(IPC_CHANNELS.APP.GET_VERSION, z.tuple([]), this.getAppVersion.bind(this));
    this.handle(IPC_CHANNELS.APP.GET_DB_LOCATION, z.tuple([]), this.getDatabaseLocation.bind(this));
    this.handle(
      IPC_CHANNELS.APP.GET_ICON_PATH,
      GetIconPathArgsSchema,
      (event, ...args) => {
        const [theme] = GetIconPathArgsSchema.parse(args);
        return this.getIconPath(event, theme);
      }
    );
    this.handle(IPC_CHANNELS.APP.QUIT, z.tuple([]), this.quitApp.bind(this));
    this.handle(
      IPC_CHANNELS.APP.WIPE_ALL_DATA,
      z.tuple([]),
      this.wipeAllData.bind(this)
    );
    this.handle(
      IPC_CHANNELS.APP.WRITE_CLIPBOARD,
      WriteClipboardArgsSchema,
      (event, ...args) => {
        const [text] = WriteClipboardArgsSchema.parse(args);
        return this.writeToClipboard(event, text);
      }
    );
    this.handle(
      IPC_CHANNELS.APP.CHECK_FOR_UPDATES,
      z.tuple([]),
      this.checkForUpdates.bind(this)
    );
    this.handle(
      IPC_CHANNELS.APP.START_UPDATE_DOWNLOAD,
      z.tuple([]),
      this.startUpdateDownload.bind(this)
    );
    this.handle(
      IPC_CHANNELS.APP.QUIT_AND_INSTALL,
      z.tuple([]),
      this.quitAndInstall.bind(this)
    );

    log.info("[SystemController] All handlers registered");
  }

  private async checkForUpdates(_event: IpcMainInvokeEvent): Promise<void> {
    await this.updaterService.checkForUpdates();
  }

  private async startUpdateDownload(_event: IpcMainInvokeEvent): Promise<void> {
    await this.updaterService.openReleasesPage("download");
  }

  private async quitAndInstall(_event: IpcMainInvokeEvent): Promise<void> {
    await this.updaterService.openReleasesPage("install");
  }

  private async getAppVersion(_event: IpcMainInvokeEvent): Promise<string> {
    const version = app.getVersion();
    log.info(`[SystemController] Version requested: ${version}`);
    return version;
  }

  private async getDatabaseLocation(_event: IpcMainInvokeEvent): Promise<string> {
    const { dbPath } = getDatabasePaths();
    return dbPath;
  }

  private async getIconPath(
    _event: IpcMainInvokeEvent,
    theme?: "light" | "dark"
  ): Promise<string> {
    log.info("[SystemController] getIconPath called");
    try {
      const iconsFolder = getAppIconsDirectory();

      const candidateFileNames =
        theme === "dark"
          ? ["icon-dark.png", "icon.png"]
          : theme === "light"
            ? ["icon-light.png", "icon.png"]
            : ["icon.png"];

      const iconPath =
        candidateFileNames
          .map((fileName) => path.join(iconsFolder, fileName))
          .find((candidatePath) => existsSync(candidatePath)) ??
        path.join(iconsFolder, "icon.png");

      log.info(`[SystemController] Attempting to load icon from: ${iconPath}`);

      if (!existsSync(iconPath)) {
        const errorMsg = `Icon file not found at: ${iconPath}`;
        log.error(`[SystemController] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const iconBuffer = readFileSync(iconPath);
      const fileSizeKB = Math.round(iconBuffer.length / 1024);

      if (iconBuffer.length > 1024 * 1024) {
        log.warn(
          `[SystemController] Icon file is large (${fileSizeKB}KB), may cause performance issues`
        );
      }

      const base64 = iconBuffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;

      log.info(
        `[SystemController] Icon loaded successfully from: ${iconPath} (${fileSizeKB}KB, ${dataUrl.length} chars in data URL)`
      );
      return dataUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      log.error("[SystemController] Failed to load icon:", {
        message: errorMessage,
        stack: errorStack,
        error: String(error),
      });
      throw new Error(`Failed to load icon: ${errorMessage}`);
    }
  }

  private async quitApp(_event: IpcMainInvokeEvent): Promise<void> {
    log.info("[SystemController] Application quit requested");
    closeDatabase();
    app.quit();
  }

  /**
   * Deletes all application data under userData (.rdcache), then exits.
   * Order: close DB → stop video proxy → delete children of userData → app.exit(0).
   * User download folders and backups outside userData are not touched.
   */
  private async wipeAllData(_event: IpcMainInvokeEvent): Promise<void> {
    const userDataDir = path.resolve(app.getPath("userData"));
    log.warn(`[SystemController] Wipe all data requested for: ${userDataDir}`);

    closeDatabase();
    this.videoProxyServer.stop();

    let entries: string[];
    try {
      entries = await fs.readdir(userDataDir);
    } catch (error) {
      log.error("[SystemController] Failed to list userData for wipe:", error);
      throw new Error("Could not read application data folder.");
    }

    const failures: string[] = [];

    for (const name of entries) {
      const fullPath = path.resolve(userDataDir, name);
      if (!isResolvedPathWithinBase(fullPath, userDataDir)) {
        log.error(
          `[SystemController] Refusing wipe path outside userData: ${fullPath}`
        );
        failures.push(name);
        continue;
      }

      try {
        await fs.rm(fullPath, { recursive: true, force: true });
        log.info(`[SystemController] Wiped: ${name}`);
      } catch (error) {
        log.error(`[SystemController] Failed to wipe "${name}":`, error);
        failures.push(name);
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Could not delete: ${failures.join(", ")}. Close other apps using these files and try again.`
      );
    }

    log.warn("[SystemController] Wipe complete — exiting");
    app.exit(0);
  }

  private async writeToClipboard(
    _event: IpcMainInvokeEvent,
    text: string
  ): Promise<boolean> {
    try {
      clipboard.writeText(text);
      log.info(
        `[SystemController] Text written to clipboard (${text.length} chars)`
      );
      return true;
    } catch (error) {
      log.error("[SystemController] Failed to write to clipboard:", error);
      return false;
    }
  }
}
