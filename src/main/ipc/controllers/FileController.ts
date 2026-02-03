import { type IpcMainInvokeEvent } from "electron";
import { app, shell, dialog, BrowserWindow, type BrowserWindow as BrowserWindowType } from "electron";
import path from "path";
import fs from "fs";
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

// Batch download limits (see docs/download-batch-risks.md)
const BATCH_DOWNLOAD_CONCURRENCY = 3;
const BATCH_DOWNLOAD_DELAY_MS = 500;
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
  private batchAbortController: AbortController | null = null;
  private batchPaused = false;

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
   * Cancel batch download (called from IPC or window close)
   */
  public cancelDownloadAll(): boolean {
    if (this.batchAbortController) {
      this.batchAbortController.abort();
      this.batchPaused = false;
      log.info("[FileController] Batch download canceled by user");
      return true;
    }
    return false;
  }

  /**
   * Pause batch download (workers stop taking new items)
   */
  public pauseDownloadAll(): void {
    this.batchPaused = true;
    log.info("[FileController] Batch download paused");
  }

  /**
   * Resume batch download
   */
  public resumeDownloadAll(): void {
    this.batchPaused = false;
    log.info("[FileController] Batch download resumed");
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
    if (this.batchAbortController) {
      this.batchAbortController.abort();
      this.batchAbortController = null;
    }
  }

  private getQueueFilePath(): string {
    return path.join(app.getPath("userData"), DOWNLOAD_QUEUE_FILE);
  }

  private writeQueueFile(data: {
    items: Array<{ url: string; filename: string }>;
    doneCount: number;
    total: number;
    folder: string;
    timestamp: number;
  }): void {
    try {
      fs.writeFileSync(this.getQueueFilePath(), JSON.stringify(data), "utf-8");
    } catch (e) {
      log.warn("[FileController] Failed to write queue file:", e);
    }
  }

  private readQueueFile(): {
    items: Array<{ url: string; filename: string }>;
    doneCount: number;
    total: number;
    folder: string;
    timestamp: number;
  } | null {
    try {
      const p = this.getQueueFilePath();
      if (!fs.existsSync(p)) return null;
      const raw = fs.readFileSync(p, "utf-8");
      const data = JSON.parse(raw);
      if (!Array.isArray(data.items) || typeof data.doneCount !== "number") return null;
      return data;
    } catch {
      return null;
    }
  }

  private deleteQueueFile(): void {
    try {
      const p = this.getQueueFilePath();
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {
      log.warn("[FileController] Failed to delete queue file:", e);
    }
  }

  private getPendingDownload(): {
    hasPending: boolean;
    total: number;
    done: number;
    folder: string;
  } | null {
    const data = this.readQueueFile();
    if (!data || data.doneCount >= data.items.length) return null;
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAgeMs) {
      this.deleteQueueFile();
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
    const data = this.readQueueFile();
    if (!data || data.doneCount >= data.items.length) {
      this.deleteQueueFile();
      return { success: false, error: "No pending download" };
    }
    const remaining = data.items.slice(data.doneCount);
    this.deleteQueueFile();
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
   * Build full file path from root, structure template, and filename
   * Filename format: artistId_postId.ext - we extract artistId for {artist_id} structure
   */
  private getFilePath(
    root: string,
    filename: string,
    structure: "flat" | "{artist_id}"
  ): string {
    if (structure === "flat") {
      return path.join(root, filename);
    }
    const match = filename.match(/^(\d+)_/);
    const artistId = match ? match[1] : "unknown";
    const subdir = path.join(root, artistId);
    return path.join(subdir, filename);
  }

  /**
   * Get download root folder from settings (or default)
   */
  private getDownloadRoot(): string {
    try {
      const db = container.resolve(DI_TOKENS.DB);
      const row = db
        .select({ downloadFolder: settings.downloadFolder })
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .get();
      const folder = row?.downloadFolder?.trim();
      if (folder && fs.existsSync(folder)) {
        return folder;
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
      () => {
        this.deleteQueueFile();
        return Promise.resolve();
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
      defaultPath: this.getDownloadRoot(),
      properties: ["openDirectory"],
    });
    if (canceled || !filePaths?.length) return null;
    return filePaths[0] ?? null;
  }

  /**
   * Download multiple files with rate limiting and progress tracking
   * Uses concurrency limit and delay between requests to avoid bans (see docs/download-batch-risks.md)
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

    const folder = this.getDownloadRoot();
    const { duplicateFileBehavior, downloadFolderStructure } = this.getDownloadSettings();
    if (!fs.existsSync(folder)) {
      try {
        fs.mkdirSync(folder, { recursive: true });
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

    this.batchAbortController = new AbortController();
    this.batchPaused = false;
    let downloaded = 0;
    let failed = 0;

    this.writeQueueFile({
      items: validItems,
      doneCount: 0,
      total: validItems.length,
      folder,
      timestamp: Date.now(),
    });

    const updateQueueProgress = () => {
      this.writeQueueFile({
        items: validItems,
        doneCount: downloaded,
        total: validItems.length,
        folder,
        timestamp: Date.now(),
      });
    };

    const runOne = async (item: { url: string; filename: string }): Promise<void> => {
      if (this.batchAbortController?.signal.aborted) return;
      while (this.batchPaused && !this.batchAbortController?.signal.aborted) {
        await new Promise((r) => setTimeout(r, 200));
      }
      if (this.batchAbortController?.signal.aborted) return;

      const filePath = this.getFilePath(folder, item.filename, downloadFolderStructure);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch (e) {
          log.warn(`[FileController] Failed to create subdir ${dir}`, e);
          failed++;
          return;
        }
      }

      if (fs.existsSync(filePath) && duplicateFileBehavior === "skip") {
        downloaded++;
        updateQueueProgress();
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_ALL_PROGRESS, {
            id: item.filename,
            percent: 100,
            done: downloaded,
            total: validItems.length,
          });
        }
        return;
      }

      try {
        const response = await axios({
          method: "GET",
          url: item.url,
          responseType: "stream",
          signal: this.batchAbortController?.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          onDownloadProgress: (ev: AxiosProgressEvent) => {
            if (mainWindow.isDestroyed() || this.batchAbortController?.signal.aborted) return;
            if (ev.total) {
              const pct = Math.round((ev.loaded * 100) / ev.total);
              mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_ALL_PROGRESS, {
                id: item.filename,
                percent: pct,
                done: downloaded + (pct >= 100 ? 1 : 0),
                total: validItems.length,
              });
            }
          },
        });
        const writer = fs.createWriteStream(filePath);
        await pipeline(response.data, writer, {
          signal: this.batchAbortController?.signal,
        });
        downloaded++;
        updateQueueProgress();
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC_CHANNELS.FILES.DOWNLOAD_ALL_PROGRESS, {
            id: item.filename,
            percent: 100,
            done: downloaded,
            total: validItems.length,
          });
        }
      } catch (err) {
        if (this.batchAbortController?.signal.aborted) return;
        failed++;
        const isAborted =
          (err instanceof Error && err.name === "AbortError") ||
          (axios.isAxiosError(err) && err.code === "ERR_CANCELED");
        if (isAborted) return;
        log.warn(`[FileController] Batch download failed: ${item.filename}`, err);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
          /* ignore */
        }
      }
    };

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Process with concurrency limit and delay
    const queue = [...validItems];
    const workers: Promise<void>[] = [];
    for (let i = 0; i < BATCH_DOWNLOAD_CONCURRENCY; i++) {
      workers.push(
        (async () => {
          while (queue.length > 0 && !this.batchAbortController?.signal.aborted) {
            const item = queue.shift();
            if (!item) break;
            await runOne(item);
            await delay(BATCH_DOWNLOAD_DELAY_MS);
          }
        })()
      );
    }
    await Promise.all(workers);

    const canceled = this.batchAbortController?.signal.aborted ?? false;
    this.batchAbortController = null;

    if (!canceled && failed === 0) {
      this.deleteQueueFile();
    }

    return {
      success: failed === 0 && !canceled,
      downloaded,
      failed,
      canceled,
    };
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
      const defaultDir = this.getDownloadRoot();

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
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (unlinkError) {
            log.warn("[FileController] Failed to clean up partial file:", unlinkError);
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
      const downloadRoot = this.getDownloadRoot();
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
      let realPath: string;
      try {
        // Use realpathSync to resolve all symlinks and get canonical path
        realPath = fs.realpathSync(normalizedPath);
      } catch (error) {
        // Path doesn't exist or is inaccessible, fallback to download root
        log.warn(`[FileController] Failed to resolve real path: ${normalizedPath}`, error);
        if (fs.existsSync(downloadRoot)) {
          await shell.openPath(downloadRoot);
          return true;
        }
        return false;
      }

      // Security check: ensure real path (after symlink resolution) is still within safe directory
      const normalizedRealPath = path.normalize(realPath);
      if (!normalizedRealPath.startsWith(downloadRoot)) {
        log.error(
          `[FileController] SECURITY VIOLATION: Real path outside safe directory: ${normalizedRealPath} (original: ${normalizedPath})`
        );
        shell.openPath(downloadRoot);
        return false;
      }

      if (fs.existsSync(realPath)) {
        shell.showItemInFolder(realPath);
        return true;
      }

      if (fs.existsSync(downloadRoot)) {
        await shell.openPath(downloadRoot);
        return true;
      }

      return false;
    } catch (error) {
      log.error("[FileController] Failed to open folder:", error);
      return false;
    }
  }
}

