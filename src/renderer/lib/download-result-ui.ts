import { toast } from "sonner";
import { BATCH_DOWNLOAD_LIST_MAX_FILES } from "@shared/constants";
import type { DownloadAllResult, DownloadFailure } from "@shared/types/download";
import { downloadFailureCodeLabel } from "@shared/utils/download-failure";

/**
 * Returns true when the list is over the safety cap (caller must abort).
 * Shows an explicit toast — no silent truncate.
 */
export function warnIfDownloadListOverLimit(itemCount: number): boolean {
  if (itemCount <= BATCH_DOWNLOAD_LIST_MAX_FILES) {
    return false;
  }
  toast.error(
    `Selection has ${itemCount} posts; maximum is ${BATCH_DOWNLOAD_LIST_MAX_FILES}. Narrow the selection.`
  );
  return true;
}

/** @deprecated Use warnIfDownloadListOverLimit — no silent truncate. */
export function warnIfDownloadTruncated(itemCount: number): number {
  if (warnIfDownloadListOverLimit(itemCount)) {
    return 0;
  }
  return itemCount;
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
    toast.success(`Downloaded ${result.downloaded} file(s)`);
    return;
  }

  const summary = `Downloaded ${result.downloaded}, failed ${result.failed.length}`;
  const details = formatDownloadFailures(result.failed);
  toast.error(summary, {
    description: details.length > 0 ? details : result.error,
    duration: 12_000,
  });
}
