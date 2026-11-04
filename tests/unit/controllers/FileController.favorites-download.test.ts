import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DownloadAllRequest } from "../../../src/shared/schemas/download";
import type {
  DownloadAllResult,
  DownloadQueueFileV3Favorites,
  PendingDownloadInfo,
} from "../../../src/shared/types/download";
import type { MassDownloadTarget } from "../../../src/main/ipc/controllers/PostsController";
import type { IpcMainInvokeEvent } from "electron";
import { favoritesQueueInitial } from "../../../src/main/lib/download-queue-file";

const readFileMock = vi.fn();
const unlinkMock = vi.fn();
const writeFileAtomicMock = vi.fn();

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
    getAllWindows: () => [
      {
        isDestroyed: () => false,
        isVisible: () => true,
        webContents: { send: vi.fn() },
      },
    ],
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
  readFile: (...args: unknown[]) => readFileMock(...args),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  unlink: (...args: unknown[]) => unlinkMock(...args),
  realpath: vi.fn(async (p: string) => p),
}));

vi.mock("../../../src/main/lib/atomic-write", () => ({
  writeFileAtomic: (...args: unknown[]) => writeFileAtomicMock(...args),
  waitForAtomicWriteIdle: vi.fn().mockResolvedValue(undefined),
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
  getPendingDownload: () => Promise<PendingDownloadInfo | null>;
  resumePendingDownload: (
    event: IpcMainInvokeEvent
  ) => Promise<DownloadAllResult>;
  deleteQueueFile: () => Promise<void>;
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

function favoritesPendingQueue(
  overrides: Partial<DownloadQueueFileV3Favorites> = {}
): DownloadQueueFileV3Favorites {
  return {
    ...favoritesQueueInitial({
      filters: { mediaType: "images" },
      upperBoundId: 500,
      total: 40,
      folder: "/tmp/dl",
    }),
    cursorId: 120,
    doneCount: 12,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("FileController favorites download branch", () => {
  let controller: FileControllerInternals;
  const event = {} as IpcMainInvokeEvent;

  beforeEach(() => {
    readFileMock.mockReset();
    unlinkMock.mockReset();
    writeFileAtomicMock.mockReset();
    readFileMock.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" })
    );
    unlinkMock.mockResolvedValue(undefined);
    writeFileAtomicMock.mockResolvedValue(undefined);
    // boundary: test seam for private downloadAll / pending helpers
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

  it("persists a favorites queue file when a favorites mass-download starts", async () => {
    const snapshotMassDownload = vi.fn(() => ({
      upperBoundId: 900,
      total: 3,
    }));
    // Empty first chunk ends the loop immediately after queue write.
    const fetchMassDownloadChunk = vi.fn(() => []);
    controller.setPostsController({
      snapshotMassDownload,
      fetchMassDownloadChunk,
    });

    await controller.downloadAll({
      kind: "favorites",
      filters: { aiFilter: "hide" },
    });

    expect(writeFileAtomicMock).toHaveBeenCalled();
    const writtenRaw = writeFileAtomicMock.mock.calls[0]?.[1];
    expect(typeof writtenRaw).toBe("string");
    if (typeof writtenRaw !== "string") {
      return;
    }
    const written: unknown = JSON.parse(writtenRaw);
    expect(written).toMatchObject({
      version: 3,
      kind: "favorites",
      cursorId: 0,
      upperBoundId: 900,
      total: 3,
      filters: { aiFilter: "hide" },
    });
  });

  it("getPendingDownload reports favorites kind from the queue file", async () => {
    const queue = favoritesPendingQueue();
    readFileMock.mockResolvedValue(JSON.stringify(queue));

    const pending = await controller.getPendingDownload();
    expect(pending).toEqual({
      hasPending: true,
      total: 40,
      done: 12,
      folder: "/tmp/dl",
      kind: "favorites",
    });
  });

  it("resumePendingDownload continues favorites from saved cursor and upperBound", async () => {
    const queue = favoritesPendingQueue({
      cursorId: 120,
      upperBoundId: 500,
      filters: { mediaType: "images" },
    });
    readFileMock.mockResolvedValue(JSON.stringify(queue));

    const fetchMassDownloadChunk = vi.fn(() => []);
    controller.setPostsController({
      snapshotMassDownload: vi.fn(() => ({ upperBoundId: 500, total: 40 })),
      fetchMassDownloadChunk,
    });

    await controller.resumePendingDownload(event);

    expect(fetchMassDownloadChunk).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { kind: "favorites", filters: { mediaType: "images" } },
        cursorId: 120,
        upperBoundId: 500,
      })
    );
  });

  it("dismissPendingDownload deletes the queue file", async () => {
    unlinkMock.mockResolvedValue(undefined);
    await controller.deleteQueueFile();
    expect(unlinkMock).toHaveBeenCalled();
  });
});
