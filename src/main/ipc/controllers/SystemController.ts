import { app, clipboard, type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";

/**
 * System Controller
 *
 * Handles system-level IPC operations:
 * - Application version info
 * - Application lifecycle (quit)
 * - Clipboard operations
 */
export class SystemController extends BaseController {
  /**
   * Setup IPC handlers for system operations
   */
  public setup(): void {
    this.handle("app:get-version", z.tuple([]), this.getAppVersion.bind(this));
    this.handle("app:quit", z.tuple([]), this.quitApp.bind(this));
    this.handle(
      "app:write-to-clipboard",
      z.tuple([z.string().min(1)]),
      this.writeToClipboard.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
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

  /**
   * Quit the application
   *
   * ⚠️ Note: This will trigger app lifecycle events (before-quit, will-quit, quit)
   * Make sure all cleanup handlers are properly registered before calling this.
   *
   * @returns void (application will quit before return)
   */
  private async quitApp(_event: IpcMainInvokeEvent): Promise<void> {
    log.info("[SystemController] Application quit requested");
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
