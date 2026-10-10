import { app, clipboard, shell, type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import os from "node:os";
import path from "node:path";
import { readFileSync, existsSync, promises as fs } from "fs";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { closeDatabase } from "../../db/client";
import { IPC_CHANNELS } from "../channels";
import { getDatabasePaths } from "../../db/paths";
import { getAppIconsDirectory } from "../../lib/app-resources";
import { withSyncPausedForDbWork } from "../../lib/sync-db-maintenance";
import { isResolvedPathWithinBase } from "../../utils/path-within-base";
import {
  DIAGNOSTICS_LOG_TAIL_BYTES,
  GITHUB_ISSUE_BODY_MAX_CHARS,
} from "../../config/constants";
import {
  decodeLogTailBuffer,
  fitDiagnosticsToMaxChars,
  redactDiagnosticsLogTail,
  redactDiagnosticsPath,
} from "../../lib/diagnostics";
import {
  AppInfoSchema,
  DiagnosticsSchema,
  OpenLogsFolderResultSchema,
  type AppInfo,
  type Diagnostics,
  type OpenLogsFolderResult,
} from "../../../shared/schemas/system";
import type { SyncService } from "../../services/sync-service";
import type { VideoProxyServer } from "../../services/video-proxy-server";
import type { UpdaterService } from "../../services/updater-service";

const GetIconPathArgsSchema = z.tuple([z.enum(["light", "dark"]).optional()]);
const WriteClipboardArgsSchema = z.tuple([z.string().min(1)]);

const OPEN_LOGS_FOLDER_FAILED_MESSAGE = "Could not open the logs folder.";
const DIAGNOSTICS_LOG_READ_FAILED_MESSAGE = "Could not read the application log.";

/**
 * System Controller
 *
 * Handles system-level IPC operations:
 * - Application / runtime version info (Help)
 * - Logs folder + redacted diagnostics for bug reports
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
    this.handle(IPC_CHANNELS.APP.GET_APP_INFO, z.tuple([]), this.getAppInfo.bind(this));
    this.handle(IPC_CHANNELS.APP.GET_DB_LOCATION, z.tuple([]), this.getDatabaseLocation.bind(this));
    this.handle(
      IPC_CHANNELS.APP.OPEN_LOGS_FOLDER,
      z.tuple([]),
      this.openLogsFolder.bind(this)
    );
    this.handle(
      IPC_CHANNELS.APP.GET_DIAGNOSTICS,
      z.tuple([]),
      this.getDiagnostics.bind(this)
    );
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

  private resolveHomeDir(): string {
    try {
      return app.getPath("home");
    } catch {
      return os.homedir();
    }
  }

  private resolveLogFilePath(): string {
    const fileTransport = log.transports.file;
    if (
      fileTransport &&
      typeof fileTransport.getFile === "function"
    ) {
      return fileTransport.getFile().path;
    }
    return path.join(app.getPath("userData"), "logs", "app.log");
  }

  private buildAppInfo(): AppInfo {
    return AppInfoSchema.parse({
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron ?? "unknown",
      chromeVersion: process.versions.chrome ?? "unknown",
      nodeVersion: process.versions.node ?? "unknown",
      osPlatform: process.platform,
      osRelease: os.release(),
      osArch: process.arch,
    });
  }

  private async readLogTailBytes(
    filePath: string,
    maxBytes: number
  ): Promise<string> {
    let handle: fs.FileHandle | undefined;
    try {
      handle = await fs.open(filePath, "r");
      const stats = await handle.stat();
      if (stats.size === 0) {
        return "";
      }

      // File fits in the window: read whole file, keep the first line.
      if (stats.size <= maxBytes) {
        const buffer = Buffer.alloc(stats.size);
        await handle.read(buffer, 0, stats.size, 0);
        return decodeLogTailBuffer(buffer, false);
      }

      // Oversized: read last maxBytes, drop partial first line (and fix UTF-8 edge).
      const start = stats.size - maxBytes;
      const buffer = Buffer.alloc(maxBytes);
      await handle.read(buffer, 0, maxBytes, start);
      return decodeLogTailBuffer(buffer, true);
    } finally {
      if (handle !== undefined) {
        await handle.close();
      }
    }
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

  private async getAppInfo(_event: IpcMainInvokeEvent): Promise<AppInfo> {
    return this.buildAppInfo();
  }

  private async openLogsFolder(
    _event: IpcMainInvokeEvent
  ): Promise<OpenLogsFolderResult> {
    const homeDir = this.resolveHomeDir();
    const logFilePath = this.resolveLogFilePath();
    const logsDir = path.dirname(logFilePath);

    try {
      await fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
      log.error("[SystemController] Failed to ensure logs directory:", error);
      return OpenLogsFolderResultSchema.parse({
        ok: false,
        error: OPEN_LOGS_FOLDER_FAILED_MESSAGE,
      });
    }

    // shell.openPath returns "" on success and an error string on failure (does not throw).
    // The error string often embeds absolute paths — redact before IPC to the UI/toast.
    const openError = await shell.openPath(logsDir);
    if (openError.length > 0) {
      log.error(`[SystemController] shell.openPath failed: ${openError}`);
      const safeError = redactDiagnosticsLogTail(openError, homeDir).trim();
      return OpenLogsFolderResultSchema.parse({
        ok: false,
        error:
          safeError.length > 0 ? safeError : OPEN_LOGS_FOLDER_FAILED_MESSAGE,
      });
    }
    return OpenLogsFolderResultSchema.parse({ ok: true });
  }

  private async getDiagnostics(_event: IpcMainInvokeEvent): Promise<Diagnostics> {
    const homeDir = this.resolveHomeDir();
    const appInfo = this.buildAppInfo();
    const rawLogPath = this.resolveLogFilePath();
    const logPath = redactDiagnosticsPath(rawLogPath, homeDir);

    let rawTail = "";
    try {
      if (existsSync(rawLogPath)) {
        rawTail = await this.readLogTailBytes(
          rawLogPath,
          DIAGNOSTICS_LOG_TAIL_BYTES
        );
      }
    } catch (error) {
      log.error("[SystemController] Failed to read log tail:", error);
      throw new Error(DIAGNOSTICS_LOG_READ_FAILED_MESSAGE);
    }

    const redactedTail = redactDiagnosticsLogTail(rawTail, homeDir);
    const fitted = fitDiagnosticsToMaxChars({
      appInfo,
      logPath,
      logTail: redactedTail,
      maxChars: GITHUB_ISSUE_BODY_MAX_CHARS,
    });

    return DiagnosticsSchema.parse({
      appInfo,
      logPath,
      logTail: fitted.logTail,
      clipboardText: fitted.clipboardText,
    });
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
   * Deletes all application data under userData (RuleDesk-Data), then exits.
   * Order: close DB → stop video proxy → delete children of userData → app.exit(0).
   * User download folders and backups outside userData are not touched.
   */
  private getSyncService(): SyncService {
    return container.resolve(DI_TOKENS.SYNC_SERVICE);
  }

  private async wipeAllData(_event: IpcMainInvokeEvent): Promise<void> {
    const userDataDir = path.resolve(app.getPath("userData"));
    log.warn(`[SystemController] Wipe all data requested for: ${userDataDir}`);

    await withSyncPausedForDbWork(this.getSyncService(), async () => {
      closeDatabase();
      await this.videoProxyServer.stop();

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
    });

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
