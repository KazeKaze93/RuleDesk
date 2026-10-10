/**
 * Download Worker Thread
 *
 * Runs batch downloads off the Main process to avoid blocking the UI.
 * Does NOT use electron-log — post structured failures to Main for logging/redaction.
 */
import { parentPort, workerData } from "worker_threads";
import path from "path";
import fs from "fs";
import { access, mkdir, unlink, writeFile } from "fs/promises";
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
} from "@shared/utils/download-failure";
import { DownloadRateLimitGate } from "./download-rate-limit-gate";

interface WorkerData {
  items: Array<{ url: string; filename: string }>;
  folder: string;
  duplicateFileBehavior: "skip" | "overwrite";
  downloadFolderStructure: "flat" | "{artist_id}";
  queueFilePath: string;
  /** Proxy URL string; worker builds its own agent. */
  proxyUrl: string | null;
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
    queueFilePath,
    proxyUrl,
  // boundary: worker message — workerData payload after trust/Zod
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: worker message
  } = workerData as WorkerData;

  let aborted = false;
  let paused = false;
  const activeControllers = new Set<AbortController>();
  const rateLimitGate = new DownloadRateLimitGate();
  const attemptsByFilename = new Map<string, number>();
  const httpsAgent =
    proxyUrl !== null && proxyUrl.length > 0
      ? new HttpsProxyAgent(proxyUrl)
      : undefined;

  parentPort?.on("message", (msg: { type: string }) => {
    if (msg.type === "cancel") {
      aborted = true;
      for (const controller of activeControllers) {
        controller.abort();
      }
    }
    if (msg.type === "pause") paused = true;
    if (msg.type === "resume") paused = false;
  });

  const post = (m: WorkerOutboundMessage) => parentPort?.postMessage(m);

  const writeQueueFile = async (data: {
    version: 2;
    items: Array<{ url: string; filename: string }>;
    completedIds: string[];
    total: number;
    folder: string;
    timestamp: number;
  }) => {
    try {
      await writeFile(queueFilePath, JSON.stringify(data), "utf-8");
    } catch {
      /* ignore queue write errors — Main owns diagnostics */
    }
  };

  const deleteQueueFile = async () => {
    try {
      await access(queueFilePath);
      await unlink(queueFilePath);
    } catch {
      /* ignore */
    }
  };

  let downloaded = 0;
  const failed: DownloadFailure[] = [];
  const completedIds: string[] = [];

  const persistQueue = async () => {
    await writeQueueFile({
      version: 2,
      items,
      completedIds: [...completedIds],
      total: items.length,
      folder,
      timestamp: Date.now(),
    });
  };

  const markCompleted = async (filename: string) => {
    completedIds.push(filename);
    downloaded++;
    await persistQueue();
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
    if (aborted) return;
    while (paused && !aborted) {
      await delay(200);
    }
    if (aborted) return;

    const filePath = getFilePath(folder, item.filename, downloadFolderStructure);
    const dir = path.dirname(filePath);
    try {
      await access(dir);
    } catch {
      try {
        await mkdir(dir, { recursive: true });
      } catch (err) {
        if (aborted) return;
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
      await markCompleted(item.filename);
      post({
        type: "progress",
        id: item.filename,
        percent: 100,
        done: completedIds.length,
        total: items.length,
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
          onDownloadProgress: (ev: AxiosProgressEvent) => {
            if (aborted) {
              abortController.abort();
              return;
            }
            armIdleTimer();
            if (ev.total) {
              const pct = Math.round((ev.loaded * 100) / ev.total);
              post({
                type: "progress",
                id: item.filename,
                percent: pct,
                done: completedIds.length + (pct >= 100 ? 1 : 0),
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
        await markCompleted(item.filename);
        post({
          type: "progress",
          id: item.filename,
          percent: 100,
          done: completedIds.length,
          total: items.length,
        });
        return;
      } catch (err) {
        clearIdleTimer();
        await unlinkIfExists(filePath);

        if (aborted && !idleTimedOut) {
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
          return;
        }
        recordFailure(item, classified);
        return;
      } finally {
        clearIdleTimer();
        activeControllers.delete(abortController);
      }
    }
  };

  await writeQueueFile({
    version: 2,
    items,
    completedIds: [],
    total: items.length,
    folder,
    timestamp: Date.now(),
  });

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
  if (!canceled && failed.length === 0) {
    await deleteQueueFile();
  } else {
    await persistQueue();
  }

  post({
    type: "complete",
    success: failed.length === 0 && !canceled,
    downloaded,
    failed,
    canceled,
    completedIds: [...completedIds],
  });
}

runWorker().catch((err: unknown) => {
  parentPort?.postMessage({
    type: "error",
    error: err instanceof Error ? err.message : String(err),
  });
});
