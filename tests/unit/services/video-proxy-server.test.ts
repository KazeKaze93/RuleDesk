import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import {
  VIDEO_CACHE_MAX_BYTES,
  VIDEO_CACHE_SWEEP_ORPHAN_TMP_AGE_MS,
} from "../../../src/main/config/constants";

vi.mock("electron", () => ({
  app: {
    getPath: () => path.join(os.tmpdir(), "ruledesk-video-proxy-electron-unused"),
  },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      file: { level: "info", resolvePathFn: vi.fn() },
      console: { format: "" },
    },
    errorHandler: { startCatching: vi.fn() },
  },
}));

vi.mock("@/main/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/main/lib/proxy", () => ({
  getProxyAgent: vi.fn(() => undefined),
}));

import { VideoProxyServer } from "../../../src/main/services/video-proxy-server";

const CDN_HOST_URL = "https://rule34.xxx/data/test-video.bin";
const PAYLOAD = Buffer.from("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");

function getPort(server: http.Server): number {
  const addr = server.address();
  if (addr === null || typeof addr === "string") {
    throw new Error("expected TCP listen address");
  }
  return addr.port;
}

async function readResponse(
  res: http.IncomingMessage,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  const chunks: Buffer[] = [];
  for await (const chunk of res) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return {
    status: res.statusCode ?? 0,
    headers: res.headers,
    body: Buffer.concat(chunks),
  };
}

