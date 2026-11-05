import { describe, expect, it } from "vitest";
import {
  accountsForBatch,
  classifyDownloadFailure,
  unexpectedAbortFailure,
  UNEXPECTED_DOWNLOAD_ABORT_PREFIX,
} from "../../../src/shared/utils/download-failure";
import { outcomeForCancelledDownload } from "../../../src/main/workers/downloadWorker";

describe("downloadWorker silent-cancel / unexpected abort", () => {
  it("abort-like error without user cancel → entry in failed (CANCELLED) with cause", () => {
    const err = new DOMException("The operation was aborted.", "AbortError");
    const classified = classifyDownloadFailure(err);
    expect(classified.code).toBe("CANCELLED");
    expect(outcomeForCancelledDownload(false)).toBe("unexpected-abort");

    const failure = unexpectedAbortFailure(classified, err);
    expect(failure.code).toBe("CANCELLED");
    expect(failure.message).toContain(UNEXPECTED_DOWNLOAD_ABORT_PREFIX);
    expect(failure.message).toContain("The operation was aborted.");
    expect(failure.message).toContain("AbortError");

    const failed = [failure];
    expect(failed.some((f) => f.code === "CANCELLED")).toBe(true);
    expect(accountsForBatch(0, failed.length, 0, 1)).toBe(true);
  });

  it("user cancel → canceled, not in failed", () => {
    expect(outcomeForCancelledDownload(true)).toBe("user-cancel");

    const failed: Array<{ code: string }> = [];
    const canceledCount = 1;
    expect(failed).toHaveLength(0);
    expect(accountsForBatch(0, failed.length, canceledCount, 1)).toBe(true);
  });

  it("completed + failed + canceledCount === items.length for covered scenarios", () => {
    const itemCount = 5;
    const err = new DOMException("aborted mid-flight", "AbortError");
    const downloaded = 2;
    const failed = [unexpectedAbortFailure(classifyDownloadFailure(err), err)];
    const canceledCount = 2;
    expect(
      accountsForBatch(downloaded, failed.length, canceledCount, itemCount)
    ).toBe(true);

    expect(accountsForBatch(0, 0, 5, 5)).toBe(true);
    expect(accountsForBatch(5, 0, 0, 5)).toBe(true);
    expect(accountsForBatch(1, 0, 0, 5)).toBe(false);
  });

  it("CanceledError / ERR_CANCELED without aborted flag map to unexpected-abort path", () => {
    const canceledErr = Object.assign(new Error("canceled"), {
      name: "CanceledError",
    });
    expect(classifyDownloadFailure(canceledErr).code).toBe("CANCELLED");
    expect(
      classifyDownloadFailure(
        Object.assign(new Error("canceled"), { code: "ERR_CANCELED" })
      ).code
    ).toBe("CANCELLED");
    expect(outcomeForCancelledDownload(false)).toBe("unexpected-abort");

    const classified = classifyDownloadFailure(canceledErr);
    const failure = unexpectedAbortFailure(classified, canceledErr);
    expect(failure.code).toBe("CANCELLED");
    expect(failure.message).toContain(UNEXPECTED_DOWNLOAD_ABORT_PREFIX);
    expect(failure.message).toContain("canceled");
    expect(failure.message).toContain("CanceledError");
  });
});
