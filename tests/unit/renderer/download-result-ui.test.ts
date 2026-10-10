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

  it("warns when selection exceeds batch cap", async () => {
    const { warnIfDownloadTruncated } = await import(
      "../../../src/renderer/lib/download-result-ui"
    );
    expect(warnIfDownloadTruncated(600)).toBe(500);
    expect(toast.warning).toHaveBeenCalledWith(
      "Will download 500 of 600 selected posts"
    );
    expect(warnIfDownloadTruncated(10)).toBe(10);
    expect(toast.warning).toHaveBeenCalledTimes(1);
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
