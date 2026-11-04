import type { PostFilterRequest } from "../schemas/post";

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
  /**
   * Present when a list request exceeded the safety cap and was rejected
   * (or historically truncated). Prefer surfacing via `error` for rejects.
   */
  truncatedFrom?: number;
  /** Setup-level failure (spawn, missing window, over-limit list) — not a per-item code. */
  error?: string;
};

export type DownloadQueueItem = { url: string; filename: string };

/** Legacy queue written by older workers (full item list + completed filenames). */
export type DownloadQueueFileV2 = {
  version: 2;
  items: DownloadQueueItem[];
  /** Filenames finished successfully (downloaded or skipped as duplicate). */
  completedIds: string[];
  total: number;
  folder: string;
  timestamp: number;
};

/** Shared cursor fields for artist / favorites mass-download queue files. */
type DownloadQueueFileV3CursorFields = {
  version: 3;
  filters?: PostFilterRequest;
  /** Last posts.id of a fully finished chunk; 0 = start. */
  cursorId: number;
  upperBoundId: number;
  /** Filenames completed inside the current (incomplete) chunk. */
  chunkCompletedIds: string[];
  /** Cumulative completed count for progress (skips + downloads). */
  doneCount: number;
  folder: string;
  total: number;
  timestamp: number;
};

/** Artist mass-download: cursor over posts.id, no full item list in the file. */
export type DownloadQueueFileV3Artist = DownloadQueueFileV3CursorFields & {
  kind: "artist";
  artistId: number;
};

/**
 * Favorites mass-download: same cursor contract as artist, no artistId.
 * Older queues without this kind are artist-only (or V2→list).
 */
export type DownloadQueueFileV3Favorites = DownloadQueueFileV3CursorFields & {
  kind: "favorites";
};

/** List mass-download: explicit items + completed filenames. */
export type DownloadQueueFileV3List = {
  version: 3;
  kind: "list";
  items: DownloadQueueItem[];
  completedIds: string[];
  folder: string;
  total: number;
  timestamp: number;
};

/** Cursor-based queue targets (artist + favorites). */
export type DownloadQueueFileV3Cursor =
  | DownloadQueueFileV3Artist
  | DownloadQueueFileV3Favorites;

export type DownloadQueueFileV3 =
  | DownloadQueueFileV3Cursor
  | DownloadQueueFileV3List;

export type DownloadQueueFile = DownloadQueueFileV2 | DownloadQueueFileV3;

/** Shape returned by `getPendingDownload` for the resume banner. */
export type PendingDownloadInfo = {
  hasPending: boolean;
  total: number;
  done: number;
  folder: string;
  /** Discriminator for banner copy; mirrors queue `kind`. */
  kind: DownloadQueueFileV3["kind"];
};
