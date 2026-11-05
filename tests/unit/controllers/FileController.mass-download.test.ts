import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DownloadAllRequest } from "../../../src/shared/schemas/download";
import type { DownloadAllResult } from "../../../src/shared/types/download";
import type { OpenDownloadFolderResult } from "../../../src/shared/schemas/download";

const {
  readFileMock,
  unlinkMock,
  writeFileAtomicMock,
  openPathMock,
  logInfoMock,
  nextCompletePayloadRef,
} = vi.hoisted(() => {
  const payload = {
    type: "complete" as const,
    success: true,
    downloaded: 0,
    failed: [] as unknown[],
    canceled: false,
    canceledCount: 0 as number | undefined,
  };
  return {
    readFileMock: vi.fn(),
    unlinkMock: vi.fn(),
    writeFileAtomicMock: vi.fn(),
    openPathMock: vi.fn(),
    logInfoMock: vi.fn(),
    nextCompletePayloadRef: { current: payload },
  };
});

type WorkerCompletePayload = {
  type: "complete";
  success: boolean;
  downloaded: number;
  failed: unknown[];
  canceled: boolean;
  canceledCount?: number;
};

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
  shell: {
    showItemInFolder: vi.fn(),
    openPath: (...args: unknown[]) => openPathMock(...args),
  },
  dialog: { showOpenDialog: vi.fn() },
}));

vi.mock("electron-log", () => ({
  default: {
    info: (...args: unknown[]) => logInfoMock(...args),
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

vi.mock("../../../src/main/providers/cdn-allowlist", () => ({
  isAllowedCdnUrl: () => true,
  DOWNLOAD_URL_NOT_ALLOWED_MESSAGE: "Download URL is not allowed.",
}));

vi.mock("worker_threads", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- mock factory needs sync EventEmitter
  const { EventEmitter } = require("node:events") as typeof import("node:events");
  class MockWorker extends EventEmitter {
    constructor(_path: string, _opts?: unknown) {
      super();
      queueMicrotask(() => {
        this.emit("message", nextCompletePayloadRef.current);
      });
    }
    postMessage(): void {
      /* no-op */
    }
    terminate(): Promise<number> {
      return Promise.resolve(0);
    }
  }
  return { Worker: MockWorker };
});

import { FileController } from "../../../src/main/ipc/controllers/FileController";

type FileControllerInternals = {
  downloadAll: (request: DownloadAllRequest) => Promise<DownloadAllResult>;
  openDownloadFolder: () => Promise<OpenDownloadFolderResult>;
};

const LIST_ITEM = {
  url: "https://img.rule34.xxx/images/1/test.jpg",
  filename: "test.jpg",
};

describe("FileController mass download silent-zero + open folder", () => {
  let controller: FileControllerInternals;

  beforeEach(() => {
    readFileMock.mockReset();
    unlinkMock.mockReset();
    writeFileAtomicMock.mockReset();
    openPathMock.mockReset();
    logInfoMock.mockReset();
    readFileMock.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" })
    );
    unlinkMock.mockResolvedValue(undefined);
    writeFileAtomicMock.mockResolvedValue(undefined);
    openPathMock.mockResolvedValue("");
    nextCompletePayloadRef.current = {
      type: "complete",
      success: true,
      downloaded: 0,
      failed: [],
      canceled: false,
      canceledCount: 0,
    };
    // boundary: test seam for private downloadAll / openDownloadFolder
    controller = new FileController() as unknown as FileControllerInternals;
  });

  it("forces success false when non-empty list ends 0/0/not-canceled", async () => {
    const result = await controller.downloadAll({
      kind: "list",
      items: [LIST_ITEM],
    });

    expect(result.success).toBe(false);
    expect(result.downloaded).toBe(0);
    expect(result.failed).toEqual([]);
    expect(result.canceled).toBe(false);
    expect(result.error).toMatch(/without processing any items/i);
  });

  it("logs mass-download start and end for a list batch", async () => {
    await controller.downloadAll({
      kind: "list",
      items: [LIST_ITEM],
    });

    expect(logInfoMock).toHaveBeenCalledWith(
      "[FileController] Mass download start",
      expect.objectContaining({
        kind: "list",
        itemCount: 1,
        duplicateFileBehavior: "skip",
      })
    );
    expect(logInfoMock).toHaveBeenCalledWith(
      "[FileController] Mass download end",
      expect.objectContaining({
        downloaded: 0,
        failed: 0,
        canceled: false,
        canceledCount: 0,
        durationMs: expect.any(Number),
      })
    );
  });

  it("defaults missing canceledCount to 0 when settling complete", async () => {
    const payload: WorkerCompletePayload = {
      type: "complete",
      success: true,
      downloaded: 1,
      failed: [],
      canceled: false,
    };
    nextCompletePayloadRef.current = payload;

    const result = await controller.downloadAll({
      kind: "list",
      items: [LIST_ITEM],
    });

    expect(result.success).toBe(true);
    expect(result.downloaded).toBe(1);
    expect(logInfoMock).toHaveBeenCalledWith(
      "[FileController] Mass download end",
      expect.objectContaining({ canceledCount: 0 })
    );
  });

  it("does not treat CANCELLED rows in failed as a clean cancel for silent-zero", async () => {
    nextCompletePayloadRef.current = {
      type: "complete",
      success: false,
      downloaded: 0,
      failed: [
        {
          itemId: "test.jpg",
          code: "CANCELLED",
          message: "unexpected cancel-shaped failure",
        },
      ],
      canceled: false,
      canceledCount: 0,
    };

    const result = await controller.downloadAll({
      kind: "list",
      items: [LIST_ITEM],
    });

    expect(result.canceled).toBe(false);
    expect(result.success).toBe(false);
    expect(result.failed).toHaveLength(1);
    expect(result.error).toBeUndefined();
  });

  it("openDownloadFolder returns typed error when shell.openPath fails", async () => {
    openPathMock.mockResolvedValue("Failed to open path");

    const result = await controller.openDownloadFolder();

    expect(result).toEqual({
      ok: false,
      error: "Could not open the download folder.",
    });
    expect(openPathMock).toHaveBeenCalled();
  });

  it("openDownloadFolder returns ok when shell.openPath succeeds", async () => {
    openPathMock.mockResolvedValue("");

    const result = await controller.openDownloadFolder();

    expect(result).toEqual({ ok: true });
  });
});
