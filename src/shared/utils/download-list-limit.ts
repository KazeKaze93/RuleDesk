import { BATCH_DOWNLOAD_LIST_MAX_FILES } from "../constants";
import type { DownloadAllResult } from "../types/download";

/** Typed IPC result when kind:"list" exceeds the safety cap (never thrown). */
export function buildListOverLimitResult(itemCount: number): DownloadAllResult {
  return {
    success: false,
    downloaded: 0,
    failed: [],
    canceled: false,
    truncatedFrom: itemCount,
    error: `Too many items (${itemCount}). Maximum is ${BATCH_DOWNLOAD_LIST_MAX_FILES}.`,
  };
}

export function isListOverLimit(itemCount: number): boolean {
  return itemCount > BATCH_DOWNLOAD_LIST_MAX_FILES;
}
