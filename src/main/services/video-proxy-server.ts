import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { URL } from "node:url";
import { PassThrough } from "node:stream";
import { app } from "electron";
import log from "electron-log";
import type { AddressInfo } from "node:net";
import { tryParseHttpsUrlHostname } from "../../shared/utils/url-host";
import { getAllProviderCdnDomains } from "../providers";
import {
  VIDEO_CACHE_EVICT_AFTER_START_MS,
  VIDEO_CACHE_MAX_BYTES,
  VIDEO_CACHE_SWEEP_ORPHAN_TMP_AGE_MS,
} from "../config/constants";

const VIDEO_PATH = "/video";
const PROXY_HOST = "127.0.0.1";
/** Cached at module load — `isAllowedCdnUrl` is on the video request hot path. */
const ALLOWED_CDN_HOSTS = new Set(getAllProviderCdnDomains());

const VIDEO_CONTENT_TYPE = "video/mp4";
const CACHE_BIN_SUFFIX = ".bin";
const CACHE_TMP_MARKER = ".tmp-";

function toTcpAddress(
  value: string | AddressInfo | null,
): AddressInfo {
  if (value === null || typeof value === "string") {
    throw new Error("[VideoProxy] Server is not bound to a TCP address");
  }
  return value;
}

function getListeningPort(server: http.Server): number {
  return toTcpAddress(server.address()).port;
}

function isAllowedCdnUrl(urlString: string): boolean {
  const host = tryParseHttpsUrlHostname(urlString);
  if (!host) {
    return false;
  }
  return ALLOWED_CDN_HOSTS.has(host);
}

type RangeResult =
  | { kind: "full" }
  | { kind: "partial"; start: number; end: number }
  | { kind: "unsatisfiable" }
  | { kind: "invalid" };

function parseRangeHeader(rangeHeader: string | undefined, fileSize: number): RangeResult {
  if (rangeHeader === undefined || rangeHeader === "") {
    return { kind: "full" };
  }
  if (fileSize === 0) {
    return { kind: "unsatisfiable" };
  }
  if (rangeHeader.includes(",")) {
    return { kind: "invalid" };
  }
  const m = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
  if (!m) {
    return { kind: "invalid" };
  }
  const start = Number(m[1]);
  const endPart = m[2];
  let end: number;
  if (endPart === "") {
    end = fileSize - 1;
  } else {
    end = Number(endPart);
  }
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    return { kind: "unsatisfiable" };
  }
  if (start >= fileSize) {
    return { kind: "unsatisfiable" };
  }
  if (end >= fileSize) {
    end = fileSize - 1;
  }
  return { kind: "partial", start, end };
}

