import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DownloadAllRequest } from "../../../src/shared/schemas/download";
import type { DownloadAllResult } from "../../../src/shared/types/download";
import type { MassDownloadTarget } from "../../../src/main/ipc/controllers/PostsController";

vi.mock("electron", () => ({
  app: {
    getPath: (name: string) =>
      name === "userData" ? "/tmp/ruledesk-test" : "/tmp",
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: {
    getAllWindows: () => [],
  },
  shell: { showItemInFolder: vi.fn() },
  dialog: { showOpenDialog: vi.fn() },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    transports: {
      main: { level: false },
      file: { level: false, resolvePathFn: vi.fn() },
      console: { level: false },
      renderer: { level: false },
      ipc: {},
    },
    errorHandler: { startCatching: vi.fn() },
  },
}));

vi.mock("fs/promises", () => ({
  access: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" })),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  realpath: vi.fn(async (p: string) => p),
}));

vi.mock("../../../src/main/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => ({
            get: () => undefined,
          }),
        }),
      }),
    }),
  }),
  getSqliteInstance: () => ({}),
}));

import { FileController } from "../../../src/main/ipc/controllers/FileController";

type FileControllerInternals = {
  downloadAll: (request: DownloadAllRequest) => Promise<DownloadAllResult>;
  setPostsController: (posts: {
    snapshotMassDownload: (target: MassDownloadTarget) => {
      upperBoundId: number;
      total: number;
    };
    fetchMassDownloadChunk: (params: {
      target: MassDownloadTarget;
      cursorId: number;
      upperBoundId: number;
      limit?: number;
    }) => Array<{ id: number; url: string; filename: string }>;
  }) => void;
};

describe("FileController favorites download branch", () => {
  let controller: FileControllerInternals;

  beforeEach(() => {
    // boundary: test seam for private downloadAll
    controller = new FileController() as unknown as FileControllerInternals;
  });

  it("routes kind favorites through snapshotMassDownload and returns empty when none", async () => {
    const snapshotMassDownload = vi.fn(() => ({
      upperBoundId: 0,
      total: 0,
    }));
    const fetchMassDownloadChunk = vi.fn();
    controller.setPostsController({
      snapshotMassDownload,
      fetchMassDownloadChunk,
    });

    const result = await controller.downloadAll({
      kind: "favorites",
      filters: { mediaType: "images" },
    });

    expect(result).toEqual({
      success: true,
      downloaded: 0,
      failed: [],
      canceled: false,
    });
    expect(snapshotMassDownload).toHaveBeenCalledWith({
      kind: "favorites",
      filters: { mediaType: "images" },
    });
    expect(fetchMassDownloadChunk).not.toHaveBeenCalled();
  });

  it("keeps artist kind on the artist snapshot path", async () => {
    const snapshotMassDownload = vi.fn(() => ({
      upperBoundId: 0,
      total: 0,
    }));
    controller.setPostsController({
      snapshotMassDownload,
      fetchMassDownloadChunk: vi.fn(),
    });

    const result = await controller.downloadAll({
      kind: "artist",
      artistId: 42,
      filters: undefined,
    });

    expect(result).toEqual({
      success: true,
      downloaded: 0,
      failed: [],
      canceled: false,
    });
    expect(snapshotMassDownload).toHaveBeenCalledWith({
      kind: "artist",
      artistId: 42,
      filters: undefined,
    });
  });
});
