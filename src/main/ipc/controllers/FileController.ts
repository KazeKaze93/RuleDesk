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
import { getProxyAgent, getProxyUrl } from "../../lib/proxy";
import {
  DOWNLOAD_SHUTDOWN_DRAIN_MS,
  USER_AGENT,
} from "../../config/constants";
import { waitForAtomicWriteIdle } from "../../lib/atomic-write";
import {
  artistQueueInitial,
  listQueueInitial,
  parseDownloadQueueFile,
  writeDownloadQueueAtomic,
} from "../../lib/download-queue-file";
import {
  advanceArtistCursor,
  applyArtistItemCompleted,
  planArtistChunk,
  shouldAdvanceArtistCursorAfterChunk,
} from "../../lib/mass-download-artist-state";
import type { PostsController } from "./PostsController";
import {
  buildListOverLimitResult,
  isListOverLimit,
} from "../../../shared/utils/download-list-limit";

/** Allows quit-smoke to force a short cancel drain (milliseconds). */
function resolveDownloadShutdownDrainMs(): number {
  const raw = process.env.RULEDESK_DOWNLOAD_DRAIN_MS;
  if (raw === undefined || raw === "") {
    return DOWNLOAD_SHUTDOWN_DRAIN_MS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DOWNLOAD_SHUTDOWN_DRAIN_MS;
  }
  return parsed;
}
import { IPC_CHANNELS } from "../channels";
import { isResolvedPathWithinBase } from "../../utils/path-within-base";
import { BATCH_DOWNLOAD_CHUNK_SIZE } from "../../../shared/constants";
import { isErrnoException } from "../../../shared/utils/type-guards";
import {
  DownloadAllRequestSchema,
  type DownloadAllRequest,
} from "../../../shared/schemas/download";
import type {
  DownloadAllResult,
  DownloadFailure,
  DownloadQueueFileV3,
  DownloadQueueFileV3Artist,
  DownloadQueueFileV3List,
  DownloadQueueItem,
} from "../../../shared/types/download";
import { remainingDownloadItems } from "../../../shared/utils/download-failure";

const DEFAULT_DOWNLOAD_ROOT = path.join(app.getPath("downloads"), "BooruClient");
const DOWNLOAD_QUEUE_FILE = "download-queue.json";
const DOWNLOAD_QUEUE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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

const DownloadFileArgsSchema = z.tuple([
  DownloadFileSchema.shape.url,
  DownloadFileSchema.shape.filename,
]);
const OpenFolderArgSchema = OpenFolderSchema;
const EmptyArgsSchema = z.tuple([]);
const DownloadAllArgsSchema = z.tuple([DownloadAllRequestSchema]);

const DownloadFailureSchema = z.object({
  itemId: z.string().min(1),
  code: z.enum([
    "NETWORK",
    "TIMEOUT",
    "HTTP_403",
    "HTTP_404",
    "HTTP_429",
    "HTTP_OTHER",
    "DISK",
    "CANCELLED",
  ]),
  httpStatus: z.number().int().optional(),
  message: z.string(),
});

/**
 * File Controller
 *
 * Handles file-related IPC operations:
 * - Downloading files with progress tracking
 * - Opening folders in file manager
 */
// Query style: Drizzle Builder API only in this controller.
export class FileController extends BaseController {
  private mainWindow: BrowserWindowType | null = null;
  private totalBytes = 0;
  private activeDownloads = new Map<string, AbortController>();
  private downloadWorker: Worker | null = null;
  private batchIdleWaiters: Array<() => void> = [];
  private batchFinish: ((result: DownloadAllResult) => void) | null = null;
  private postsController: PostsController | null = null;
  /** True while artist/list mass-download orchestration is running (incl. between chunks). */
  private massDownloadActive = false;
  private massDownloadCancelRequested = false;

  public setPostsController(postsController: PostsController): void {
    this.postsController = postsController;
  }

  /**
   * Set main window reference (needed for download dialogs and progress events)
   *
   * @param window - Main browser window instance
   */
  public setMainWindow(window: BrowserWindowType): void {
    this.mainWindow = window;

    window.once("closed", () => {
      void this.cancelAllDownloads();
    });
  }

