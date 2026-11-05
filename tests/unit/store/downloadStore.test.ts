import { beforeEach, describe, expect, it } from "vitest";
import { useDownloadStore } from "@/store/downloadStore";

describe("downloadStore", () => {
  beforeEach(() => {
    useDownloadStore.getState().resetDownload();
  });

  it("starts a batch with optional seeded progress", () => {
    useDownloadStore.getState().startDownload({ done: 3, total: 10 });

    const state = useDownloadStore.getState();
    expect(state.isDownloading).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.progress).toEqual({ done: 3, total: 10 });
  });

  it("updates progress only while downloading", () => {
    useDownloadStore.getState().setProgress(1, 5);
    expect(useDownloadStore.getState().progress).toEqual({ done: 0, total: 0 });

    useDownloadStore.getState().startDownload({ total: 5 });
    useDownloadStore.getState().setProgress(2, 5);
    expect(useDownloadStore.getState().progress).toEqual({ done: 2, total: 5 });
  });

  it("tracks pause and clears everything on reset", () => {
    useDownloadStore.getState().startDownload({ total: 4 });
    useDownloadStore.getState().setProgress(1, 4);
    useDownloadStore.getState().setPaused(true);

    expect(useDownloadStore.getState().isPaused).toBe(true);

    useDownloadStore.getState().resetDownload();

    const state = useDownloadStore.getState();
    expect(state.isDownloading).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.progress).toEqual({ done: 0, total: 0 });
  });

  it("setDownloading(true/false) mirrors start/reset without seed", () => {
    useDownloadStore.getState().setDownloading(true);
    expect(useDownloadStore.getState().isDownloading).toBe(true);
    expect(useDownloadStore.getState().progress).toEqual({ done: 0, total: 0 });

    useDownloadStore.getState().setDownloading(false);
    expect(useDownloadStore.getState().isDownloading).toBe(false);
  });
});
