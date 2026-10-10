export const DOWNLOAD_FAILURE_CODES = [
  "NETWORK",
  "TIMEOUT",
  "HTTP_403",
  "HTTP_404",
  "HTTP_429",
  "HTTP_OTHER",
  "DISK",
  "CANCELLED",
] as const;

export type DownloadFailureCode = (typeof DOWNLOAD_FAILURE_CODES)[number];

export type DownloadFailure = {
  itemId: string;
  code: DownloadFailureCode;
  httpStatus?: number;
  message: string;
};

export type DownloadAllResult = {
  success: boolean;
  downloaded: number;
  failed: DownloadFailure[];
  canceled: boolean;
  /** Present when the request had more items than BATCH_DOWNLOAD_MAX_FILES and was capped. */
  truncatedFrom?: number;
  /** Setup-level failure (spawn, missing window) — not a per-item code. */
  error?: string;
};

export type DownloadQueueFileV2 = {
  version: 2;
  items: Array<{ url: string; filename: string }>;
  /** Filenames finished successfully (downloaded or skipped as duplicate). */
  completedIds: string[];
  total: number;
  folder: string;
  timestamp: number;
};