  public hasActiveDownloads(): boolean {
    return (
      this.massDownloadActive ||
      this.downloadWorker !== null ||
      this.activeDownloads.size > 0
    );
  }

  /**
   * UI/IPC cancel entry — delegates to the sole cancel mechanism.
   */
  public cancelDownloadAll(): boolean {
    const hadActive = this.hasActiveDownloads();
    if (hadActive) {
      log.info("[FileController] Batch download cancel requested");
      void this.cancelAllDownloads();
    }
    return hadActive;
  }

  /**
   * Sole public cancel entry: aborts single-file downloads and the batch worker,
   * then waits until the worker settles (or drain timeout).
   */
  public async cancelAllDownloads(): Promise<{ timedOut: boolean }> {
    log.info(
      `[FileController] Canceling ${this.activeDownloads.size} single + batch downloads`
    );
    this.massDownloadCancelRequested = true;
    for (const [filename, controller] of this.activeDownloads.entries()) {
      controller.abort();
      log.debug(`[FileController] Canceled download: ${filename}`);
    }
    this.activeDownloads.clear();

    if (!this.downloadWorker) {
      await waitForAtomicWriteIdle(this.getQueueFilePath());
      this.resolveBatchIdleWaiters();
      return { timedOut: false };
    }

    this.downloadWorker.postMessage({ type: "cancel" });
    const worker = this.downloadWorker;
    const drainMs = resolveDownloadShutdownDrainMs();
    let timedOut = false;
    await Promise.race([
      new Promise<void>((resolve) => {
        this.batchIdleWaiters.push(resolve);
      }),
      new Promise<void>((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve();
        }, drainMs);
      }),
    ]);

    if (this.downloadWorker === worker) {
      this.settleBatch({
        success: false,
        downloaded: 0,
        failed: [],
        canceled: true,
      });
      try {
        await worker.terminate();
      } catch {
        /* ignore */
      }
      this.downloadWorker = null;
    }
    // Final queue rename must finish before before-quit closes userData.
    await waitForAtomicWriteIdle(this.getQueueFilePath());
    this.resolveBatchIdleWaiters();
    if (timedOut) {
      log.warn(
        `[FileController] cancelAllDownloads timed out after ${drainMs}ms`
      );
    }
    return { timedOut };
  }

  private settleBatch(result: DownloadAllResult): void {
    if (!this.batchFinish) {
      return;
    }
    const finish = this.batchFinish;
    this.batchFinish = null;
    this.downloadWorker = null;
    this.resolveBatchIdleWaiters();
    finish(result);
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

  private resolveBatchIdleWaiters(): void {
    const waiters = this.batchIdleWaiters;
    this.batchIdleWaiters = [];
    for (const resolve of waiters) {
      resolve();
    }
  }

  private getQueueFilePath(): string {
    return path.join(app.getPath("userData"), DOWNLOAD_QUEUE_FILE);
  }

  private async readQueueFile(): Promise<DownloadQueueFileV3 | null> {
    try {
      const p = this.getQueueFilePath();
      await access(p);
      const raw = await readFile(p, "utf-8");
      const data: unknown = JSON.parse(raw);
      const parsed = parseDownloadQueueFile(data);
      if (!parsed) {
        log.warn("[FileController] Discarding unreadable download queue file");
        return null;
      }
      if (parsed.format === "v2-as-list") {
        log.info("[FileController] Migrated V2 download queue to V3 list");
      }
      return parsed.data;
    } catch (error: unknown) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        return null;
      }
      log.warn("[FileController] Failed to read download queue:", error);
      return null;
    }
  }

  private async writeQueueFile(data: DownloadQueueFileV3): Promise<void> {
    await writeDownloadQueueAtomic(this.getQueueFilePath(), data);
    this.notifyPendingDownloadStateChanged();
  }

  private async deleteQueueFile(): Promise<void> {
    try {
      const p = this.getQueueFilePath();
      await access(p);
      await unlink(p);
      this.notifyPendingDownloadStateChanged();
    } catch (e) {
      if (isErrnoException(e) && e.code !== "ENOENT") {
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

  private queueHasRemaining(data: DownloadQueueFileV3): boolean {
    if (data.kind === "list") {
      return remainingDownloadItems(data.items, data.completedIds).length > 0;
    }
    return data.doneCount < data.total || data.cursorId < data.upperBoundId;
  }

  private async getPendingDownload(): Promise<{
    hasPending: boolean;
    total: number;
    done: number;
    folder: string;
  } | null> {
    const data = await this.readQueueFile();
    if (!data) {
      return null;
    }
    if (!this.queueHasRemaining(data)) {
      return null;
    }
    if (Date.now() - data.timestamp > DOWNLOAD_QUEUE_MAX_AGE_MS) {
      await this.deleteQueueFile();
      return null;
    }
    const done =
      data.kind === "list" ? data.completedIds.length : data.doneCount;
    return {
      hasPending: true,
      total: data.total,
      done,
      folder: data.folder,
    };
  }

  private async resumePendingDownload(
    _event: IpcMainInvokeEvent
  ): Promise<DownloadAllResult> {
    const data = await this.readQueueFile();
    if (!data || !this.queueHasRemaining(data)) {
      await this.deleteQueueFile();
      return {
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: "No pending download",
      };
    }
    if (data.kind === "artist") {
      return this.downloadAllArtistFromQueue(data);
    }
    const remaining = remainingDownloadItems(data.items, data.completedIds);
    return this.downloadAllList(remaining, {
      resumeFrom: data,
    });
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
          z.enum(["skip", "overwrite"]).safeParse(row?.duplicateFileBehavior).data ?? "skip",
        downloadFolderStructure:
          z.enum(["flat", "{artist_id}"]).safeParse(row?.downloadFolderStructure).data ?? "flat",
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
      DownloadFileArgsSchema,
      (event, ...args) => {
        const [url, filename] = DownloadFileArgsSchema.parse(args);
        return this.downloadFile(event, url, filename);
      }
    );
    this.handle(
      IPC_CHANNELS.FILES.OPEN_FOLDER,
      OpenFolderArgSchema, // Single argument schema
      (event, filePathOrName) =>
        this.openFolder(event, OpenFolderArgSchema.parse(filePathOrName))
    );
    this.handle(
      IPC_CHANNELS.FILES.SELECT_DOWNLOAD_FOLDER,
      EmptyArgsSchema,
      (event, ...args) => {
        EmptyArgsSchema.parse(args);
        return this.selectDownloadFolder(event);
      }
    );
    this.handle(
      IPC_CHANNELS.FILES.DOWNLOAD_ALL,
      DownloadAllArgsSchema,
      (_event, ...args) => {
        const [request] = DownloadAllArgsSchema.parse(args);
        return this.downloadAll(request);
      }
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
      EmptyArgsSchema,
      (event, ...args) => {
        EmptyArgsSchema.parse(args);
        return this.resumePendingDownload(event);
      }
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
   * Start a list mass download without an IPC event (quit-smoke / tests).
   */
  public runDownloadAll(items: DownloadQueueItem[]): Promise<DownloadAllResult> {
    return this.downloadAll({ kind: "list", items });
  }

  private async downloadAll(
    request: DownloadAllRequest
  ): Promise<DownloadAllResult> {
    // Length cap before Zod so oversize never becomes an IPC ValidationError.
    if (
      request.kind === "list" &&
      Array.isArray(request.items) &&
      isListOverLimit(request.items.length)
    ) {
      return buildListOverLimitResult(request.items.length);
    }

    const parsed = DownloadAllRequestSchema.safeParse(request);
    if (!parsed.success) {
      log.error("[FileController] DownloadAll validation failed", parsed.error);
      return {
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: "Invalid download request",
      };
    }

    if (this.massDownloadActive || this.downloadWorker) {
      return {
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: "A mass download is already in progress",
      };
    }

    if (parsed.data.kind === "artist") {
      return this.downloadAllArtist(parsed.data.artistId, parsed.data.filters);
    }
    return this.downloadAllList(parsed.data.items, {});
  }

  private async ensureDownloadFolder(): Promise<
    { ok: true; folder: string } | { ok: false; error: string }
  > {
    const folder = await this.getDownloadRoot();
    try {
      await access(folder);
    } catch {
      try {
        await mkdir(folder, { recursive: true });
      } catch (e) {
        log.error("[FileController] Failed to create download directory", e);
        return { ok: false, error: "Failed to create download directory" };
      }
    }
    return { ok: true, folder };
  }

  private async downloadAllArtist(
    artistId: number,
    filters: DownloadQueueFileV3Artist["filters"]
  ): Promise<DownloadAllResult> {
    const posts = this.postsController;
    if (!posts) {
      return {
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: "Posts controller not bound",
      };
    }
    const folderResult = await this.ensureDownloadFolder();
    if (!folderResult.ok) {
      return {
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: folderResult.error,
      };
    }
    const snapshot = posts.snapshotArtistMassDownload(artistId, filters);
    if (snapshot.total === 0 || snapshot.upperBoundId === 0) {
      return { success: true, downloaded: 0, failed: [], canceled: false };
    }
    const state = artistQueueInitial({
      artistId,
      filters,
      upperBoundId: snapshot.upperBoundId,
      total: snapshot.total,
      folder: folderResult.folder,
    });
    await this.writeQueueFile(state);
    return this.downloadAllArtistFromQueue(state);
  }

  private async downloadAllArtistFromQueue(
    initial: DownloadQueueFileV3Artist
  ): Promise<DownloadAllResult> {
    const posts = this.postsController;
    const mainWindow = this.getMainWindow();
    if (!posts || !mainWindow) {
      return {
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: !posts
          ? "Posts controller not bound"
          : "Main window not available",
      };
    }

    this.massDownloadActive = true;
    this.massDownloadCancelRequested = false;
    let state: DownloadQueueFileV3Artist = { ...initial };
    let downloaded = 0;
    const failed: DownloadFailure[] = [];
    let canceled = false;

    try {
      while (!this.massDownloadCancelRequested) {
        const chunk = posts.fetchArtistMassDownloadChunk({
          artistId: state.artistId,
          filters: state.filters,
          cursorId: state.cursorId,
          upperBoundId: state.upperBoundId,
          limit: BATCH_DOWNLOAD_CHUNK_SIZE,
        });
        if (chunk.length === 0) {
          break;
        }

        const plan = planArtistChunk(state, chunk);
        if (!plan) {
          break;
        }

        if (plan.type === "advance") {
          // Crash window: all items recorded, cursor not yet written — resume lands here.
          state = plan.state;
          await this.writeQueueFile(state);
          continue;
        }

        const chunkResult = await this.runWorkerBatch({
          items: plan.remaining,
          folder: state.folder,
          progressDoneBase: state.doneCount,
          progressTotal: state.total,
          persistQueue: false,
          onItemCompleted: async (filename) => {
            const next = applyArtistItemCompleted(state, filename);
            await this.writeQueueFile(next);
            state = next;
          },
        });

        downloaded += chunkResult.downloaded;
        failed.push(...chunkResult.failed);
        if (!shouldAdvanceArtistCursorAfterChunk(chunkResult.canceled)) {
          canceled = true;
          break;
        }

        const lastId = chunk[chunk.length - 1]?.id;
        if (lastId === undefined) {
          break;
        }
        // Advance even when the chunk had permanent failures (404) so the walk
        // continues; a later full run (new queue) retries failed filenames.
        state = advanceArtistCursor(state, lastId);
        await this.writeQueueFile(state);
      }

      if (this.massDownloadCancelRequested) {
        canceled = true;
      }

      if (!canceled && failed.length === 0) {
        await this.deleteQueueFile();
      } else {
        await this.writeQueueFile(state);
      }

      return {
        success: failed.length === 0 && !canceled,
        downloaded,
        failed,
        canceled,
      };
    } finally {
      this.massDownloadActive = false;
      this.massDownloadCancelRequested = false;
      this.notifyPendingDownloadStateChanged();
    }
  }

  private async downloadAllList(
    items: DownloadQueueItem[],
    options: { resumeFrom?: DownloadQueueFileV3List }
  ): Promise<DownloadAllResult> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      return {
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: "Main window not available",
      };
    }
    if (items.length === 0) {
      await this.deleteQueueFile();
      return { success: true, downloaded: 0, failed: [], canceled: false };
    }
    if (isListOverLimit(items.length)) {
      return buildListOverLimitResult(items.length);
    }

    const folderResult = await this.ensureDownloadFolder();
    if (!folderResult.ok) {
      return {
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: folderResult.error,
      };
    }

    let state: DownloadQueueFileV3List =
      options.resumeFrom ??
      listQueueInitial({ items, folder: folderResult.folder });
    if (!options.resumeFrom) {
      await this.writeQueueFile(state);
    }

    this.massDownloadActive = true;
    this.massDownloadCancelRequested = false;
    try {
      const result = await this.runWorkerBatch({
        items,
        folder: state.folder,
        progressDoneBase: state.completedIds.length,
        progressTotal: state.total,
        persistQueue: false,
        onItemCompleted: async (filename) => {
          if (state.completedIds.includes(filename)) {
            return;
          }
          const next: DownloadQueueFileV3List = {
            ...state,
            completedIds: [...state.completedIds, filename],
            timestamp: Date.now(),
          };
          await this.writeQueueFile(next);
          state = next;
        },
      });

      if (
        !result.canceled &&
        result.failed.length === 0 &&
        !this.massDownloadCancelRequested
      ) {
        await this.deleteQueueFile();
      } else {
        await this.writeQueueFile(state);
      }

      return {
        success:
          result.failed.length === 0 &&
          !result.canceled &&
          !this.massDownloadCancelRequested,
        downloaded: result.downloaded,
        failed: result.failed,
        canceled: result.canceled || this.massDownloadCancelRequested,
      };
    } finally {
      this.massDownloadActive = false;
      this.massDownloadCancelRequested = false;
      this.notifyPendingDownloadStateChanged();
    }
  }

  /**
   * Run one worker batch. Progress `done` is remapped with progressDoneBase.
   * Queue persistence is owned by the caller via onItemCompleted.
   */
  private runWorkerBatch(params: {
    items: DownloadQueueItem[];
    folder: string;
    progressDoneBase: number;
    progressTotal: number;
    persistQueue: boolean;
    onItemCompleted?: (filename: string) => void | Promise<void>;
  }): Promise<DownloadAllResult> {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      return Promise.resolve({
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: "Main window not available",
      });
    }
    if (params.items.length === 0) {
      return Promise.resolve({
        success: true,
        downloaded: 0,
        failed: [],
        canceled: false,
      });
    }

    const { duplicateFileBehavior, downloadFolderStructure } =
      this.getDownloadSettings();
    const workerPath = path.join(__dirname, "workers", "downloadWorker.cjs");
    const proxyUrl = getProxyUrl();

    return new Promise((resolve) => {
      this.batchFinish = resolve;

      const failSetup = (error: string) =>
        this.settleBatch({
          success: false,
          downloaded: 0,
          failed: [],
          canceled: false,
          error,
        });

      try {
        const worker = new Worker(workerPath, {
          workerData: {
            items: params.items,
            folder: params.folder,
            duplicateFileBehavior,
            downloadFolderStructure,
            queueFilePath: this.getQueueFilePath(),
            proxyUrl,
            persistQueue: params.persistQueue,
          },
        });
        this.downloadWorker = worker;

        worker.on(
          "message",
          (msg: {
            type: string;
            id?: string;
            percent?: number;
            done?: number;
            total?: number;
            success?: boolean;
            downloaded?: number;
            failed?: unknown;
            canceled?: boolean;
            error?: string;
            itemId?: string;
            code?: string;
            httpStatus?: number;
            message?: string;
            url?: string;
          }) => {
            if (msg.type === "item-completed" && msg.id) {
              const completedId = msg.id;
              void (async () => {
                try {
                  await params.onItemCompleted?.(completedId);
                  if (this.downloadWorker === worker) {
                    worker.postMessage({
                      type: "item-persisted",
                      id: completedId,
                    });
                  }
                } catch (error: unknown) {
                  const message =
                    error instanceof Error ? error.message : String(error);
                  log.error(
                    "[FileController] Failed to persist queue after item:",
                    error
                  );
                  if (this.downloadWorker === worker) {
                    worker.postMessage({
                      type: "item-persist-failed",
                      id: completedId,
                      code: "DISK",
                      message,
                    });
                  }
                }
              })();
            }

            if (msg.type === "progress" && !mainWindow.isDestroyed()) {
              const chunkDone = msg.done ?? 0;
              mainWindow.webContents.send(
                IPC_CHANNELS.FILES.DOWNLOAD_ALL_PROGRESS,
                {
                  id: msg.id,
                  percent: msg.percent ?? 0,
                  done: params.progressDoneBase + chunkDone,
                  total: params.progressTotal,
                }
              );
              return;
            }

            if (msg.type === "item-failed") {
              const parsed = DownloadFailureSchema.safeParse({
                itemId: msg.itemId,
                code: msg.code,
                httpStatus: msg.httpStatus,
                message: msg.message ?? "",
              });
              if (parsed.success) {
                log.error("[FileController] Mass download item failed", {
                  itemId: parsed.data.itemId,
                  code: parsed.data.code,
                  httpStatus: parsed.data.httpStatus,
                  message: parsed.data.message,
                  url: msg.url,
                });
              } else {
                log.error(
                  "[FileController] Mass download item failed (unparsed)",
                  msg
                );
              }
              return;
            }

            if (msg.type === "complete") {
              const failedParse = z
                .array(DownloadFailureSchema)
                .safeParse(msg.failed ?? []);
              const failed: DownloadFailure[] = failedParse.success
                ? failedParse.data
                : [];
              this.settleBatch({
                success: msg.success ?? false,
                downloaded: msg.downloaded ?? 0,
                failed,
                canceled: msg.canceled ?? false,
              });
              return;
            }

            if (msg.type === "error") {
              failSetup(msg.error ?? "Worker error");
            }
          }
        );

        worker.on("error", (err) => {
          log.error("[FileController] Download worker error:", err);
          failSetup(err.message);
        });

        worker.on("exit", (code) => {
          if (code !== 0 && this.batchFinish !== null) {
            failSetup(`Worker exited with code ${code}`);
          }
        });
      } catch (err) {
        this.downloadWorker = null;
        log.error("[FileController] Failed to spawn download worker:", err);
        failSetup(err instanceof Error ? err.message : String(err));
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
          httpsAgent: getProxyAgent(),
          headers: {
            "User-Agent": USER_AGENT,
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
            if (isErrnoException(unlinkError) && unlinkError.code !== "ENOENT") {
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
      const resolvedRoot = path.resolve(downloadRoot);
      let fullPath = filePathOrName;

      if (!path.isAbsolute(filePathOrName)) {
        fullPath = path.join(downloadRoot, filePathOrName);
      }

      const normalizedPath = path.normalize(fullPath);

      // Security check: ensure path is within safe directory (before resolving symlinks)
      if (!isResolvedPathWithinBase(normalizedPath, resolvedRoot)) {
        log.error(
          `[FileController] SECURITY VIOLATION: Attempt to open path outside safe directory: ${normalizedPath}`
        );
        void shell.openPath(downloadRoot).catch((error: unknown) => {
          log.error("[FileController] Failed to open download root:", error);
        });
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
      if (!isResolvedPathWithinBase(normalizedRealPath, resolvedRoot)) {
        log.error(
          `[FileController] SECURITY VIOLATION: Real path outside safe directory: ${normalizedRealPath} (original: ${normalizedPath})`
        );
        void shell.openPath(downloadRoot).catch((error: unknown) => {
          log.error("[FileController] Failed to open download root:", error);
        });
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

