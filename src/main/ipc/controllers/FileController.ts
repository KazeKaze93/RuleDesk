import { type IpcMainInvokeEvent } from "electron";
import { app, shell, dialog, BrowserWindow, type BrowserWindow as BrowserWindowType } from "electron";
import path from "path";
import fs from "fs";
import { Worker } from "worker_threads";
import { access, mkdir, readFile, realpath, unlink } from "fs/promises";
import axios, { type AxiosProgressEvent } from "axios";
import { pipeline } from "stream/promises";
import log from "electron-log";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";

const DEFAULT_DOWNLOAD_ROOT = path.join(app.getPath("downloads"), "BooruClient");
const DOWNLOAD_QUEUE_FILE = "download-queue.json";

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

const BATCH_DOWNLOAD_MAX_FILES = 500;

const DownloadAllItemSchema = z.object({
  url: DownloadFileSchema.shape.url,
  filename: DownloadFileSchema.shape.filename,
});

const DownloadAllSchema = z.array(DownloadAllItemSchema).max(BATCH_DOWNLOAD_MAX_FILES);

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
  // Track active downloads to cancel them on window close
  private activeDownloads = new Map<string, AbortController>();
  private downloadWorker: Worker | null = null;

  /**
   * Set main window reference (needed for download dialogs and progress events)
   *
   * @param window - Main browser window instance
   */
  public setMainWindow(window: BrowserWindowType): void {
    this.mainWindow = window;
    
    // Cleanup active downloads when window is closed
    window.once("closed", () => {
      this.cancelAllDownloads();
    });
  }

  /**
   * Cancel batch download (sends message to Worker Thread)
   */
  public cancelDownloadAll(): boolean {
    if (this.downloadWorker) {
      this.downloadWorker.postMessage({ type: "cancel" });
      log.info("[FileController] Batch download cancel requested");
      return true;
    }
    return false;
  }

  /**
   * Pause batch download
   */
  public pauseDownloadAll(): void {
    if (this.downloadWorker) {
      this.downloadWorker.postMessage({ type: "pause" });
      log.info("[FileController] Batch download paused");
    }
  }

  /**
   * Resume batch download
   */
  public resumeDownloadAll(): void {
    if (this.downloadWorker) {
      this.downloadWorker.postMessage({ type: "resume" });
      log.info("[FileController] Batch download resumed");
    }
  }

  /**
   * Cancel all active downloads (called on window close)
   */
  private cancelAllDownloads(): void {
    log.info(`[FileController] Canceling ${this.activeDownloads.size} active downloads`);
    for (const [filename, controller] of this.activeDownloads.entries()) {
      controller.abort();
      log.debug(`[FileController] Canceled download: ${filename}`);
    }
    this.activeDownloads.clear();
    if (this.downloadWorker) {
      this.downloadWorker.postMessage({ type: "cancel" });
      this.downloadWorker.terminate().catch(() => {});
      this.downloadWorker = null;
    }
  }

  private getQueueFilePath(): string {
    return path.join(app.getPath("userData"), DOWNLOAD_QUEUE_FILE);
  }

  private async readQueueFile(): Promise<{
    items: Array<{ url: string; filename: string }>;
    doneCount: number;
    total: number;
    folder: string;
    timestamp: number;
  } | null> {
    try {
      const p = this.getQueueFilePath();
      await access(p);
      const raw = await readFile(p, "utf-8");
      const data = JSON.parse(raw);
      if (!Array.isArray(data.items) || typeof data.doneCount !== "number") return null;
      return data;
    } catch {
      return null;
    }
  }

  private async deleteQueueFile(): Promise<void> {
    try {
      const p = this.getQueueFilePath();
      await access(p);
      await unlink(p);
      this.notifyPendingDownloadStateChanged();
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        log.warn("[FileController] Failed to delete queue file:", e);
      }
    }
  }

  private notifyPendingDownloadStateChanged(): void {
    const win = this.getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.FILES.PENDING_DOWNLOAD_STATE_CHANGED);
    }
  }

  private async getPendingDownload(): Promise<{
    hasPending: boolean;
    total: number;
    done: number;
    folder: string;
  } | null> {
    const data = await this.readQueueFile();
    if (!data || data.doneCount >= data.items.length) return null;
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAgeMs) {
      await this.deleteQueueFile();
      return null;
    }
    return {
      hasPending: true,
      total: data.total,
      done: data.doneCount,
      folder: data.folder,
    };
  }

  private async resumePendingDownload(
    event: IpcMainInvokeEvent
  ): Promise<{ success: boolean; error?: string }> {
    const data = await this.readQueueFile();
    if (!data || data.doneCount >= data.items.length) {
      await this.deleteQueueFile();
      return { success: false, error: "No pending download" };
    }
    const remaining = data.items.slice(data.doneCount);
    await this.deleteQueueFile();
    const result = await this.downloadAll(event, remaining);
    return {
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Get download settings (duplicate behavior, folder structure)
   */
  private getDownloadSettings(): {
    duplicateFileBehavior: "skip" | "overwrite";
    downloadFolderStructure: "flat" | "{artist_id}";
  } {
    try {
      const db = container.resolve(DI_TOKENS.DB);
      const row = db
        .select({
          duplicateFileBehavior: settings.duplicateFileBehavior,
          downloadFolderStructure: settings.downloadFolderStructure,
        })
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .get();
      return {
        duplicateFileBehavior:
          (row?.duplicateFileBehavior as "skip" | "overwrite") || "skip",
        downloadFolderStructure:
          (row?.downloadFolderStructure as "flat" | "{artist_id}") || "flat",
      };
    } catch (e) {
      log.warn("[FileController] Failed to get download settings:", e);
      return { duplicateFileBehavior: "skip", downloadFolderStructure: "flat" };
    }
  }

  /**
   * Get download root folder from settings (or default)
   */
  private async getDownloadRoot(): Promise<string> {
    try {
      const db = container.resolve(DI_TOKENS.DB);
      const row = db
        .select({ downloadFolder: settings.downloadFolder })
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .get();
      const folder = row?.downloadFolder?.trim();
      if (folder) {
        try {
          await access(folder);
          return folder;
        } catch {
          /* folder doesn't exist or inaccessible */
        }
      }
    } catch (e) {
      log.warn("[FileController] Failed to get download folder from settings:", e);
    }
    return DEFAULT_DOWNLOAD_ROOT;
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
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.downloadFile.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.FILES.OPEN_FOLDER,
      OpenFolderSchema, // Single argument schema
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.openFolder.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.FILES.SELECT_DOWNLOAD_FOLDER,
      z.tuple([]),
      this.selectDownloadFolder.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.FILES.DOWNLOAD_ALL,
      z.tuple([DownloadAllSchema]),
      this.downloadAll.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.FILES.CANCEL_DOWNLOAD_ALL,
      z.tuple([]),
      () => Promise.resolve(this.cancelDownloadAll())
    );
    this.handle(
      IPC_CHANNELS.FILES.PAUSE_DOWNLOAD_ALL,
      z.tuple([]),
      () => {
        this.pauseDownloadAll();
        return Promise.resolve();
      }
    );
    this.handle(
      IPC_CHANNELS.FILES.RESUME_DOWNLOAD_ALL,
      z.tuple([]),
      () => {
        this.resumeDownloadAll();
        return Promise.resolve();
      }
    );
    this.handle(
      IPC_CHANNELS.FILES.GET_PENDING_DOWNLOAD,
      z.tuple([]),
      this.getPendingDownload.bind(this),
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.FILES.RESUME_PENDING_DOWNLOAD,
      z.tuple([]),
      this.resumePendingDownload.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.FILES.DISMISS_PENDING_DOWNLOAD,
      z.tuple([]),
      async () => {
        await this.deleteQueueFile();
        this.notifyPendingDownloadStateChanged();
      }
    );

    log.info("[FileController] All handlers registered");
  }

  /**
   * Open folder picker for selecting default download directory
   * @returns Selected folder path or null if canceled
   */
  private async selectDownloadFolder(
    _event: IpcMainInvokeEvent
  ): Promise<string | null> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Select Download Folder",
      defaultPath: await this.getDownloadRoot(),
      properties: ["openDirectory"],
    });
    if (canceled || !filePaths?.length) return null;
    return filePaths[0] ?? null;
  }

  /**
   * Download multiple files via Worker Thread.
   * Heavy I/O (network, disk) runs off Main process to avoid blocking UI.
   * Main only orchestrates: spawn Worker, forward progress, handle cancel/pause/resume.
   */
  private async downloadAll(
    _event: IpcMainInvokeEvent,
    items: Array<{ url: string; filename: string }>
  ): Promise<{
    success: boolean;
    downloaded: number;
    failed: number;
    canceled: boolean;
    error?: string;
  }> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      return { success: false, downloaded: 0, failed: 0, canceled: false, error: "Main window not available" };
    }

    const validation = DownloadAllSchema.safeParse(items);
    if (!validation.success) {
      log.error("[FileController] DownloadAll validation failed", validation.error);
      return {
        success: false,
        downloaded: 0,
        failed: 0,
        canceled: false,
        error: `Invalid input. Max ${BATCH_DOWNLOAD_MAX_FILES} files allowed.`,
      };
    }

    const validItems = validation.data;
    if (validItems.length === 0) {
      return { success: true, downloaded: 0, failed: 0, canceled: false };
    }

    const folder = await this.getDownloadRoot();
    const { duplicateFileBehavior, downloadFolderStructure } = this.getDownloadSettings();
    try {
      await access(folder);
    } catch {
      try {
        await mkdir(folder, { recursive: true });
      } catch (e) {
        log.error("[FileController] Failed to create download directory", e);
        return {
          success: false,
          downloaded: 0,
          failed: validItems.length,
          canceled: false,
          error: "Failed to create download directory",
        };
      }
    }

    const workerPath = path.join(__dirname, "workers", "downloadWorker.cjs");
    return new Promise((resolve) => {
      const fail = (error: string) =>
        resolve({
          success: false,
          downloaded: 0,
          failed: validItems.length,
          canceled: false,
          error,
        });

      try {
        const worker = new Worker(workerPath, {
          workerData: {
            items: validItems,
            folder,
            duplicateFileBehavior,
            downloadFolderStructure,
            queueFilePath: this.getQueueFilePath(),
          },
        });
        this.downloadWorker = worker;

        worker.on("message", (msg: { type: string; id?: string; percent?: number; done?: number; total?: number; success?: boolean; downloaded?: number; failed?: number; canceled?: boolean; error?: string }) => {
          if (msg.type === "progress" && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_ALL_PROGRESS, {
              id: msg.id,
              percent: msg.percent ?? 0,
              done: msg.done ?? 0,
              total: msg.total ?? validItems.length,
            });
          } else if (msg.type === "complete") {
            this.downloadWorker = null;
            if (msg.success && !msg.canceled) {
              this.notifyPendingDownloadStateChanged();
            }
            resolve({
              success: msg.success ?? false,
              downloaded: msg.downloaded ?? 0,
              failed: msg.failed ?? 0,
              canceled: msg.canceled ?? false,
            });
          } else if (msg.type === "error") {
            this.downloadWorker = null;
            fail(msg.error ?? "Worker error");
          }
        });

        worker.on("error", (err) => {
          this.downloadWorker = null;
          log.error("[FileController] Download worker error:", err);
          fail(err.message);
        });

        worker.on("exit", (code) => {
          if (code !== 0 && this.downloadWorker) {
            this.downloadWorker = null;
            fail(`Worker exited with code ${code}`);
          }
        });
      } catch (err) {
        this.downloadWorker = null;
        log.error("[FileController] Failed to spawn download worker:", err);
        fail(err instanceof Error ? err.message : String(err));
      }
    });
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
      const defaultDir = await this.getDownloadRoot();

      // Safely create directory
      try {
        await access(defaultDir);
      } catch {
        try {
          await mkdir(defaultDir, { recursive: true });
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

      // Create AbortController for this download
      const abortController = new AbortController();
      this.activeDownloads.set(validFilename, abortController);

      // Check if window is still valid before starting download
      if (mainWindow.isDestroyed()) {
        abortController.abort();
        this.activeDownloads.delete(validFilename);
        return { success: false, error: "Window was closed", canceled: true };
      }

      try {
        const response = await axios({
          method: "GET",
          url: validUrl,
          responseType: "stream",
          signal: abortController.signal, // Critical: allows cancellation
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
            // Check if window is still valid before sending progress
            if (mainWindow.isDestroyed() || abortController.signal.aborted) {
              abortController.abort();
              return;
            }

            if (!progressEvent.total) return;

            this.totalBytes = progressEvent.total;
            const percent = Math.round((progressEvent.loaded * 100) / this.totalBytes);

            mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
              id: validFilename, // Use validated filename as ID
              percent: percent,
            });
          },
        });

        const writer = fs.createWriteStream(filePath);
        
        // Handle abort: close writer stream to prevent file corruption
        abortController.signal.addEventListener("abort", () => {
          if (!writer.destroyed) {
            writer.destroy();
          }
        }, { once: true });
        
        // Pipeline with abort signal support (Node.js 20+)
        // If signal is aborted, pipeline will throw AbortError and writer will be closed
        await pipeline(response.data, writer, { signal: abortController.signal });

        // Cleanup: remove from active downloads
        this.activeDownloads.delete(validFilename);

        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_PROGRESS, {
            id: validFilename,
            percent: 100,
          });
        }
        log.info(`[FileController] Download success -> ${filePath}`);
        return { success: true, path: filePath };
      } catch (error) {
        // Cleanup: remove from active downloads
        this.activeDownloads.delete(validFilename);

        // Check if error is due to abort
        const isAborted = abortController.signal.aborted || 
          (error instanceof Error && error.name === "AbortError") ||
          (axios.isCancel && axios.isCancel(error));

        if (isAborted) {
          log.info(`[FileController] Download canceled: ${validFilename}`);
          // Clean up partial file if it exists
          try {
            await access(filePath);
            await unlink(filePath);
          } catch (unlinkError) {
            if ((unlinkError as NodeJS.ErrnoException).code !== "ENOENT") {
              log.warn("[FileController] Failed to clean up partial file:", unlinkError);
            }
          }
          return { success: false, canceled: true };
        }

        if (mainWindow && !mainWindow.isDestroyed()) {
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
    } catch (error) {
      log.error("[FileController] Download setup failed:", error);
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
      const downloadRoot = await this.getDownloadRoot();
      let fullPath = filePathOrName;

      if (!path.isAbsolute(filePathOrName)) {
        fullPath = path.join(downloadRoot, filePathOrName);
      }

      const normalizedPath = path.normalize(fullPath);

      // Security check: ensure path is within safe directory (before resolving symlinks)
      if (!normalizedPath.startsWith(downloadRoot)) {
        log.error(
          `[FileController] SECURITY VIOLATION: Attempt to open path outside safe directory: ${normalizedPath}`
        );
        shell.openPath(downloadRoot);
        return false;
      }

      // Critical security: resolve symlinks to get real path on disk
      // This prevents path traversal via symbolic links
      let resolvedPath: string;
      try {
        resolvedPath = await realpath(normalizedPath);
      } catch (error: unknown) {
        // Path doesn't exist or is inaccessible, fallback to download root
        log.warn(`[FileController] Failed to resolve real path: ${normalizedPath}`, error);
        try {
          await access(downloadRoot);
          await shell.openPath(downloadRoot);
          return true;
        } catch {
          return false;
        }
      }

      // Security check: ensure real path (after symlink resolution) is still within safe directory
      const normalizedRealPath = path.normalize(resolvedPath);
      if (!normalizedRealPath.startsWith(downloadRoot)) {
        log.error(
          `[FileController] SECURITY VIOLATION: Real path outside safe directory: ${normalizedRealPath} (original: ${normalizedPath})`
        );
        shell.openPath(downloadRoot);
        return false;
      }

      try {
        await access(resolvedPath);
        shell.showItemInFolder(resolvedPath);
        return true;
      } catch {
        /* path doesn't exist */
      }

      try {
        await access(downloadRoot);
        await shell.openPath(downloadRoot);
        return true;
      } catch {
        return false;
      }
    } catch (error: unknown) {
      log.error("[FileController] Failed to open folder:", error);
      return false;
    }
  }
}

