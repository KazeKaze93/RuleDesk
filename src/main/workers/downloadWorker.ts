/**
 * Download Worker Thread
 *
 * Runs batch downloads off the Main process to avoid blocking the UI.
 * Does NOT use electron-log — post structured failures to Main for logging/redaction.
 */
import { isMainThread, parentPort, workerData } from "worker_threads";
import path from "path";
import fs from "fs";
import { access, mkdir, unlink } from "fs/promises";
import axios, { type AxiosProgressEvent } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { pipeline } from "stream/promises";
import {
  BATCH_DOWNLOAD_CONCURRENCY,
  BATCH_DOWNLOAD_DELAY_MS,
  DOWNLOAD_429_BASE_DELAY_MS,
  DOWNLOAD_429_MAX_RETRIES,
  DOWNLOAD_CONNECT_TIMEOUT_MS,
  DOWNLOAD_IDLE_TIMEOUT_MS,
  USER_AGENT,
} from "../config/constants";
import type { DownloadFailure } from "@shared/types/download";
import {
  classifyDownloadFailure,
  isRetryableDownloadFailure,
  parseRetryAfterMs,
  unexpectedAbortFailure,
} from "@shared/utils/download-failure";
import {
  DOWNLOAD_URL_NOT_ALLOWED_MESSAGE,
  assertCdnUrlAllowedForRedirectOnHosts,
  isUrlAllowedOnCdnHosts,
} from "@shared/utils/cdn-url-allowlist";
import { DownloadRateLimitGate } from "./download-rate-limit-gate";

/** Percent scale / completion threshold for download progress posts. */
export const DOWNLOAD_PROGRESS_COMPLETE_PERCENT = 100;

/**
 * Whether to post an onDownloadProgress update for this item.
 * Dedupes unchanged rounded percents; always allows completion (>= 100).
 */
export function shouldPostDownloadProgress(
  percent: number,
  lastSentPercent: number | undefined
): boolean {
  return (
    lastSentPercent !== percent ||
    percent >= DOWNLOAD_PROGRESS_COMPLETE_PERCENT
  );
}

/**
 * How to treat a CANCELLED classification from `classifyDownloadFailure`.
 * User cancel must not enter `failed`; unexpected abort must be recorded.
 */
export function outcomeForCancelledDownload(
  aborted: boolean
): "user-cancel" | "unexpected-abort" {
  return aborted ? "user-cancel" : "unexpected-abort";
}

interface WorkerData {
  items: Array<{ url: string; filename: string }>;
  folder: string;
  duplicateFileBehavior: "skip" | "overwrite";
  downloadFolderStructure: "flat" | "{artist_id}";
  /** Kept for workerData shape / tests; Main owns the on-disk queue file. */
  queueFilePath: string;
  /** Proxy URL string; worker builds its own agent. */
  proxyUrl: string | null;
  /**
   * CDN hostnames computed by Main (`getAllowedCdnDomains`). Worker must not
   * import the provider registry / electron-log.
   */
  allowedCdnDomains: readonly string[];
  /**
   * Legacy flag. Worker never writes queue.json (Main uses writeFileAtomic).
   * Always treated as Main-owned ack path; `true` is ignored.
   */
  persistQueue?: boolean;
  /**
   * Test-only: skip CDN allowlist for the *initial* URL only (local HTTP loopback suites).
   * Redirect hops always run host checks regardless of this flag.
   * Production Main must never set this.
   */
  bypassCdnAllowlist?: boolean;
}

type WorkerOutboundMessage =
  | {
      type: "progress";
      id: string;
      percent: number;
      done: number;
      total: number;
    }
  | {
      type: "item-completed";
      id: string;
    }
  | {
      type: "item-failed";
      itemId: string;
      code: DownloadFailure["code"];
      httpStatus?: number;
      message: string;
      url: string;
    }
  | {
      type: "complete";
      success: boolean;
      downloaded: number;
      failed: DownloadFailure[];
      canceled: boolean;
      /**
       * Items that ended as user-cancel (in-flight abort returns + leftover
       * queue items never started). Not present in `failed` or `completedIds`.
       * Main can verify: downloaded + failed.length + canceledCount === items.length.
       */
      canceledCount: number;
      completedIds: string[];
    }
  | { type: "error"; error: string };

