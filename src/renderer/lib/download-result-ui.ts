import { toast } from "sonner";
import { BATCH_DOWNLOAD_MAX_FILES } from "@shared/constants";
import type { DownloadAllResult, DownloadFailure } from "@shared/types/download";
import { downloadFailureCodeLabel } from "@shared/utils/download-failure";

export function warnIfDownloadTruncated(itemCount: number): number {
  if (itemCount <= BATCH_DOWNLOAD_MAX_FILES) {
    return itemCount;
  }
  toast.warning(
    `Will download ${BATCH_DOWNLOAD_MAX_FILES} of ${itemCount} selected posts`
  );
  return BATCH_DOWNLOAD_MAX_FILES;
}

export function formatDownloadFailures(failed: DownloadFailure[]): string {
  return failed
    .map(
      (f) =>
        `${f.itemId}: ${downloadFailureCodeLabel(f.code)}${
          f.httpStatus !== undefined ? ` (${f.httpStatus})` : ""
        }`
    )
    .join("\n");
}

/**
 * Shows mass-download outcome in the UI. Never treats soft-fail as success.
 */
export function presentDownloadAllResult(result: DownloadAllResult): void {
  if (result.canceled) {
    toast.info(
      `Download canceled — ${result.downloaded} saved, ${result.failed.length} failed`
    );
    return;
  }

  if (result.error && result.downloaded === 0 && result.failed.length === 0) {
    toast.error(result.error);
    return;
  }

  if (result.failed.length === 0 && result.success) {
    const trunc =
      result.truncatedFrom !== undefined
        ? ` (capped from ${result.truncatedFrom})`
        : "";
    toast.success(`Downloaded ${result.downloaded} file(s)${trunc}`);
    return;
  }

  const summary = `Downloaded ${result.downloaded}, failed ${result.failed.length}`;
  const details = formatDownloadFailures(result.failed);
  toast.error(summary, {
    description: details.length > 0 ? details : result.error,
    duration: 12_000,
  });
}
