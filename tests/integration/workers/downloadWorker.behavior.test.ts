/**
 * Spawns the built downloadWorker.cjs against a local HTTP server.
 * Requires `out/main/workers/downloadWorker.cjs` (run electron-vite build).
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.resolve(
  __dirname,
  "../../../out/main/workers/downloadWorker.cjs"
);

const CompleteMessageSchema = z.object({
  type: z.literal("complete"),
  success: z.boolean(),
  downloaded: z.number(),
  failed: z.array(
    z.object({
      itemId: z.string(),
      code: z.string(),
    })
  ),
  canceled: z.boolean(),
  completedIds: z.array(z.string()),
});

type CompleteMessage = z.infer<typeof CompleteMessageSchema>;

function listen(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
): Promise<{ server: http.Server; port: number }> {
  const server = http.createServer(handler);
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("expected TCP address"));
        return;
      }
      server.unref();
      resolve({ server, port: address.port });
    });
  });
}

function runWorkerBatch(params: {
  items: Array<{ url: string; filename: string }>;
  folder: string;
  persistQueue?: boolean;
  /** When persistQueue is false: how Main answers item-completed. */
  onItemCompletedAck?: "persisted" | "persist-failed";
  onWorker?: (worker: Worker) => void;
}): Promise<CompleteMessage> {
  const queueFilePath = path.join(params.folder, "queue.json");
  // Main-owned ack path (worker no longer writes queue.json).
  const persistQueue = params.persistQueue ?? false;
  const ackMode = params.onItemCompletedAck ?? "persisted";
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      workerData: {
        items: params.items,
        folder: params.folder,
        duplicateFileBehavior: "overwrite",
        downloadFolderStructure: "flat",
        queueFilePath,
        proxyUrl: null,
        persistQueue,
      },
    });
    params.onWorker?.(worker);
    worker.on("message", (msg: unknown) => {
      if (typeof msg !== "object" || msg === null || !("type" in msg)) {
        return;
      }
      if (
        !persistQueue &&
        msg.type === "item-completed" &&
        "id" in msg &&
        typeof msg.id === "string"
      ) {
        if (ackMode === "persisted") {
          worker.postMessage({ type: "item-persisted", id: msg.id });
        } else {
          worker.postMessage({
            type: "item-persist-failed",
            id: msg.id,
            code: "DISK",
            message: "simulated queue persist failure",
          });
        }
        return;
      }
      if (msg.type === "complete" || msg.type === "error") {
        void worker.terminate().finally(() => {
          if (msg.type === "complete") {
            const parsed = CompleteMessageSchema.safeParse(msg);
            if (!parsed.success) {
              reject(parsed.error);
              return;
            }
            resolve(parsed.data);
          } else {
            reject(new Error("worker error message"));
          }
        });
      }
    });
    worker.on("error", reject);
  });
}

describe("downloadWorker behavior", () => {
  const servers: http.Server[] = [];
  let folder: string;

  beforeAll(() => {
    if (!fs.existsSync(WORKER_PATH)) {
      throw new Error(
        `Missing ${WORKER_PATH}. Run electron-vite build before this suite.`
      );
    }
  });

  afterEach(async () => {
    for (const server of servers.splice(0)) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    if (folder && fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true, force: true });
    }
  });

  it("cancels a hung request with no progress and removes the partial file", async () => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), "rd-dl-cancel-"));
    const { server, port } = await listen((_req, res) => {
      // Accept connection / headers never finish → no download progress events.
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": "1048576",
      });
      // Intentionally never write body or end.
    });
    servers.push(server);

    const filename = "0_hung.bin";
    const filePath = path.join(folder, filename);
    const result = await runWorkerBatch({
      items: [
        {
          url: `http://127.0.0.1:${port}/hang`,
          filename,
        },
      ],
      folder,
      onWorker: (worker) => {
        setTimeout(() => {
          worker.postMessage({ type: "cancel" });
        }, 200);
      },
    });

    expect(result.canceled).toBe(true);
    expect(result.downloaded).toBe(0);
    expect(fs.existsSync(filePath)).toBe(false);
  }, 15_000);

  it("does not start new requests during a global 429 pause", async () => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), "rd-dl-429-"));
    const requestStarts: number[] = [];
    let hits = 0;

    const { server, port } = await listen((_req, res) => {
      requestStarts.push(Date.now());
      hits += 1;
      if (hits <= 3) {
        res.writeHead(429, {
          "Content-Type": "text/plain",
          "Retry-After": "1",
        });
        res.end("rate limited");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": "4",
      });
      res.end("ok!!");
    });
    servers.push(server);

    const items = [1, 2, 3, 4, 5, 6].map((n) => ({
      url: `http://127.0.0.1:${port}/f${n}`,
      filename: `0_${n}.bin`,
    }));

    const result = await runWorkerBatch({ items, folder });
    expect(result.canceled).toBe(false);
    expect(result.downloaded).toBeGreaterThan(0);

    // Concurrency 3 → first three 429s form the opening wave; the next start
    // must wait for Retry-After (~1s). Wall-clock "during pause" windows flake
    // under load when the first wave itself straddles t0+150ms.
    const sortedStarts = [...requestStarts].sort((a, b) => a - b);
    expect(sortedStarts.length).toBeGreaterThan(3);
    const gapBeforeFourthMs = sortedStarts[3] - sortedStarts[0];
    expect(gapBeforeFourthMs).toBeGreaterThanOrEqual(800);
  }, 30_000);

  it("persist-failed ack records DISK failure and does not hang", async () => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), "rd-dl-persist-fail-"));
    const { server, port } = await listen((_req, res) => {
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": "4",
      });
      res.end("ok!!");
    });
    servers.push(server);

    const filename = "0_persist.bin";
    const started = Date.now();
    const result = await runWorkerBatch({
      items: [
        {
          url: `http://127.0.0.1:${port}/ok`,
          filename,
        },
      ],
      folder,
      persistQueue: false,
      onItemCompletedAck: "persist-failed",
    });

    expect(Date.now() - started).toBeLessThan(5_000);
    expect(result.success).toBe(false);
    expect(result.downloaded).toBe(0);
    expect(result.failed).toEqual([
      expect.objectContaining({
        itemId: filename,
        code: "DISK",
      }),
    ]);
    expect(fs.existsSync(path.join(folder, filename))).toBe(true);
  }, 15_000);
});
