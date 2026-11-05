// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

const log = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

vi.mock("sonner", () => ({ toast }));
vi.mock("electron-log/renderer", () => ({ default: log }));

const SHOW_FOLDER_ACTION_LABEL = "Show folder";
const OPEN_DOWNLOAD_FOLDER_FAILED_TOAST =
  "Could not open the download folder.";

type ToastAction = { label: string; onClick: () => void };

function getToastAction(mockFn: {
  mock: { calls: unknown[][] };
}): ToastAction {
  const options = mockFn.mock.calls[0]?.[1];
  if (
    typeof options !== "object" ||
    options === null ||
    !("action" in options)
  ) {
    throw new Error("Expected toast options with action");
  }
  const action = options.action;
  if (
    typeof action !== "object" ||
    action === null ||
    !("label" in action) ||
    !("onClick" in action) ||
    typeof action.label !== "string" ||
    typeof action.onClick !== "function"
  ) {
    throw new Error("Expected toast action with label and onClick");
  }
  return { label: action.label, onClick: action.onClick };
}

describe("download-result-ui", () => {
  const openDownloadFolder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    openDownloadFolder.mockResolvedValue({ ok: true });
    // boundary: vitest stub — only openDownloadFolder is exercised
    window.api = { openDownloadFolder } as Window["api"];
  });

  it("blocks list selection over the safety cap with an explicit error", async () => {
    const { warnIfDownloadListOverLimit } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    expect(warnIfDownloadListOverLimit(5001)).toBe(true);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("5000")
    );
    expect(warnIfDownloadListOverLimit(10)).toBe(false);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("shows typed over-limit IPC error (not a generic exception toast)", async () => {
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    const { buildListOverLimitResult } = await import(
      "../../../src/shared/utils/download-list-limit"
    );
    const result = buildListOverLimitResult(5001);
    presentDownloadAllResult(result);
    expect(toast.error).toHaveBeenCalledWith(
      result.error,
      expect.objectContaining({
        action: expect.objectContaining({ label: SHOW_FOLDER_ACTION_LABEL }),
      })
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("does not toast success for soft-fail results", async () => {
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    presentDownloadAllResult({
      success: false,
      downloaded: 2,
      failed: [
        {
          itemId: "1_9.jpg",
          code: "HTTP_404",
          message: "Not Found",
          httpStatus: 404,
        },
      ],
      canceled: false,
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Downloaded 2, failed 1",
      expect.objectContaining({
        description: expect.stringContaining("Not found (404)"),
        action: expect.objectContaining({ label: SHOW_FOLDER_ACTION_LABEL }),
      })
    );
  });

  it("toasts success only when downloaded > 0 and fully successful", async () => {
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    presentDownloadAllResult({
      success: true,
      downloaded: 3,
      failed: [],
      canceled: false,
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Downloaded 3 file(s)",
      expect.objectContaining({
        action: expect.objectContaining({ label: SHOW_FOLDER_ACTION_LABEL }),
      })
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("warns instead of success when downloaded is 0 with success and no failures", async () => {
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    presentDownloadAllResult({
      success: true,
      downloaded: 0,
      failed: [],
      canceled: false,
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(
      "Downloaded 0, failed 0",
      expect.objectContaining({
        action: expect.objectContaining({ label: SHOW_FOLDER_ACTION_LABEL }),
      })
    );
  });

  it("shows silent-zero / setup error without success toast", async () => {
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    const silentZeroError =
      "Mass download finished without processing any items (0 downloaded, 0 failed, not canceled).";
    presentDownloadAllResult({
      success: false,
      downloaded: 0,
      failed: [],
      canceled: false,
      error: silentZeroError,
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      silentZeroError,
      expect.objectContaining({
        action: expect.objectContaining({ label: SHOW_FOLDER_ACTION_LABEL }),
      })
    );
  });

  it("treats CANCELLED rows in failed as real failures (error toast)", async () => {
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    presentDownloadAllResult({
      success: false,
      downloaded: 1,
      failed: [
        {
          itemId: "2_1.jpg",
          code: "CANCELLED",
          message: "Canceled",
        },
      ],
      canceled: false,
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Downloaded 1, failed 1",
      expect.objectContaining({
        action: expect.objectContaining({ label: SHOW_FOLDER_ACTION_LABEL }),
      })
    );
  });

  it("keeps informative canceled toast with Show folder action", async () => {
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    presentDownloadAllResult({
      success: false,
      downloaded: 2,
      failed: [],
      canceled: true,
    });
    expect(toast.info).toHaveBeenCalledWith(
      "Download canceled — 2 saved, 0 failed",
      expect.objectContaining({
        action: expect.objectContaining({ label: SHOW_FOLDER_ACTION_LABEL }),
      })
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("Show folder action calls openDownloadFolder and toasts on failure", async () => {
    openDownloadFolder.mockResolvedValue({
      ok: false,
      error: "shell.openPath failed",
    });
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    presentDownloadAllResult({
      success: true,
      downloaded: 1,
      failed: [],
      canceled: false,
    });

    const action = getToastAction(toast.success);
    expect(action.label).toBe(SHOW_FOLDER_ACTION_LABEL);
    action.onClick();
    await vi.waitFor(() => {
      expect(openDownloadFolder).toHaveBeenCalledTimes(1);
      expect(log.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(OPEN_DOWNLOAD_FOLDER_FAILED_TOAST);
    });
  });

  it("Show folder action logs when openDownloadFolder throws", async () => {
    openDownloadFolder.mockRejectedValue(new Error("ipc down"));
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    presentDownloadAllResult({
      success: true,
      downloaded: 1,
      failed: [],
      canceled: false,
    });

    getToastAction(toast.success).onClick();
    await vi.waitFor(() => {
      expect(log.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(OPEN_DOWNLOAD_FOLDER_FAILED_TOAST);
    });
  });
});
