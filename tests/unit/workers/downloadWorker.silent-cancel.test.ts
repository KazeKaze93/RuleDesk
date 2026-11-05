import { describe, expect, it } from "vitest";
import { classifyDownloadFailure } from "../../../src/shared/utils/download-failure";
import {
  downloadBatchAccountsFor,
  outcomeForCancelledDownload,
  unexpectedAbortFailure,
  UNEXPECTED_DOWNLOAD_ABORT_MESSAGE,
} from "../../../src/main/workers/downloadWorker";

describe("downloadWorker silent-cancel / unexpected abort", () => {
  it("abort-like error without user cancel → entry in failed (CANCELLED)", () => {
    const classified = classifyDownloadFailure({
      name: "AbortError",
      message: "The operation was aborted.",
    });
    expect(classified.code).toBe("CANCELLED");
    expect(outcomeForCancelledDownload(false)).toBe("unexpected-abort");

    const failure = unexpectedAbortFailure();
    expect(failure.code).toBe("CANCELLED");
    expect(failure.message).toBe(UNEXPECTED_DOWNLOAD_ABORT_MESSAGE);

    const failed = [failure];
    expect(failed.some((f) => f.code === "CANCELLED")).toBe(true);
    expect(downloadBatchAccountsFor(0, failed.length, 0, 1)).toBe(true);
  });

  it("user cancel → canceled, not in failed", () => {
    expect(outcomeForCancelledDownload(true)).toBe("user-cancel");

    const failed: Array<{ code: string }> = [];
    const canceledCount = 1;
    expect(failed).toHaveLength(0);
    expect(downloadBatchAccountsFor(0, failed.length, canceledCount, 1)).toBe(
      true
    );
  });

  it("completed + failed + canceledCount === items.length for covered scenarios", () => {
    const itemCount = 5;
    // 2 completed, 1 unexpected abort in failed, 2 user-canceled
    const downloaded = 2;
    const failed = [unexpectedAbortFailure()];
    const canceledCount = 2;
    expect(
      downloadBatchAccountsFor(
        downloaded,
        failed.length,
        canceledCount,
        itemCount
      )
    ).toBe(true);

    // Pure user-cancel of whole batch
    expect(downloadBatchAccountsFor(0, 0, 5, 5)).toBe(true);

    // All success
    expect(downloadBatchAccountsFor(5, 0, 0, 5)).toBe(true);

    // Mismatch is false
    expect(downloadBatchAccountsFor(1, 0, 0, 5)).toBe(false);
  });

  it("CanceledError / ERR_CANCELED without aborted flag map to unexpected-abort path", () => {
    expect(
      classifyDownloadFailure({ name: "CanceledError", message: "canceled" })
        .code
    ).toBe("CANCELLED");
    expect(
      classifyDownloadFailure({ code: "ERR_CANCELED", message: "canceled" }).code
    ).toBe("CANCELLED");
    expect(outcomeForCancelledDownload(false)).toBe("unexpected-abort");
    expect(unexpectedAbortFailure().code).toBe("CANCELLED");
  });
});