function getFilePath(
  root: string,
  filename: string,
  structure: "flat" | "{artist_id}"
): string {
  const resolvedRoot = path.resolve(root);
  let fullPath: string;
  if (structure === "flat") {
    fullPath = path.resolve(root, filename);
  } else {
    const match = filename.match(/^(\d+)_/);
    const artistId = match ? match[1] : "unknown";
    fullPath = path.resolve(root, artistId, filename);
  }
  const relative = path.relative(resolvedRoot, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path traversal attempted");
  }
  return fullPath;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function unlinkIfExists(filePath: string): Promise<void> {
  try {
    await access(filePath);
    await unlink(filePath);
  } catch {
    /* ignore */
  }
}

async function runWorker(): Promise<void> {
  const {
    items,
    folder,
    duplicateFileBehavior,
    downloadFolderStructure,
    proxyUrl,
    allowedCdnDomains,
    bypassCdnAllowlist = false,
  // boundary: worker message — workerData payload after trust/Zod
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: worker message
  } = workerData as WorkerData;

  const allowedCdnHosts = new Set(allowedCdnDomains);
  let aborted = false;
  let paused = false;
  const activeControllers = new Set<AbortController>();
  const rateLimitGate = new DownloadRateLimitGate();
  const attemptsByFilename = new Map<string, number>();
  const httpsAgent =
    proxyUrl !== null && proxyUrl.length > 0
      ? new HttpsProxyAgent(proxyUrl)
      : undefined;

  type PersistAck = {
    resolve: () => void;
    reject: (error: Error) => void;
  };
  const persistAcks = new Map<string, PersistAck>();

  parentPort?.on(
    "message",
    (msg: {
      type: string;
      id?: string;
      code?: string;
      message?: string;
    }) => {
      if (msg.type === "cancel") {
        aborted = true;
        for (const controller of activeControllers) {
          controller.abort();
        }
        for (const ack of persistAcks.values()) {
          ack.resolve();
        }
        persistAcks.clear();
      }
      if (msg.type === "pause") paused = true;
      if (msg.type === "resume") paused = false;
      if (msg.type === "item-persisted" && typeof msg.id === "string") {
        const ack = persistAcks.get(msg.id);
        if (ack) {
          persistAcks.delete(msg.id);
          ack.resolve();
        }
      }
      if (msg.type === "item-persist-failed" && typeof msg.id === "string") {
        const ack = persistAcks.get(msg.id);
        if (ack) {
          persistAcks.delete(msg.id);
          const reason =
            typeof msg.message === "string" && msg.message.length > 0
              ? msg.message
              : "Queue persist failed";
          ack.reject(new Error(reason));
        }
      }
    }
  );

  const post = (m: WorkerOutboundMessage) => parentPort?.postMessage(m);

  let downloaded = 0;
  const failed: DownloadFailure[] = [];
  const completedIds: string[] = [];
  /** Filenames that exited runOne as user-cancel (not failed, not completed). */
  const userCanceledIds = new Set<string>();

  const ITEM_PERSIST_ACK_TIMEOUT_MS = 10_000;

  const noteUserCanceled = (item: { filename: string }): void => {
    userCanceledIds.add(item.filename);
  };

  const markCompleted = async (
    item: { url: string; filename: string }
  ): Promise<boolean> => {
    const filename = item.filename;
    // File is already on disk. Notify Main, then wait for queue ack (Main owns persistence).
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          persistAcks.delete(filename);
          reject(
            new Error(
              `Queue persist ack timed out after ${ITEM_PERSIST_ACK_TIMEOUT_MS}ms`
            )
          );
        }, ITEM_PERSIST_ACK_TIMEOUT_MS);
        persistAcks.set(filename, {
          resolve: () => {
            clearTimeout(timer);
            resolve();
          },
          reject: (error: Error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
        post({ type: "item-completed", id: filename });
      });
      completedIds.push(filename);
      downloaded++;
      return true;
    } catch (error: unknown) {
      if (aborted) {
        return false;
      }
      const classified = classifyDownloadFailure(error);
      recordFailure(item, {
        code: "DISK",
        message: classified.message || "Queue persist failed",
      });
      return false;
    }
  };

  const recordFailure = (
    item: { url: string; filename: string },
    classified: ReturnType<typeof classifyDownloadFailure>
  ) => {
    const entry: DownloadFailure = {
      itemId: item.filename,
      code: classified.code,
      message: classified.message,
    };
    if (classified.httpStatus !== undefined) {
      entry.httpStatus = classified.httpStatus;
    }
    failed.push(entry);
    post({
      type: "item-failed",
      itemId: entry.itemId,
      code: entry.code,
      httpStatus: entry.httpStatus,
      message: entry.message,
      url: item.url,
    });
  };

  const runOne = async (item: { url: string; filename: string }): Promise<void> => {
    if (aborted) {
      noteUserCanceled(item);
      return;
    }
    while (paused && !aborted) {
      await delay(200);
    }
    if (aborted) {
      noteUserCanceled(item);
      return;
    }

    /** Last progress percent posted for this item (local to this download). */
    let lastSentPercent: number | undefined;

    const filePath = getFilePath(folder, item.filename, downloadFolderStructure);
    const dir = path.dirname(filePath);
    try {
      await access(dir);
    } catch {
      try {
        await mkdir(dir, { recursive: true });
      } catch (err) {
        if (aborted) {
          noteUserCanceled(item);
          return;
        }
        recordFailure(item, classifyDownloadFailure(err));
        return;
      }
    }

    let fileExists = false;
    try {
      await access(filePath);
      fileExists = true;
    } catch {
      /* file doesn't exist */
    }
    if (fileExists && duplicateFileBehavior === "skip") {
      const completed = await markCompleted(item);
      if (!completed) {
        if (aborted) {
          noteUserCanceled(item);
        }
        return;
      }
      lastSentPercent = DOWNLOAD_PROGRESS_COMPLETE_PERCENT;
      post({
        type: "progress",
        id: item.filename,
        percent: DOWNLOAD_PROGRESS_COMPLETE_PERCENT,
        done: completedIds.length,
        total: items.length,
      });
      return;
    }

    if (
      !bypassCdnAllowlist &&
      !isUrlAllowedOnCdnHosts(item.url, allowedCdnHosts)
    ) {
      recordFailure(item, {
        code: "NETWORK",
        message: DOWNLOAD_URL_NOT_ALLOWED_MESSAGE,
      });
      return;
    }

    while (!aborted) {
      const abortController = new AbortController();
      activeControllers.add(abortController);
      let idleTimedOut = false;
      let idleTimer: ReturnType<typeof setTimeout> | undefined;

      const clearIdleTimer = () => {
        if (idleTimer !== undefined) {
          clearTimeout(idleTimer);
          idleTimer = undefined;
        }
      };

      const armIdleTimer = () => {
        clearIdleTimer();
        idleTimer = setTimeout(() => {
          idleTimedOut = true;
          abortController.abort();
        }, DOWNLOAD_IDLE_TIMEOUT_MS);
      };

      try {
        armIdleTimer();
        const response = await axios({
          method: "GET",
          url: item.url,
          responseType: "stream",
          signal: abortController.signal,
          timeout: DOWNLOAD_CONNECT_TIMEOUT_MS,
          httpsAgent,
          headers: {
            "User-Agent": USER_AGENT,
          },
          // Always enforce CDN allowlist on redirect hops (ignore bypassCdnAllowlist).
          beforeRedirect: (options) => {
            assertCdnUrlAllowedForRedirectOnHosts(options, allowedCdnHosts);
          },
          onDownloadProgress: (ev: AxiosProgressEvent) => {
            if (aborted) {
              abortController.abort();
              return;
            }
            armIdleTimer();
            if (ev.total) {
              const pct = Math.round(
                (ev.loaded * DOWNLOAD_PROGRESS_COMPLETE_PERCENT) / ev.total
              );
              if (!shouldPostDownloadProgress(pct, lastSentPercent)) {
                return;
              }
              lastSentPercent = pct;
              post({
                type: "progress",
                id: item.filename,
                percent: pct,
                done:
                  completedIds.length +
                  (pct >= DOWNLOAD_PROGRESS_COMPLETE_PERCENT ? 1 : 0),
                total: items.length,
              });
            }
          },
        });
        const writer = fs.createWriteStream(filePath);
        abortController.signal.addEventListener(
          "abort",
          () => {
            if (!writer.destroyed) {
              writer.destroy();
            }
          },
          { once: true }
        );
        await pipeline(response.data, writer, {
          signal: abortController.signal,
        });
        clearIdleTimer();
        const completed = await markCompleted(item);
        if (!completed) {
          if (aborted) {
            noteUserCanceled(item);
          }
          return;
        }
        lastSentPercent = DOWNLOAD_PROGRESS_COMPLETE_PERCENT;
        post({
          type: "progress",
          id: item.filename,
          percent: DOWNLOAD_PROGRESS_COMPLETE_PERCENT,
          done: completedIds.length,
          total: items.length,
        });
        return;
      } catch (err) {
        clearIdleTimer();
        await unlinkIfExists(filePath);

        if (aborted && !idleTimedOut) {
          noteUserCanceled(item);
          return;
        }

        const classified = classifyDownloadFailure(err, {
          aborted: aborted && !idleTimedOut,
          idleTimedOut,
        });

        if (isRetryableDownloadFailure(classified.code)) {
          const nextAttempt = (attemptsByFilename.get(item.filename) ?? 0) + 1;
          attemptsByFilename.set(item.filename, nextAttempt);
          // Global pause: other lanes will not take new queue items until open.
          rateLimitGate.schedulePause({
            baseDelayMs: DOWNLOAD_429_BASE_DELAY_MS,
            retryAfterMs: parseRetryAfterMs(err),
          });
          if (nextAttempt <= DOWNLOAD_429_MAX_RETRIES) {
            await rateLimitGate.waitUntilOpen(() => aborted, delay);
            continue;
          }
          recordFailure(item, classified);
          return;
        }

        if (classified.code === "CANCELLED") {
          if (outcomeForCancelledDownload(aborted) === "user-cancel") {
            noteUserCanceled(item);
            return;
          }
          recordFailure(item, unexpectedAbortFailure(classified, err));
          return;
        }
        recordFailure(item, classified);
        return;
      } finally {
        clearIdleTimer();
        activeControllers.delete(abortController);
      }
    }

    // Exited the download loop because `aborted` flipped (e.g. during 429 wait).
    if (aborted) {
      noteUserCanceled(item);
    }
  };

  const queue = [...items];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < BATCH_DOWNLOAD_CONCURRENCY; i++) {
    workers.push(
      (async () => {
        while (!aborted) {
          // Do not start new downloads while the global 429 gate is closed.
          await rateLimitGate.waitUntilOpen(() => aborted, delay);
          if (aborted) break;
          while (paused && !aborted) {
            await delay(200);
          }
          if (aborted) break;
          const item = queue.shift();
          if (!item) break;
          await runOne(item);
          if (!aborted) {
            await delay(BATCH_DOWNLOAD_DELAY_MS);
          }
        }
      })()
    );
  }
  await Promise.all(workers);

  const canceled = aborted;
  // Never-started leftovers still in the queue count as user-cancel for accounting.
  const canceledCount = userCanceledIds.size + (canceled ? queue.length : 0);
  post({
    type: "complete",
    success: failed.length === 0 && !canceled,
    downloaded,
    failed,
    canceled,
    canceledCount,
    completedIds: [...completedIds],
  });
}

// Skip auto-start when imported from unit tests (main thread).
if (!isMainThread) {
  runWorker().catch((err: unknown) => {
    parentPort?.postMessage({
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  });
}
