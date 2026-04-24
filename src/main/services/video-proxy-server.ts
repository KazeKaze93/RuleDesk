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

const VIDEO_PATH = "/video";
const PROXY_HOST = "127.0.0.1";
const GELBOORU_IMG_HOSTS = new Set<string>(["img2.gelbooru.com", "img3.gelbooru.com", "img4.gelbooru.com"]);

const VIDEO_CONTENT_TYPE = "video/mp4";

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
  if (GELBOORU_IMG_HOSTS.has(host)) {
    return true;
  }
  if (host === "rule34.xxx" || host.endsWith(".rule34.xxx")) {
    return true;
  }
  return false;
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

export class VideoProxyServer {
  private server: http.Server | null = null;
  private port = 0;
  private readonly cacheDir: string;

  constructor() {
    this.cacheDir = path.join(app.getPath("userData"), "video-cache");
  }

  getListenPort(): number {
    return this.port;
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
        resolve(this.port);
      });
    });
  }

  stop(): void {
    this.server?.close();
    this.server = null;
    this.port = 0;
    log.info("[VideoProxy] Stopped");
  }

  getProxyUrl(fileUrl: string): string {
    return `http://${PROXY_HOST}:${this.port}${VIDEO_PATH}?url=${encodeURIComponent(fileUrl)}`;
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
    const cachePath = path.join(this.cacheDir, `${cacheKey}.bin`);

    if (fs.existsSync(cachePath)) {
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

        const writeStream = fs.createWriteStream(cachePath);
        pass.pipe(writeStream);

        writeStream.on("error", (err) => {
          log.error("[VideoProxy] cache write failed", err);
          fs.unlink(cachePath, (unlinkErr) => {
            if (unlinkErr) {
              log.error("[VideoProxy] failed to remove partial cache", unlinkErr);
            }
          });
        });

        cdnRes.on("error", (err) => {
          log.error("[VideoProxy] CDN body error during cache", err);
          fs.unlink(cachePath, (unlinkErr) => {
            if (unlinkErr) {
              log.error("[VideoProxy] failed to remove partial cache", unlinkErr);
            }
          });
        });
      },
    );

    cdnReq.on("error", (err) => {
      log.error("[VideoProxy] CDN request failed:", err.message);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Proxy error");
      }
    });

    req.on("close", () => {
      cdnReq.destroy();
    });

    cdnReq.end();
  }
}
