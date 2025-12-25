import { type IpcMainInvokeEvent } from "electron";
import { app, shell, dialog, BrowserWindow, type BrowserWindow as BrowserWindowType } from "electron";
import path from "path";
import fs from "fs";
import axios, { type AxiosProgressEvent } from "axios";
import { pipeline } from "stream/promises";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { IPC_CHANNELS } from "../channels";

const DOWNLOAD_ROOT = path.join(app.getPath("downloads"), "BooruClient");

// Maximum filename length to prevent filesystem errors
// Most filesystems (Windows, Linux, macOS) limit filenames to 255 characters
// We use 200 to account for path length and extensions
const MAX_FILENAME_LENGTH = 200;

const DownloadFileSchema = z.object({
  url: z
    .string()
    .url()
    .refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
      message: "Only HTTP/HTTPS protocols are allowed for downloads.",
    }),
  filename: z
    .string()
    .min(1)
    .max(MAX_FILENAME_LENGTH, `Filename must not exceed ${MAX_FILENAME_LENGTH} characters`)
    .regex(/^[\w\-. ]+$/, "Invalid filename characters"),
});

const OpenFolderSchema = z.string().min(1);

/**
 * File Controller
 *
 * Handles file-related IPC operations:
 * - Downloading files with progress tracking
 * - Opening folders in file manager
 */
export class FileController extends BaseController {
  private mainWindow: BrowserWindowType | null = null;
  private totalBytes = 0;

  /**
   * Set main window reference (needed for download dialogs and progress events)
   *
   * @param window - Main browser window instance
   */
  public setMainWindow(window: BrowserWindowType): void {
    this.mainWindow = window;
  }

  /**
   * Get main window instance
   *
   * @returns Main window or undefined
   */
  private getMainWindow(): BrowserWindowType | undefined {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow;
    }
    // Fallback: find any visible window
    const windows = BrowserWindow.getAllWindows();
    return windows.find((w) => w.isVisible() && !w.isDestroyed()) || windows[0];
  }

  /**
   * Setup IPC handlers for file operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.FILES.DOWNLOAD,
      z.tuple([
        DownloadFileSchema.shape.url, // URL with HTTP/HTTPS validation
        DownloadFileSchema.shape.filename, // Filename with length and character validation
      ]),
      this.downloadFile.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.FILES.OPEN_FOLDER,
      OpenFolderSchema, // Single argument schema
      this.openFolder.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );

    log.info("[FileController] All handlers registered");
  }

  /**
   * Download file with "Save As" dialog and progress tracking
   *
   * @param _event - IPC event (unused)
   * @param url - File URL to download
   * @param filename - Suggested filename
   * @returns Download result with success status and path
   */
  private async downloadFile(
    _event: IpcMainInvokeEvent,
    url: string,
    filename: string
  ): Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      log.error("[FileController] Main window not found for download");
      return { success: false, error: "Main window not available" };
    }

    // Validate input data using Zod schema
    const validation = DownloadFileSchema.safeParse({ url, filename });

    if (!validation.success) {
      log.error("[FileController] Download validation failed", validation.error);
      return { success: false, error: "Invalid URL or Filename" };
    }

    const { url: validUrl, filename: validFilename } = validation.data;

    try {
      const defaultDir = DOWNLOAD_ROOT;

      // Safely create directory
      if (!fs.existsSync(defaultDir)) {
        try {
          fs.mkdirSync(defaultDir, { recursive: true });
        } catch (e) {
          log.error("[FileController] Failed to create download directory", e);
          // Don't fail, dialog will just open in OS default folder
        }
      }

      const defaultPath = path.join(defaultDir, validFilename);

      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: "Скачать файл",
        defaultPath: defaultPath,
        buttonLabel: "Скачать",
        filters: [
          {
            name: "Media Files",
            extensions: ["jpg", "jpeg", "png", "gif", "mp4", "webm"],
          },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (canceled || !filePath) {
        log.info("[FileController] Download canceled by user");
        return { success: false, canceled: true };
      }

      log.info(`[FileController] Downloading: ${validUrl} -> ${filePath}`);

      const response = await axios({
        method: "GET",
        url: validUrl,
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
          if (!mainWindow || !progressEvent.total) return;

          this.totalBytes = progressEvent.total;
          const percent = Math.round((progressEvent.loaded * 100) / this.totalBytes);

          mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
            id: validFilename, // Use validated filename as ID
            percent: percent,
          });
        },
      });

      const writer = fs.createWriteStream(filePath);
      await pipeline(response.data, writer);

      mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
        id: validFilename,
        percent: 100,
      });
      log.info(`[FileController] Download success -> ${filePath}`);
      return { success: true, path: filePath };
    } catch (error) {
      if (mainWindow) {
        mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
          id: validFilename,
          percent: 0,
        });
      }
      log.error("[FileController] Download failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Open folder in file manager
   *
   * @param _event - IPC event (unused)
   * @param filePathOrName - Path or filename to open
   * @returns True if folder was opened successfully
   */
  private async openFolder(
    _event: IpcMainInvokeEvent,
    filePathOrName: string
  ): Promise<boolean> {
    try {
      let fullPath = filePathOrName;

      if (!path.isAbsolute(filePathOrName)) {
        fullPath = path.join(DOWNLOAD_ROOT, filePathOrName);
      }

      const normalizedPath = path.normalize(fullPath);

      // Security check: ensure path is within safe directory
      if (!normalizedPath.startsWith(DOWNLOAD_ROOT)) {
        log.error(
          `[FileController] SECURITY VIOLATION: Attempt to open path outside safe directory: ${normalizedPath}`
        );
        shell.openPath(DOWNLOAD_ROOT);
        return false;
      }

      if (fs.existsSync(normalizedPath)) {
        shell.showItemInFolder(normalizedPath);
        return true;
      }

      if (fs.existsSync(DOWNLOAD_ROOT)) {
        await shell.openPath(DOWNLOAD_ROOT);
        return true;
      }

      return false;
    } catch (error) {
      log.error("[FileController] Failed to open folder:", error);
      return false;
    }
  }
}

