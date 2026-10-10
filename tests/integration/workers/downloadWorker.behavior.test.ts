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
  onWorker?: (worker: Worker) => void;
}): Promise<CompleteMessage> {
  const queueFilePath = path.join(params.folder, "queue.json");
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      workerData: {
        items: params.items,
        folder: params.folder,
        duplicateFileBehavior: "overwrite",
        downloadFolderStructure: "flat",
        queueFilePath,
        proxyUrl: null,
      },
    });
    params.onWorker?.(worker);
    worker.on("message", (msg: unknown) => {
      if (typeof msg !== "object" || msg === null || !("type" in msg)) {
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

    const t0 = Date.now();
    const result = await runWorkerBatch({ items, folder });
    expect(result.canceled).toBe(false);
    expect(result.downloaded).toBeGreaterThan(0);

    // First wave: up to concurrency (3) start near t0.
    // During the 429 pause (~1s Retry-After), no additional starts.
    const pauseEndApprox = t0 + 900;
    const startsDuringPause = requestStarts.filter(
      (t) => t > t0 + 150 && t < pauseEndApprox
    );
    expect(startsDuringPause.length).toBe(0);

    const startsAfterPause = requestStarts.filter((t) => t >= pauseEndApprox);
    expect(startsAfterPause.length).toBeGreaterThan(0);
  }, 30_000);
});
