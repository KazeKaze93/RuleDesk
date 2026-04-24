import https from "node:https";
import log from "electron-log";
import {
  RULE34_CDN_HOSTS,
  CDN_PROBE_TIMEOUT_MS,
  CDN_SLOW_THRESHOLD_MS,
  CDN_MAX_FAILURES_BEFORE_REPROBE,
  CDN_PROBE_PATH,
} from "../../shared/constants/cdn";

interface ProbeResult {
  host: string;
  ttfbMs: number;
  ok: boolean;
}

function isRule34CdnHost(hostname: string): boolean {
  return RULE34_CDN_HOSTS.some((host) => host === hostname);
}

export class CdnSelectorService {
  private selectedHost: string = RULE34_CDN_HOSTS[0];
  private failureCount = 0;
  private isProbing = false;

  async probe(): Promise<void> {
    if (this.isProbing) {
      return;
    }

    this.isProbing = true;
    try {
      const results = await Promise.allSettled(
        RULE34_CDN_HOSTS.map((host) => this.measureTtfb(host))
      );

      const successful = results
        .filter(
          (result): result is PromiseFulfilledResult<ProbeResult> =>
            result.status === "fulfilled" && result.value.ok
        )
        .map((result) => result.value)
        .sort((a, b) => a.ttfbMs - b.ttfbMs);

      if (successful.length === 0) {
        log.warn("[CdnSelector] All CDN hosts unreachable, keeping default");
        return;
      }

      const fastest = successful[0];
      this.selectedHost = fastest.host;
      log.info(
        `[CdnSelector] Selected CDN: ${this.selectedHost} (${fastest.ttfbMs}ms)`
      );
      log.info(
        `[CdnSelector] All results: ${successful
          .map((result) => `${result.host}=${result.ttfbMs}ms`)
          .join(", ")}`
      );
    } finally {
      this.isProbing = false;
    }
  }

  rewriteUrl(originalUrl: string): string {
    if (!originalUrl) {
      return originalUrl;
    }

    try {
      const url = new URL(originalUrl);
      if (!isRule34CdnHost(url.hostname)) {
        return originalUrl;
      }
      url.hostname = this.selectedHost;
      return url.toString();
    } catch {
      return originalUrl;
    }
  }

  reportSuccess(): void {
    this.failureCount = 0;
  }

  reportFailure(): void {
    this.failureCount += 1;
    if (this.failureCount >= CDN_MAX_FAILURES_BEFORE_REPROBE) {
      log.warn(`[CdnSelector] ${this.failureCount} failures, re-probing CDN`);
      this.failureCount = 0;
      this.probe().catch((error: unknown) => {
        log.error("[CdnSelector] Re-probe failed:", error);
      });
    }
  }

  reportSlowRequest(ttfbMs: number): void {
    if (ttfbMs > CDN_SLOW_THRESHOLD_MS) {
      log.warn(`[CdnSelector] Slow CDN response (${ttfbMs}ms), re-probing`);
      this.probe().catch((error: unknown) => {
        log.error("[CdnSelector] Re-probe failed:", error);
      });
    }
  }

  private measureTtfb(host: string): Promise<ProbeResult> {
    return new Promise((resolve) => {
      const start = Date.now();
      const timeout = setTimeout(() => {
        resolve({ host, ttfbMs: CDN_PROBE_TIMEOUT_MS, ok: false });
      }, CDN_PROBE_TIMEOUT_MS);

      const req = https.request(
        {
          hostname: host,
          path: CDN_PROBE_PATH,
          method: "HEAD",
          headers: { "User-Agent": "Mozilla/5.0" },
        },
        (res) => {
          clearTimeout(timeout);
          const ttfbMs = Date.now() - start;
          res.resume();
          resolve({ host, ttfbMs, ok: (res.statusCode ?? 0) < 500 });
        }
      );

      req.on("error", () => {
        clearTimeout(timeout);
        resolve({ host, ttfbMs: CDN_PROBE_TIMEOUT_MS, ok: false });
      });

      req.end();
    });
  }
}

export const cdnSelector = new CdnSelectorService();
