import log from "electron-log/renderer";
import { toast } from "sonner";
import { BATCH_DOWNLOAD_LIST_MAX_FILES } from "@shared/constants";
import type { DownloadAllResult, DownloadFailure } from "@shared/types/download";
import { downloadFailureCodeLabel } from "@shared/utils/download-failure";

const SHOW_FOLDER_ACTION_LABEL = "Show folder";
const OPEN_DOWNLOAD_FOLDER_FAILED_TOAST =
  "Could not open the download folder.";
const ERROR_TOAST_DURATION_MS = 12_000;
const LOG_PREFIX = "[download-result-ui]";

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

function formatCanceledMessage(downloaded: number, failedCount: number): string {
  return `Download canceled — ${downloaded} saved, ${failedCount} failed`;
}

function formatSuccessMessage(downloaded: number): string {
  return `Downloaded ${downloaded} file(s)`;
}

function formatOutcomeSummary(downloaded: number, failedCount: number): string {
  return `Downloaded ${downloaded}, failed ${failedCount}`;
}

async function handleShowFolderClick(): Promise<void> {
  try {
    const result = await window.api.openDownloadFolder();
    if (!result.ok) {
      log.error(`${LOG_PREFIX} openDownloadFolder failed:`, result.error);
      toast.error(OPEN_DOWNLOAD_FOLDER_FAILED_TOAST);
    }
  } catch (error: unknown) {
    log.error(`${LOG_PREFIX} openDownloadFolder threw:`, error);
    toast.error(OPEN_DOWNLOAD_FOLDER_FAILED_TOAST);
  }
}

function showFolderToastAction(): { label: string; onClick: () => void } {
  return {
    label: SHOW_FOLDER_ACTION_LABEL,
    onClick: () => {
      void handleShowFolderClick();
    },
  };
}

/**
 * Shows mass-download outcome in the UI. Never treats soft-fail as success.
 * Success toast only when downloaded > 0 (empty-batch success is a warning).
 */
export function presentDownloadAllResult(result: DownloadAllResult): void {
  const folderAction = showFolderToastAction();

  if (result.canceled) {
    toast.info(formatCanceledMessage(result.downloaded, result.failed.length), {
      action: folderAction,
    });
    return;
  }

  if (result.error && result.downloaded === 0 && result.failed.length === 0) {
    toast.error(result.error, { action: folderAction });
    return;
  }

  if (result.failed.length === 0 && result.success) {
    if (result.downloaded > 0) {
      toast.success(formatSuccessMessage(result.downloaded), {
        action: folderAction,
      });
      return;
    }
    toast.warning(formatOutcomeSummary(0, 0), {
      action: folderAction,
    });
    return;
  }

  const summary = formatOutcomeSummary(result.downloaded, result.failed.length);
  const details = formatDownloadFailures(result.failed);
  toast.error(summary, {
    description: details.length > 0 ? details : result.error,
    duration: ERROR_TOAST_DURATION_MS,
    action: folderAction,
  });
}
