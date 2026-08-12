export type BackupFileWithSize = {
  fullPath: string;
  name: string;
  size: number;
};

/**
 * Marks additional backup paths for deletion so retained files stay within
 * `maxTotalBytes`. Prefer newest files. `runningTotal` only accumulates sizes of
 * files that remain retained (not marked for deletion).
 *
 * The newest eligible file (not already in `toDelete`) is always kept — even when
 * it alone exceeds the cap — so size-cap never prefers older smaller backups over
 * the newest, and never wipes the last backup.
 *
 * Mutates `toDelete` in place (includes prior count-based marks).
 */
export function markBackupsExceedingSizeCap(
  filesNewestFirst: readonly BackupFileWithSize[],
  maxTotalBytes: number,
  toDelete: Set<string>
): void {
  if (maxTotalBytes <= 0 || filesNewestFirst.length === 0) {
    return;
  }

  let runningTotal = 0;
  let retainedNewestEligible = false;

  for (const file of filesNewestFirst) {
    if (toDelete.has(file.fullPath)) {
      continue;
    }

    // Always keep the newest eligible backup, even when it alone exceeds the cap.
    if (!retainedNewestEligible) {
      runningTotal += file.size;
      retainedNewestEligible = true;
      continue;
    }

    if (runningTotal + file.size > maxTotalBytes) {
      toDelete.add(file.fullPath);
    } else {
      runningTotal += file.size;
    }
  }
}
