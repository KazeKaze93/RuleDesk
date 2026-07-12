/**
 * Download Worker Thread
 *
 * Runs batch downloads off the Main process to avoid blocking the UI.
 * Receives config via workerData, listens for cancel/pause/resume via parentPort,
 * sends progress back to Main via parentPort.postMessage.
 */
import { parentPort, workerData } from "worker_threads";
import path from "path";
import fs from "fs";
import { access, mkdir, unlink, writeFile } from "fs/promises";
import axios, { type AxiosProgressEvent } from "axios";
import { pipeline } from "stream/promises";

const BATCH_DOWNLOAD_CONCURRENCY = 3;
const BATCH_DOWNLOAD_DELAY_MS = 500;

interface WorkerData {
  items: Array<{ url: string; filename: string }>;
  folder: string;
  duplicateFileBehavior: "skip" | "overwrite";
  downloadFolderStructure: "flat" | "{artist_id}";
  queueFilePath: string;
}

interface WorkerMessage {
  type: "progress" | "complete" | "error";
  id?: string;
  percent?: number;
  done?: number;
  total?: number;
  success?: boolean;
  downloaded?: number;
  failed?: number;
  canceled?: boolean;
  error?: string;
}

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

async function runWorker(): Promise<void> {
  const {
    items,
    folder,
    duplicateFileBehavior,
    downloadFolderStructure,
    queueFilePath,
  // boundary: worker message — workerData payload after trust/Zod
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: worker message
  } = workerData as WorkerData;

  let aborted = false;
  let paused = false;

  parentPort?.on("message", (msg: { type: string }) => {
    if (msg.type === "cancel") aborted = true;
    if (msg.type === "pause") paused = true;
    if (msg.type === "resume") paused = false;
  });

  const post = (m: WorkerMessage) => parentPort?.postMessage(m);

  const writeQueueFile = async (data: {
    items: Array<{ url: string; filename: string }>;
    doneCount: number;
    total: number;
    folder: string;
    timestamp: number;
  }) => {
    try {
      await writeFile(queueFilePath, JSON.stringify(data), "utf-8");
    } catch {
      /* ignore */
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
  let failed = 0;

  const updateQueueProgress = async () => {
    await writeQueueFile({
      items,
      doneCount: downloaded,
      total: items.length,
      folder,
      timestamp: Date.now(),
    });
  };

  const runOne = async (item: { url: string; filename: string }): Promise<void> => {
    if (aborted) return;
    while (paused && !aborted) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (aborted) return;

    const filePath = getFilePath(folder, item.filename, downloadFolderStructure);
    const dir = path.dirname(filePath);
    try {
      await access(dir);
    } catch {
      try {
        await mkdir(dir, { recursive: true });
      } catch {
        failed++;
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
      downloaded++;
      await updateQueueProgress();
      post({
        type: "progress",
        id: item.filename,
        percent: 100,
        done: downloaded,
        total: items.length,
      });
      return;
    }

    const abortController = new AbortController();
    try {
      const response = await axios({
        method: "GET",
        url: item.url,
        responseType: "stream",
        signal: abortController.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        onDownloadProgress: (ev: AxiosProgressEvent) => {
          if (aborted) {
            abortController.abort();
            return;
          }
          if (ev.total) {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            post({
              type: "progress",
              id: item.filename,
              percent: pct,
              done: downloaded + (pct >= 100 ? 1 : 0),
              total: items.length,
            });
          }
        },
      });
      const writer = fs.createWriteStream(filePath);
      await pipeline(response.data, writer, {
        signal: abortController.signal,
      });
      downloaded++;
      await updateQueueProgress();
      post({
        type: "progress",
        id: item.filename,
        percent: 100,
        done: downloaded,
        total: items.length,
      });
    } catch (err) {
      if (aborted) return;
      failed++;
      const isAborted =
        (err instanceof Error && err.name === "AbortError") ||
        (axios.isAxiosError(err) && err.code === "ERR_CANCELED");
      if (isAborted) return;
      try {
        await access(filePath);
        await unlink(filePath);
      } catch {
        /* ignore */
      }
    }
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  await writeQueueFile({
    items,
    doneCount: 0,
    total: items.length,
    folder,
    timestamp: Date.now(),
  });

  const queue = [...items];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < BATCH_DOWNLOAD_CONCURRENCY; i++) {
    workers.push(
      (async () => {
        while (queue.length > 0 && !aborted) {
          const item = queue.shift();
          if (!item) break;
          await runOne(item);
          await delay(BATCH_DOWNLOAD_DELAY_MS);
        }
      })()
    );
  }
  await Promise.all(workers);

  const canceled = aborted;
  if (!canceled && failed === 0) {
    await deleteQueueFile();
  }

  post({
    type: "complete",
    success: failed === 0 && !canceled,
    downloaded,
    failed,
    canceled,
  });
}

runWorker().catch((err: unknown) => {
  parentPort?.postMessage({
    type: "error",
    error: err instanceof Error ? err.message : String(err),
  });
});
