import { create } from "zustand";
import log from "electron-log/renderer";

export type DownloadProgress = {
  done: number;
  total: number;
};

export type StartDownloadOptions = {
  done?: number;
  total?: number;
};

const EMPTY_PROGRESS: DownloadProgress = { done: 0, total: 0 };
const LOG_PREFIX = "[downloadStore]";

/** Global mass-download state — progress, pause, and active flag for UI + mutual exclusion. */
interface DownloadState {
  isDownloading: boolean;
  isPaused: boolean;
  progress: DownloadProgress;
  /** Begin a mass-download batch; optionally seed counters (e.g. pending resume). */
  startDownload: (options?: StartDownloadOptions) => void;
  /** Apply IPC progress while a batch is active; ignored when idle. */
  setProgress: (done: number, total: number) => void;
  /** Clear active/paused/progress after a batch ends. */
  resetDownload: () => void;
  /**
   * Compatibility for callers that only flip the active flag
   * (PendingDownloadBanner, BulkActionBar). Prefer startDownload/resetDownload.
   */
  setDownloading: (value: boolean) => void;
  /** Pause via IPC; sets isPaused only after success. */
  pauseDownload: () => void;
  /** Resume via IPC; clears isPaused only after success. */
  resumeDownload: () => void;
  /** Cancel via IPC; does not flip isPaused on its own. */
  cancelDownload: () => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  isDownloading: false,
  isPaused: false,
  progress: EMPTY_PROGRESS,
  startDownload: (options) =>
    set({
      isDownloading: true,
      isPaused: false,
      progress: {
        done: options?.done ?? 0,
        total: options?.total ?? 0,
      },
    }),
  setProgress: (done, total) =>
    set((state) =>
      state.isDownloading ? { progress: { done, total } } : state
    ),
  resetDownload: () =>
    set({
      isDownloading: false,
      isPaused: false,
      progress: EMPTY_PROGRESS,
    }),
  setDownloading: (value) => {
    if (value) {
      set({
        isDownloading: true,
        isPaused: false,
        progress: EMPTY_PROGRESS,
      });
      return;
    }
    set({
      isDownloading: false,
      isPaused: false,
      progress: EMPTY_PROGRESS,
    });
  },
  pauseDownload: () => {
    void window.api
      .pauseDownloadAll()
      .then(() => {
        set({ isPaused: true });
      })
      .catch((error: unknown) => {
        log.error(`${LOG_PREFIX} pauseDownloadAll failed:`, error);
      });
  },
  resumeDownload: () => {
    void window.api
      .resumeDownloadAll()
      .then(() => {
        set({ isPaused: false });
      })
      .catch((error: unknown) => {
        log.error(`${LOG_PREFIX} resumeDownloadAll failed:`, error);
      });
  },
  cancelDownload: () => {
    void window.api.cancelDownloadAll().catch((error: unknown) => {
      log.error(`${LOG_PREFIX} cancelDownloadAll failed:`, error);
    });
  },
}));