describe("VideoProxyServer cache integrity", () => {
  let cacheDir: string;
  let proxy: VideoProxyServer;
  let cdnServer: http.Server;
  let cdnPort: number;
  let httpsRequestSpy: ReturnType<typeof vi.spyOn>;
  let bytesPerChunk = PAYLOAD.length;
  let chunkDelayMs = 0;

  beforeEach(async () => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "ruledesk-vcache-"));
    proxy = new VideoProxyServer(cacheDir);
    bytesPerChunk = PAYLOAD.length;
    chunkDelayMs = 0;

    cdnServer = http.createServer((req, res) => {
      if (req.method === "HEAD") {
        res.writeHead(200, {
          "Content-Type": "video/mp4",
          "Content-Length": String(PAYLOAD.length),
          "Accept-Ranges": "bytes",
        });
        res.end();
        return;
      }

      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": String(PAYLOAD.length),
        "Accept-Ranges": "bytes",
      });

      let offset = 0;
      const writeNext = (): void => {
        if (offset >= PAYLOAD.length) {
          res.end();
          return;
        }
        const end = Math.min(offset + bytesPerChunk, PAYLOAD.length);
        const slice = PAYLOAD.subarray(offset, end);
        offset = end;
        res.write(slice);
        if (chunkDelayMs > 0) {
          setTimeout(writeNext, chunkDelayMs);
        } else {
          writeNext();
        }
      };
      writeNext();
    });

    await new Promise<void>((resolve) => {
      cdnServer.listen(0, "127.0.0.1", () => resolve());
    });
    cdnPort = getPort(cdnServer);

    httpsRequestSpy = vi.spyOn(https, "request").mockImplementation(
      ((_url, options, callback) => {
        const headers =
          typeof options === "object" && options !== null && "headers" in options
            ? options.headers
            : undefined;
        const method =
          typeof options === "object" && options !== null && "method" in options
            ? options.method
            : "GET";
        const localReq = http.request(
          {
            hostname: "127.0.0.1",
            port: cdnPort,
            path: "/data/test-video.bin",
            method,
            headers,
          },
          callback,
        );
        return localReq;
      }) as typeof https.request,
    );

    await proxy.start();
  });

  afterEach(async () => {
    httpsRequestSpy.mockRestore();
    proxy.stop();
    await new Promise<void>((resolve, reject) => {
      cdnServer.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    fs.rmSync(cacheDir, { recursive: true, force: true });
  });

  function proxyGet(
    extraHeaders?: http.OutgoingHttpHeaders,
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    const url = proxy.getProxyUrl(CDN_HOST_URL);
    return new Promise((resolve, reject) => {
      const req = http.get(url, { headers: extraHeaders }, (res) => {
        void readResponse(res).then(resolve, reject);
      });
      req.on("error", reject);
    });
  }

  async function waitForFinalCache(): Promise<string> {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      const bins = fs
        .readdirSync(cacheDir)
        .filter((n) => n.endsWith(".bin") && !n.includes(".tmp-"));
      if (bins.length === 1) {
        return bins[0];
      }
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error(
      `cache .bin not ready; dir=${JSON.stringify(fs.readdirSync(cacheDir))}`,
    );
  }

  it("caches a full GET and serves the same bytes from disk on the second hit", async () => {
    const first = await proxyGet();
    expect(first.status).toBe(200);
    expect(first.body.equals(PAYLOAD)).toBe(true);
    expect(first.headers["content-length"]).toBe(String(PAYLOAD.length));

    await waitForFinalCache();
    expect(fs.readdirSync(cacheDir).some((n) => n.includes(".tmp-"))).toBe(false);

    const second = await proxyGet();
    expect(second.status).toBe(200);
    expect(second.body.equals(PAYLOAD)).toBe(true);
    expect(second.headers["content-length"]).toBe(String(PAYLOAD.length));
  });

  it("serves Range from a complete cache file", async () => {
    await proxyGet();
    await waitForFinalCache();
    const ranged = await proxyGet({ Range: "bytes=0-3" });
    expect(ranged.status).toBe(206);
    expect(ranged.body.equals(PAYLOAD.subarray(0, 4))).toBe(true);
  });

  it("does not create cache files for HEAD", async () => {
    const url = proxy.getProxyUrl(CDN_HOST_URL);
    const result = await new Promise<{
      status: number;
      body: Buffer;
    }>((resolve, reject) => {
      const req = http.request(url, { method: "HEAD" }, (res) => {
        void readResponse(res).then(
          (r) => resolve({ status: r.status, body: r.body }),
          reject,
        );
      });
      req.on("error", reject);
      req.end();
    });
    expect(result.status).toBe(200);
    expect(result.body.length).toBe(0);
    expect(fs.readdirSync(cacheDir)).toEqual([]);
  });

  async function proxyStatus(fileUrl: string): Promise<number> {
    const url = proxy.getProxyUrl(fileUrl);
    const result = await new Promise<{ status: number }>((resolve, reject) => {
      http.get(url, (res) => {
        void readResponse(res).then((r) => resolve({ status: r.status }), reject);
      }).on("error", reject);
    });
    return result.status;
  }

  it("rejects disallowed CDN hosts with 400", async () => {
    expect(await proxyStatus("https://evil.example/video.mp4")).toBe(400);
  });

  it.each([
    ["https://img4.gelbooru.com/images/x.webm", 200],
    ["https://wimg.rule34.xxx/video.mp4", 200],
    ["https://us.rule34.xxx/video.mp4", 200],
    ["https://api-cdn.rule34.xxx/video.mp4", 200],
    ["https://api-cdn-mp4.rule34.xxx/video.mp4", 200],
    ["https://img.rule34.xxx/video.mp4", 200],
    ["https://img1.gelbooru.com/images/x.webm", 400],
    ["https://img2.gelbooru.com/images/x.webm", 400],
    ["https://img3.gelbooru.com/images/x.webm", 400],
    ["https://cdn-unknown.rule34.xxx/video.mp4", 400],
  ])("provider-derived CDN allowlist %s -> %i", async (fileUrl, status) => {
    expect(await proxyStatus(fileUrl)).toBe(status);
  });

  it.each([
    ["https://api.rule34.xxx/index.php?page=dapi&s=post&q=index", 400],
    ["https://gelbooru.com/index.php?page=dapi&s=post&q=index", 400],
  ])("rejects API/apex hosts that CSP allows but video-proxy must not fetch %s", async (fileUrl, status) => {
    expect(await proxyStatus(fileUrl)).toBe(status);
  });

  it("does not leave truncated cache when client aborts mid-download", async () => {
    bytesPerChunk = 4;
    chunkDelayMs = 40;

    const url = proxy.getProxyUrl(CDN_HOST_URL);
    await new Promise<void>((resolve, reject) => {
      const req = http.get(url, (res) => {
        res.once("data", () => {
          req.destroy();
        });
        res.on("error", () => {
          // expected after destroy
        });
      });
      req.on("error", () => {
        // expected
      });
      req.on("close", () => {
        setTimeout(() => resolve(), 150);
      });
      req.on("error", () => undefined);
      setTimeout(() => reject(new Error("abort test timed out")), 5000);
    });

    const remaining = fs.readdirSync(cacheDir);
    expect(remaining.some((n) => n.endsWith(".bin") && !n.includes(".tmp-"))).toBe(
      false,
    );
    expect(remaining.some((n) => n.includes(".tmp-"))).toBe(false);
  });

  it("concurrent GETs never serve a truncated final cache file", async () => {
    bytesPerChunk = 2;
    chunkDelayMs = 15;

    const [a, b] = await Promise.all([proxyGet(), proxyGet()]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(a.body.equals(PAYLOAD)).toBe(true);
    expect(b.body.equals(PAYLOAD)).toBe(true);

    const bins = fs
      .readdirSync(cacheDir)
      .filter((n) => n.endsWith(".bin") && !n.includes(".tmp-"));
    expect(bins.length).toBe(1);
    const onDisk = fs.readFileSync(path.join(cacheDir, bins[0]));
    expect(onDisk.equals(PAYLOAD)).toBe(true);
  });

  it("evictCache removes aged orphan tmp files and keeps bins under the soft cap", () => {
    const now = Date.now();
    fs.writeFileSync(path.join(cacheDir, "a.bin"), Buffer.alloc(100, 1));
    const orphan = path.join(cacheDir, "dead.bin.tmp-orphan");
    fs.writeFileSync(orphan, Buffer.alloc(10));
    const old = now - VIDEO_CACHE_SWEEP_ORPHAN_TMP_AGE_MS - 1000;
    fs.utimesSync(orphan, old / 1000, old / 1000);

    proxy.evictCache();
    expect(fs.existsSync(orphan)).toBe(false);
    expect(fs.existsSync(path.join(cacheDir, "a.bin"))).toBe(true);
  });

  it("evictCache drops least-recently-accessed bins, not oldest mtime", () => {
    const originalStat = fs.statSync.bind(fs);

    const recentlyPlayed = path.join(cacheDir, "old-played.bin");
    const freshJunk = path.join(cacheDir, "fresh-junk.bin");
    const other = path.join(cacheDir, "other.bin");
    fs.writeFileSync(recentlyPlayed, "x");
    fs.writeFileSync(freshJunk, "y");
    fs.writeFileSync(other, "z");

    const playedAt = Date.now() - 1_000;
    const createdLongAgo = Date.now() - 30_000;
    const neverPlayedAt = Date.now() - 20_000;
    const createdRecently = Date.now() - 2_000;
    const midAccess = Date.now() - 10_000;
    fs.utimesSync(recentlyPlayed, playedAt / 1000, createdLongAgo / 1000);
    fs.utimesSync(freshJunk, neverPlayedAt / 1000, createdRecently / 1000);
    fs.utimesSync(other, midAccess / 1000, midAccess / 1000);

    const huge = Math.floor(VIDEO_CACHE_MAX_BYTES / 2) + 10;
    vi.spyOn(fs, "statSync").mockImplementation(((
      p: fs.PathLike,
      options?: fs.StatSyncOptions,
    ) => {
      const st = originalStat(p, options);
      if (
        typeof p === "string" &&
        p.endsWith(".bin") &&
        !p.includes(".tmp-") &&
        st &&
        typeof st === "object" &&
        "isFile" in st
      ) {
        // boundary: vitest mock overlays size on real Stats for eviction overflow simulation
        Object.defineProperty(st, "size", { value: huge, configurable: true });
      }
      return st;
    }) as typeof fs.statSync);

    proxy.evictCache();

    const left = fs
      .readdirSync(cacheDir)
      .filter((n) => n.endsWith(".bin") && !n.includes(".tmp-"));
    expect(left.includes("old-played.bin")).toBe(true);
    expect(left.includes("fresh-junk.bin")).toBe(false);

    vi.mocked(fs.statSync).mockRestore();
  });

  it("evictCache does not unlink a bin with an open reader", async () => {
    const first = await proxyGet();
    expect(first.status).toBe(200);
    const cacheName = await waitForFinalCache();
    const openPath = path.join(cacheDir, cacheName);
    fs.writeFileSync(openPath, Buffer.alloc(2 * 1024 * 1024, 1));

    const held = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const req = http.get(proxy.getProxyUrl(CDN_HOST_URL), (res) => {
        res.pause();
        resolve(res);
      });
      req.on("error", reject);
    });
    await new Promise((r) => setTimeout(r, 30));

    const createdRecently = Date.now() - 1_000;
    const accessedLongAgo = Date.now() - 30_000;
    fs.utimesSync(openPath, accessedLongAgo / 1000, createdRecently / 1000);

    const closedA = path.join(cacheDir, "closed-a.bin");
    const closedB = path.join(cacheDir, "closed-b.bin");
    fs.writeFileSync(closedA, "a");
    fs.writeFileSync(closedB, "b");
    fs.utimesSync(closedA, (Date.now() - 20_000) / 1000, (Date.now() - 20_000) / 1000);
    fs.utimesSync(closedB, (Date.now() - 10_000) / 1000, (Date.now() - 10_000) / 1000);

    const originalStat = fs.statSync.bind(fs);
    const huge = Math.floor(VIDEO_CACHE_MAX_BYTES / 2) + 10;
    vi.spyOn(fs, "statSync").mockImplementation(((
      p: fs.PathLike,
      options?: fs.StatSyncOptions,
    ) => {
      const st = originalStat(p, options);
      if (
        typeof p === "string" &&
        p.endsWith(".bin") &&
        !p.includes(".tmp-") &&
        st &&
        typeof st === "object" &&
        "isFile" in st
      ) {
        // boundary: vitest mock overlays size on real Stats for eviction overflow simulation
        Object.defineProperty(st, "size", { value: huge, configurable: true });
      }
      return st;
    }) as typeof fs.statSync);

    proxy.evictCache();

    expect(fs.existsSync(openPath)).toBe(true);

    vi.mocked(fs.statSync).mockRestore();
    held.resume();
    await readResponse(held);
  });
});
