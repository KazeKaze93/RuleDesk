import type { DownloadFailureCode } from "../types/download";

const DISK_ERRNO_CODES = new Set([
  "ENOSPC",
  "EACCES",
  "EPERM",
  "EROFS",
  "EIO",
  "ENOENT",
  "EEXIST",
  "EISDIR",
]);

const NETWORK_ERRNO_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNRESET",
  "ECONNREFUSED",
  "ECONNABORTED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "ERR_NETWORK",
  "ERR_INTERNET_DISCONNECTED",
]);

const TIMEOUT_ERRNO_CODES = new Set([
  "ETIMEDOUT",
  "ESOCKETTIMEDOUT",
  "ERR_CANCELED",
]);

function readErrnoCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) {
    return undefined;
  }
  if (!("code" in err)) {
    return undefined;
  }
  const code = err.code;
  return typeof code === "string" ? code : undefined;
}

function readHttpStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) {
    return undefined;
  }
  if (!("response" in err)) {
    return undefined;
  }
  const response = err.response;
  if (typeof response !== "object" || response === null) {
    return undefined;
  }
  if (!("status" in response)) {
    return undefined;
  }
  const status = response.status;
  return typeof status === "number" ? status : undefined;
}

function isAbortLike(err: unknown): boolean {
  if (typeof err !== "object" || err === null) {
    return false;
  }
  if ("name" in err && err.name === "AbortError") {
    return true;
  }
  if ("name" in err && err.name === "CanceledError") {
    return true;
  }
  const code = readErrnoCode(err);
  if (code === "ERR_CANCELED") {
    return true;
  }
  if ("message" in err && typeof err.message === "string") {
    const msg = err.message.toLowerCase();
    if (msg.includes("aborted") || msg.includes("canceled") || msg.includes("cancelled")) {
      return true;
    }
  }
  return false;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export type ClassifiedDownloadFailure = {
  code: DownloadFailureCode;
  httpStatus?: number;
  message: string;
};

/**
 * Maps thrown download errors to stable failure codes for UI + logging.
 * Pure: no I/O. Used by the download worker and unit tests.
 */
export function classifyDownloadFailure(
  err: unknown,
  options?: { aborted?: boolean; idleTimedOut?: boolean }
): ClassifiedDownloadFailure {
  const message = messageOf(err);

  if (options?.aborted) {
    return { code: "CANCELLED", message: message || "Download canceled" };
  }
  if (options?.idleTimedOut) {
    return { code: "TIMEOUT", message: message || "Download idle timeout" };
  }

  const httpStatus = readHttpStatus(err);
  if (httpStatus === 403) {
    return { code: "HTTP_403", httpStatus, message };
  }
  if (httpStatus === 404) {
    return { code: "HTTP_404", httpStatus, message };
  }
  if (httpStatus === 429) {
    return { code: "HTTP_429", httpStatus, message };
  }
  if (typeof httpStatus === "number" && httpStatus >= 400) {
    return { code: "HTTP_OTHER", httpStatus, message };
  }

  const errno = readErrnoCode(err);
  if (errno && DISK_ERRNO_CODES.has(errno)) {
    return { code: "DISK", message };
  }
  if (errno && TIMEOUT_ERRNO_CODES.has(errno) && !isAbortLike(err)) {
    return { code: "TIMEOUT", message };
  }
  if (errno === "ECONNABORTED" || message.toLowerCase().includes("timeout")) {
    return { code: "TIMEOUT", message };
  }
  if (errno && NETWORK_ERRNO_CODES.has(errno)) {
    return { code: "NETWORK", message };
  }

  if (isAbortLike(err)) {
    return { code: "CANCELLED", message: message || "Download canceled" };
  }

  return { code: "NETWORK", message };
}

export function isRetryableDownloadFailure(code: DownloadFailureCode): boolean {
  return code === "HTTP_429";
}

/** Resume queue: drop items already completed by filename id (concurrency-safe). */
export function remainingDownloadItems<T extends { filename: string }>(
  items: readonly T[],
  completedIds: readonly string[]
): T[] {
  const done = new Set(completedIds);
  return items.filter((item) => !done.has(item.filename));
}

/** Exponential backoff delay for 429 attempt index (0-based). */
export function download429BackoffMs(
  attemptIndex: number,
  baseDelayMs: number
): number {
  return baseDelayMs * 2 ** attemptIndex;
}

/**
 * Pause duration for a global 429 gate: max(exponential backoff, Retry-After).
 */
export function download429PauseMs(params: {
  attemptIndex: number;
  baseDelayMs: number;
  retryAfterMs?: number;
}): number {
  const backoff = download429BackoffMs(params.attemptIndex, params.baseDelayMs);
  const retryAfter = params.retryAfterMs ?? 0;
  return Math.max(backoff, retryAfter);
}

/**
 * Parse HTTP Retry-After (delta-seconds or HTTP-date) into milliseconds.
 * Returns undefined when absent or unusable.
 */
export function parseRetryAfterMs(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) {
    return undefined;
  }
  if (!("response" in err)) {
    return undefined;
  }
  const response = err.response;
  if (typeof response !== "object" || response === null) {
    return undefined;
  }
  if (!("headers" in response)) {
    return undefined;
  }
  const headers = response.headers;
  if (typeof headers !== "object" || headers === null) {
    return undefined;
  }

  let raw: unknown;
  if ("retry-after" in headers) {
    raw = headers["retry-after"];
  } else if ("Retry-After" in headers) {
    raw = headers["Retry-After"];
  } else {
    return undefined;
  }

  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }
  const text = String(value).trim();
  if (text.length === 0) {
    return undefined;
  }

  const asSeconds = Number(text);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.ceil(asSeconds * 1000);
  }

  const asDate = Date.parse(text);
  if (Number.isNaN(asDate)) {
    return undefined;
  }
  const delta = asDate - Date.now();
  return delta > 0 ? delta : 0;
}

/** Human-readable label for toast / expandable lists (English UI). */
export function downloadFailureCodeLabel(code: DownloadFailureCode): string {
  switch (code) {
    case "NETWORK":
      return "Network error";
    case "TIMEOUT":
      return "Timed out";
    case "HTTP_403":
      return "Forbidden (403)";
    case "HTTP_404":
      return "Not found (404)";
    case "HTTP_429":
      return "Rate limited (429)";
    case "HTTP_OTHER":
      return "HTTP error";
    case "DISK":
      return "Disk error";
    case "CANCELLED":
      return "Canceled";
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}