function forwardNumberHeader(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function isCompleteCacheFile(filePath: string): boolean {
  try {
    const st = fs.statSync(filePath);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

export class VideoProxyServer {
  private server: http.Server | null = null;
  private port = 0;
  private readonly cacheDir: string;
  private startEvictTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * @param cacheDirOverride - optional cache directory (unit tests); production uses userData/video-cache
   */
  constructor(cacheDirOverride?: string) {
    this.cacheDir =
      cacheDirOverride ?? path.join(app.getPath("userData"), "video-cache");
  }

  getListenPort(): number {
    return this.port;
  }

  /** Exposed for maintenance scheduler and tests. */
  getCacheDir(): string {
    return this.cacheDir;
  }

  start(): Promise<number> {
    if (this.server) {
      return Promise.resolve(this.port);
    }

    return new Promise((resolve, reject) => {
      try {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      } catch (err) {
        reject(err);
        return;
      }

      const srv = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });
      this.server = srv;
      srv.once("error", reject);
      srv.listen(0, PROXY_HOST, () => {
        srv.removeListener("error", reject);
        try {
          this.port = getListeningPort(srv);
        } catch (err) {
          reject(err);
          return;
        }
        log.info(`[VideoProxy] Started on port ${this.port}`);
        this.scheduleDeferredEviction();
        resolve(this.port);
      });
    });
  }

  stop(): void {
    if (this.startEvictTimer !== null) {
      clearTimeout(this.startEvictTimer);
      this.startEvictTimer = null;
    }
    this.server?.close();
    this.server = null;
    this.port = 0;
    log.info("[VideoProxy] Stopped");
  }

  getProxyUrl(fileUrl: string): string {
    return `http://${PROXY_HOST}:${this.port}${VIDEO_PATH}?url=${encodeURIComponent(fileUrl)}`;
  }

  /**
   * Delete orphaned tmp writers older than orphan-age, then drop oldest *.bin
   * files until total size is within VIDEO_CACHE_MAX_BYTES.
   */
  evictCache(): void {
    let names: string[];
    try {
      names = fs.readdirSync(this.cacheDir);
    } catch (err) {
      log.error("[VideoProxy] evictCache: readdir failed", err);
      return;
    }

    const now = Date.now();

    for (const name of names) {
      if (!name.includes(`${CACHE_BIN_SUFFIX}${CACHE_TMP_MARKER}`)) {
        continue;
      }
      const fullPath = path.join(this.cacheDir, name);
      try {
        const st = fs.statSync(fullPath);
        if (!st.isFile()) {
          continue;
        }
        if (now - st.mtimeMs >= VIDEO_CACHE_SWEEP_ORPHAN_TMP_AGE_MS) {
          fs.unlinkSync(fullPath);
          log.info(`[VideoProxy] Removed orphan tmp: ${name}`);
        }
      } catch (err) {
        log.error(`[VideoProxy] Failed to sweep orphan tmp ${name}`, err);
      }
    }

    let binNames: string[];
    try {
      binNames = fs.readdirSync(this.cacheDir);
    } catch (err) {
      log.error("[VideoProxy] evictCache: readdir (bins) failed", err);
      return;
    }

    type BinEntry = { fullPath: string; size: number; mtimeMs: number };
    const bins: BinEntry[] = [];
    for (const name of binNames) {
      if (!name.endsWith(CACHE_BIN_SUFFIX) || name.includes(CACHE_TMP_MARKER)) {
        continue;
      }
      const fullPath = path.join(this.cacheDir, name);
      try {
        const st = fs.statSync(fullPath);
        if (!st.isFile()) {
          continue;
        }
        bins.push({ fullPath, size: st.size, mtimeMs: st.mtimeMs });
      } catch {
        // skip vanished entries
      }
    }

    bins.sort((a, b) => a.mtimeMs - b.mtimeMs);
    let totalBytes = bins.reduce((sum, b) => sum + b.size, 0);

    while (totalBytes > VIDEO_CACHE_MAX_BYTES && bins.length > 0) {
      const oldest = bins.shift();
      if (oldest === undefined) {
        break;
      }
      try {
        fs.unlinkSync(oldest.fullPath);
        totalBytes -= oldest.size;
        log.info(
          `[VideoProxy] Evicted cache file (${oldest.size} bytes); remaining≈${totalBytes}`,
        );
      } catch (err) {
        log.error("[VideoProxy] Failed to evict cache file", err);
      }
    }
  }

  private scheduleDeferredEviction(): void {
    if (this.startEvictTimer !== null) {
      clearTimeout(this.startEvictTimer);
    }
    this.startEvictTimer = setTimeout(() => {
      this.startEvictTimer = null;
      try {
        this.evictCache();
      } catch (err) {
        log.error("[VideoProxy] Deferred eviction failed", err);
      }
    }, VIDEO_CACHE_EVICT_AFTER_START_MS);
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method Not Allowed");
      return;
    }

    if (req.url === undefined) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Invalid URL");
      return;
    }

    let requestUrl: URL;
    try {
      requestUrl = new URL(req.url, `http://${PROXY_HOST}`);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Invalid URL");
      return;
    }

    if (requestUrl.pathname !== VIDEO_PATH) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    const urlParam = requestUrl.searchParams.get("url");
    if (urlParam === null || urlParam === "" || !isAllowedCdnUrl(urlParam)) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Invalid URL");
      return;
    }

    const cacheKey = crypto.createHash("md5").update(urlParam).digest("hex");
    const cachePath = path.join(this.cacheDir, `${cacheKey}${CACHE_BIN_SUFFIX}`);

    if (isCompleteCacheFile(cachePath)) {
      this.serveFromDisk(req, res, cachePath);
      return;
    }

    this.proxyFromCdn(req, res, urlParam, cachePath);
  }

  private serveFromDisk(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    filePath: string,
  ): void {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch (err) {
      log.error("[VideoProxy] stat cache failed", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Cache read error");
      }
      return;
    }

    const fileSize = stat.size;
    const rangeResult = parseRangeHeader(req.headers.range, fileSize);

    if (rangeResult.kind === "invalid") {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Invalid Range");
      return;
    }

    if (rangeResult.kind === "unsatisfiable") {
      res.writeHead(416, {
        "Content-Range": `bytes */${fileSize}`,
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end("Range Not Satisfiable");
      return;
    }

    if (req.method === "HEAD") {
      if (rangeResult.kind === "full") {
        res.writeHead(200, {
          "Content-Type": VIDEO_CONTENT_TYPE,
          "Content-Length": String(fileSize),
          "Accept-Ranges": "bytes",
        });
        res.end();
        return;
      }
      const { start, end } = rangeResult;
      const partLength = end - start + 1;
      res.writeHead(206, {
        "Content-Type": VIDEO_CONTENT_TYPE,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": String(partLength),
        "Accept-Ranges": "bytes",
      });
      res.end();
      return;
    }

    if (rangeResult.kind === "full") {
      res.writeHead(200, {
        "Content-Type": VIDEO_CONTENT_TYPE,
        "Content-Length": String(fileSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      });
      const stream = fs.createReadStream(filePath);
      this.pipeStreamToResponseWithCleanup(stream, res);
      return;
    }

    const { start, end } = rangeResult;
    const partLength = end - start + 1;
    res.writeHead(206, {
      "Content-Type": VIDEO_CONTENT_TYPE,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Length": String(partLength),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    });
    const stream = fs.createReadStream(filePath, { start, end });
    this.pipeStreamToResponseWithCleanup(stream, res);
  }

  private pipeStreamToResponseWithCleanup(
    fileStream: fs.ReadStream,
    res: http.ServerResponse,
  ): void {
    res.on("close", () => {
      if (!fileStream.destroyed) {
        fileStream.destroy();
      }
    });
    fileStream.on("error", (err) => {
      log.error("[VideoProxy] read cache file failed", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Read error");
        return;
      }
      if (!res.writableEnded) {
        res.destroy();
      }
    });
    fileStream.pipe(res);
  }

  private proxyFromCdn(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    targetUrl: string,
    cachePath: string,
  ): void {
    const proxyHeaders: http.OutgoingHttpHeaders = {
      "User-Agent": "Mozilla/5.0",
    };
    if (req.headers.range !== undefined) {
      proxyHeaders.range = req.headers.range;
    }

    const method = req.method === "HEAD" ? "HEAD" : "GET";

    let tmpPath: string | null = null;
    let writeStream: fs.WriteStream | null = null;
    let cdnEnded = false;
    let settled = false;

    const cleanupTmp = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (writeStream !== null && !writeStream.destroyed) {
        writeStream.destroy();
      }
      writeStream = null;
      if (tmpPath === null) {
        return;
      }
      const toRemove = tmpPath;
      tmpPath = null;
      fs.unlink(toRemove, (unlinkErr) => {
        if (unlinkErr !== null && unlinkErr.code !== "ENOENT") {
          log.error("[VideoProxy] failed to remove tmp cache", unlinkErr);
        }
      });
    };

    const cdnReq = https.request(
      targetUrl,
      { method, headers: proxyHeaders },
      (cdnRes) => {
        const statusCode = cdnRes.statusCode ?? 200;
        const isOkStatus = statusCode === 200 || statusCode === 206;
        const shouldCache =
          method === "GET" && req.headers.range === undefined && statusCode === 200;
        if (!isOkStatus) {
          cdnRes.resume();
          if (!res.headersSent) {
            res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Bad Gateway");
          }
          return;
        }
        if (res.headersSent) {
          cdnRes.resume();
          return;
        }
        if (res.destroyed) {
          cdnRes.destroy();
          return;
        }
        if (res.writableFinished) {
          cdnRes.destroy();
          return;
        }

        const outHeaders: http.OutgoingHttpHeaders = {
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store",
        };
        const ct = forwardNumberHeader(cdnRes.headers["content-type"]);
        if (ct !== undefined) {
          outHeaders["Content-Type"] = ct;
        } else {
          outHeaders["Content-Type"] = VIDEO_CONTENT_TYPE;
        }
        const cl = forwardNumberHeader(cdnRes.headers["content-length"]);
        if (cl !== undefined) {
          outHeaders["Content-Length"] = cl;
        }
        const cr = forwardNumberHeader(cdnRes.headers["content-range"]);
        if (cr !== undefined) {
          outHeaders["Content-Range"] = cr;
        }

        if (req.method === "HEAD") {
          cdnRes.resume();
          res.writeHead(statusCode, outHeaders);
          res.end();
          return;
        }

        if (!shouldCache) {
          res.writeHead(statusCode, outHeaders);
          cdnRes.pipe(res);
          return;
        }

        if (res.destroyed) {
          cdnRes.destroy();
          return;
        }
        if (res.writableFinished) {
          cdnRes.destroy();
          return;
        }

        res.writeHead(statusCode, outHeaders);
        const pass = new PassThrough();
        cdnRes.pipe(pass);
        pass.pipe(res);

        tmpPath = `${cachePath}${CACHE_TMP_MARKER}${crypto.randomUUID()}`;
        writeStream = fs.createWriteStream(tmpPath);
        pass.pipe(writeStream);

        cdnRes.on("end", () => {
          cdnEnded = true;
        });

        cdnRes.on("close", () => {
          // destroy() often emits close without error — treat incomplete close as abort
          if (!cdnEnded) {
            cleanupTmp();
          }
        });

        cdnRes.on("error", (err) => {
          log.error("[VideoProxy] CDN body error during cache", err);
          cleanupTmp();
        });

        writeStream.on("error", (err) => {
          log.error("[VideoProxy] cache write failed", err);
          cleanupTmp();
        });

        writeStream.on("finish", () => {
          if (settled) {
            return;
          }
          if (!cdnEnded) {
            cleanupTmp();
            return;
          }
          const fromPath = tmpPath;
          if (fromPath === null) {
            return;
          }
          try {
            fs.renameSync(fromPath, cachePath);
            settled = true;
            tmpPath = null;
            writeStream = null;
          } catch (err) {
            log.error("[VideoProxy] cache rename failed", err);
            cleanupTmp();
          }
        });
      },
    );

    cdnReq.on("error", (err) => {
      log.error("[VideoProxy] CDN request failed:", err.message);
      cleanupTmp();
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Proxy error");
      }
    });

    req.on("close", () => {
      // Normal completion also emits close — only treat as abort while the
      // response to the client is still open (viewer closed mid-stream).
      if (res.writableEnded || res.writableFinished) {
        return;
      }
      cdnReq.destroy();
      cleanupTmp();
    });

    cdnReq.end();
  }
}
