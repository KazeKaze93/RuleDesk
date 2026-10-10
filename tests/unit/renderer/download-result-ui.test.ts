import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

vi.mock("sonner", () => ({ toast }));

describe("download-result-ui", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(toast.error).toHaveBeenCalledWith(result.error);
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
      })
    );
  });

  it("toasts success only when fully successful", async () => {
    const { presentDownloadAllResult } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    presentDownloadAllResult({
      success: true,
      downloaded: 3,
      failed: [],
      canceled: false,
    });
    expect(toast.success).toHaveBeenCalledWith("Downloaded 3 file(s)");
    expect(toast.error).not.toHaveBeenCalled();
  });
});
