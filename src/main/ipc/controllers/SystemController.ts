import { app, clipboard, type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import path from "node:path";
import { readFileSync, existsSync } from "fs";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { closeDatabase } from "../../db/client";
import { IPC_CHANNELS } from "../channels";
import { getDatabasePaths } from "../../db/paths";
const GetIconPathArgsSchema = z.tuple([z.enum(["light", "dark"]).optional()]);
const WriteClipboardArgsSchema = z.tuple([z.string().min(1)]);

/**
 * System Controller
 *
 * Handles system-level IPC operations:
 * - Application version info
 * - Application lifecycle (quit)
 * - Clipboard operations
 */
// Query style: Drizzle Builder API only in this controller.
export class SystemController extends BaseController {
  /**
   * Setup IPC handlers for system operations
   */
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
      IPC_CHANNELS.APP.WRITE_CLIPBOARD,
      WriteClipboardArgsSchema,
      (event, ...args) => {
        const [text] = WriteClipboardArgsSchema.parse(args);
        return this.writeToClipboard(event, text);
      }
    );

    log.info("[SystemController] All handlers registered");
  }

  /**
   * Get application version
   *
   * @returns Application version string from package.json
   */
  private async getAppVersion(_event: IpcMainInvokeEvent): Promise<string> {
    const version = app.getVersion();
    log.info(`[SystemController] Version requested: ${version}`);
    return version;
  }

  private async getDatabaseLocation(_event: IpcMainInvokeEvent): Promise<string> {
    const { dbPath } = getDatabasePaths();
    return dbPath;
  }

  /**
   * Get application icon as base64 data URL
   *
   * @returns Base64 data URL of icon.png for use in img src
   */
  private async getIconPath(
    _event: IpcMainInvokeEvent,
    theme?: "light" | "dark"
  ): Promise<string> {
    log.info("[SystemController] getIconPath called");
    try {
      const isDev = process.env.NODE_ENV === "development";
      
      const iconsFolder = isDev
        ? path.join(process.cwd(), "resources", "icons")
        : path.join(app.getAppPath(), "..", "resources", "icons");

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
      
      // Check if file exists before reading
      if (!existsSync(iconPath)) {
        const errorMsg = `Icon file not found at: ${iconPath}`;
        log.error(`[SystemController] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      // Read file and convert to base64 data URL
      const iconBuffer = readFileSync(iconPath);
      const fileSizeKB = Math.round(iconBuffer.length / 1024);
      
      // Check file size - warn if too large (may cause performance issues)
      if (iconBuffer.length > 1024 * 1024) {
        log.warn(`[SystemController] Icon file is large (${fileSizeKB}KB), may cause performance issues`);
      }
      
      const base64 = iconBuffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;
      
      log.info(`[SystemController] Icon loaded successfully from: ${iconPath} (${fileSizeKB}KB, ${dataUrl.length} chars in data URL)`);
      return dataUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      log.error("[SystemController] Failed to load icon:", {
        message: errorMessage,
        stack: errorStack,
        error: String(error),
      });
      // Re-throw error so BaseController can serialize it properly
      throw new Error(`Failed to load icon: ${errorMessage}`);
    }
  }

  /**
   * Quit the application
   *
   * ⚠️ Note: This will trigger app lifecycle events (before-quit, will-quit, quit)
   * Make sure all cleanup handlers are properly registered before calling this.
   * 
   * CRITICAL: Closes database connection before quitting to prevent data corruption.
   *
   * @returns void (application will quit before return)
   */
  private async quitApp(_event: IpcMainInvokeEvent): Promise<void> {
    log.info("[SystemController] Application quit requested");
    // CRITICAL: Close database connection before quitting to prevent data corruption
    // SQLite requires explicit close() to ensure all transactions are committed
    closeDatabase();
    app.quit();
  }

  /**
   * Write text to system clipboard
   *
   * @param _event - IPC event (unused)
   * @param text - Text to write to clipboard (validated: min 1 char)
   * @returns true if operation succeeded, false otherwise
   */
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

  /**
   * Override sanitizeArgs to prevent logging sensitive clipboard data
   */
  protected sanitizeArgs(args: unknown[]): unknown[] {
    return args.map((arg) => {
      // Mask clipboard content in logs
      if (typeof arg === "string" && arg.length > 0) {
        return `<string:${arg.length}chars>`;
      }
      return arg;
    });
  }
}
