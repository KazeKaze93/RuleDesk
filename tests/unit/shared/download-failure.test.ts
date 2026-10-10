import { describe, expect, it } from "vitest";
import {
  classifyDownloadFailure,
  download429BackoffMs,
  isRetryableDownloadFailure,
  remainingDownloadItems,
} from "@shared/utils/download-failure";

describe("classifyDownloadFailure", () => {
  it("maps HTTP status codes", () => {
    expect(
      classifyDownloadFailure({
        response: { status: 403 },
        message: "Forbidden",
      }).code
    ).toBe("HTTP_403");
    expect(
      classifyDownloadFailure({
        response: { status: 404 },
        message: "Missing",
      }).code
    ).toBe("HTTP_404");
    expect(
      classifyDownloadFailure({
        response: { status: 429 },
        message: "Slow down",
      }).code
    ).toBe("HTTP_429");
    expect(
      classifyDownloadFailure({
        response: { status: 500 },
        message: "Boom",
      }).code
    ).toBe("HTTP_OTHER");
  });

  it("maps network and disk errno codes", () => {
    expect(classifyDownloadFailure({ code: "ENOTFOUND", message: "dns" }).code).toBe(
      "NETWORK"
    );
    expect(classifyDownloadFailure({ code: "ENOSPC", message: "full" }).code).toBe(
      "DISK"
    );
    expect(classifyDownloadFailure({ code: "EACCES", message: "perm" }).code).toBe(
      "DISK"
    );
  });

  it("maps timeouts and aborts", () => {
    expect(
      classifyDownloadFailure({ code: "ETIMEDOUT", message: "wait" }).code
    ).toBe("TIMEOUT");
    expect(
      classifyDownloadFailure(new Error("timeout of 30000ms exceeded")).code
    ).toBe("TIMEOUT");
    expect(
      classifyDownloadFailure({ name: "AbortError", message: "aborted" }).code
    ).toBe("CANCELLED");
    expect(
      classifyDownloadFailure(new Error("x"), { aborted: true }).code
    ).toBe("CANCELLED");
    expect(
      classifyDownloadFailure(new Error("x"), { idleTimedOut: true }).code
    ).toBe("TIMEOUT");
  });
});

describe("429 retry helpers", () => {
  it("marks only HTTP_429 as retryable", () => {
    expect(isRetryableDownloadFailure("HTTP_429")).toBe(true);
    expect(isRetryableDownloadFailure("HTTP_404")).toBe(false);
    expect(isRetryableDownloadFailure("NETWORK")).toBe(false);
  });

  it("uses exponential backoff from base delay", () => {
    expect(download429BackoffMs(0, 1000)).toBe(1000);
    expect(download429BackoffMs(1, 1000)).toBe(2000);
    expect(download429BackoffMs(2, 1000)).toBe(4000);
  });

  it("pause uses max(backoff, Retry-After)", async () => {
    const { download429PauseMs, parseRetryAfterMs } = await import(
      "@shared/utils/download-failure"
    );
    expect(
      download429PauseMs({ attemptIndex: 0, baseDelayMs: 1000, retryAfterMs: 2500 })
    ).toBe(2500);
    expect(
      download429PauseMs({ attemptIndex: 2, baseDelayMs: 1000, retryAfterMs: 500 })
    ).toBe(4000);
    expect(
      parseRetryAfterMs({
        response: { status: 429, headers: { "retry-after": "3" } },
      })
    ).toBe(3000);
  });
});

describe("remainingDownloadItems", () => {
  it("filters by completed filename ids under concurrency order", () => {
    const items = [
      { filename: "1_a.jpg", url: "a" },
      { filename: "1_b.jpg", url: "b" },
      { filename: "1_c.jpg", url: "c" },
    ];
    // Completions out of order (lane 2 finished first)
    const remaining = remainingDownloadItems(items, ["1_b.jpg"]);
    expect(remaining.map((i) => i.filename)).toEqual(["1_a.jpg", "1_c.jpg"]);
  });

  it("returns empty when all ids completed", () => {
    const items = [{ filename: "x.mp4", url: "u" }];
    expect(remainingDownloadItems(items, ["x.mp4"])).toEqual([]);
  });
});
