import { create } from "zustand";

export type DownloadProgress = {
  done: number;
  total: number;
};

export type StartDownloadOptions = {
  done?: number;
  total?: number;
};

const EMPTY_PROGRESS: DownloadProgress = { done: 0, total: 0 };

/** Global mass-download state — progress, pause, and active flag for UI + mutual exclusion. */
interface DownloadState {
  isDownloading: boolean;
  isPaused: boolean;
  progress: DownloadProgress;
  /** Begin a mass-download batch; optionally seed counters (e.g. pending resume). */
  startDownload: (options?: StartDownloadOptions) => void;
  /** Apply IPC progress while a batch is active; ignored when idle. */
  setProgress: (done: number, total: number) => void;
  setPaused: (paused: boolean) => void;
  /** Clear active/paused/progress after a batch ends. */
  resetDownload: () => void;
  /**
   * Compatibility for callers that only flip the active flag
   * (PendingDownloadBanner, BulkActionBar). Prefer startDownload/resetDownload.
   */
  setDownloading: (value: boolean) => void;
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
  setPaused: (paused) => set({ isPaused: paused }),
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
}));
