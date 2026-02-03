import { create } from "zustand";

/** Global download state - used to hide PendingDownloadBanner and prevent double-download during active batch */
interface DownloadState {
  isDownloading: boolean;
  setDownloading: (value: boolean) => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  isDownloading: false,
  setDownloading: (value) => set({ isDownloading: value }),
}));
