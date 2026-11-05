import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDownloadStore } from "@/store/downloadStore";

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

type DownloadApi = {
  pauseDownloadAll: ReturnType<typeof vi.fn>;
  resumeDownloadAll: ReturnType<typeof vi.fn>;
  cancelDownloadAll: ReturnType<typeof vi.fn>;
};

function installDownloadApi(overrides?: Partial<DownloadApi>): DownloadApi {
  const api: DownloadApi = {
    pauseDownloadAll: vi.fn(async () => undefined),
    resumeDownloadAll: vi.fn(async () => undefined),
    cancelDownloadAll: vi.fn(async () => undefined),
    ...overrides,
  };
  vi.stubGlobal("window", { api });
  return api;
}

describe("downloadStore", () => {
  beforeEach(() => {
    useDownloadStore.getState().resetDownload();
    installDownloadApi();
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

  it("tracks pause after IPC success and clears everything on reset", async () => {
    const api = installDownloadApi();
    useDownloadStore.getState().startDownload({ total: 4 });
    useDownloadStore.getState().setProgress(1, 4);
    useDownloadStore.getState().pauseDownload();

    await vi.waitFor(() => {
      expect(useDownloadStore.getState().isPaused).toBe(true);
    });
    expect(api.pauseDownloadAll).toHaveBeenCalledTimes(1);

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

  it("does not change isPaused when pauseDownloadAll rejects", async () => {
    const api = installDownloadApi({
      pauseDownloadAll: vi.fn(async () => {
        throw new Error("pause failed");
      }),
    });

    useDownloadStore.getState().startDownload({ total: 3 });
    useDownloadStore.getState().pauseDownload();

    await vi.waitFor(() => {
      expect(api.pauseDownloadAll).toHaveBeenCalledTimes(1);
    });
    expect(useDownloadStore.getState().isPaused).toBe(false);
  });

  it("does not clear isPaused when resumeDownloadAll rejects", async () => {
    const api = installDownloadApi({
      resumeDownloadAll: vi.fn(async () => {
        throw new Error("resume failed");
      }),
    });

    useDownloadStore.getState().startDownload({ total: 3 });
    useDownloadStore.getState().pauseDownload();
    await vi.waitFor(() => {
      expect(useDownloadStore.getState().isPaused).toBe(true);
    });

    useDownloadStore.getState().resumeDownload();
    await vi.waitFor(() => {
      expect(api.resumeDownloadAll).toHaveBeenCalledTimes(1);
    });
    expect(useDownloadStore.getState().isPaused).toBe(true);
  });

  it("cancelDownload calls cancelDownloadAll without flipping isPaused", async () => {
    const api = installDownloadApi();
    useDownloadStore.getState().startDownload({ total: 2 });
    useDownloadStore.getState().pauseDownload();
    await vi.waitFor(() => {
      expect(useDownloadStore.getState().isPaused).toBe(true);
    });

    useDownloadStore.getState().cancelDownload();
    await vi.waitFor(() => {
      expect(api.cancelDownloadAll).toHaveBeenCalledTimes(1);
    });
    expect(useDownloadStore.getState().isPaused).toBe(true);
  });
});
