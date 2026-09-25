import fs from "node:fs";
import path from "node:path";
import log from "electron-log";
import {
  isAutoBackupFilename,
  isManualBackupFilename,
} from "../lib/database-backup";
import { getBackupSidecarPath } from "../lib/backup-sidecar";
import {
  moveFileWithExdevFallback,
  type LegacyMigrateFs,
} from "./legacy-database-migrate";

export type BackupDirMigrateResult = {
  moved: string[];
  skippedExisting: string[];
  failed: { filename: string; error: string }[];
};

export type BackupDirMigrateDeps = {
  moveFile?: (
    sourcePath: string,
    targetPath: string,
    fileFs?: LegacyMigrateFs
  ) => Promise<boolean>;
};

function isBackupFilename(filename: string): boolean {
  return isAutoBackupFilename(filename) || isManualBackupFilename(filename);
}

/**
 * Move backup files (and matching `.settings.json` sidecars) from a live
 * userData directory (or legacy `.rdcache`) into the dedicated backups folder.
 *
 * Idempotent: if the target filename already exists, skip (do not overwrite).
 * Per-file failures are logged and collected; other files still migrate.
 * Never touches `data.bin` / WAL / SHM.
 */
export async function migrateBackupDirectory(params: {
  sourceDir: string;
  targetDir: string;
  deps?: BackupDirMigrateDeps;
}): Promise<BackupDirMigrateResult> {
  const { sourceDir, targetDir } = params;
  const moveFile = params.deps?.moveFile ?? moveFileWithExdevFallback;
  const result: BackupDirMigrateResult = {
    moved: [],
    skippedExisting: [],
    failed: [],
  };

  if (!fs.existsSync(sourceDir)) {
    return result;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  let entries: string[];
  try {
    entries = fs.readdirSync(sourceDir);
  } catch (error) {
    log.error(
      `[BackupDirMigrate] Failed to read source directory ${sourceDir}:`,
      error
    );
    return result;
  }

  const backupFiles = entries.filter((name) => isBackupFilename(name));

  for (const filename of backupFiles) {
    const sourcePath = path.join(sourceDir, filename);
    const targetPath = path.join(targetDir, filename);

    if (fs.existsSync(targetPath)) {
      log.info(
        `[BackupDirMigrate] Skip ${filename}: already exists in target`
      );
      result.skippedExisting.push(filename);
      continue;
    }

    try {
      await moveFile(sourcePath, targetPath);
      result.moved.push(filename);
      log.info(`[BackupDirMigrate] Moved ${filename} → ${targetPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error(`[BackupDirMigrate] Failed to move ${filename}:`, error);
      result.failed.push({ filename, error: message });
      continue;
    }

    const sourceSidecar = getBackupSidecarPath(sourcePath);
    const targetSidecar = getBackupSidecarPath(targetPath);
    if (!fs.existsSync(sourceSidecar)) {
      continue;
    }
    if (fs.existsSync(targetSidecar)) {
      log.info(
        `[BackupDirMigrate] Skip sidecar for ${filename}: already exists in target`
      );
      continue;
    }
    try {
      await moveFile(sourceSidecar, targetSidecar);
      log.info(
        `[BackupDirMigrate] Moved sidecar for ${filename} → ${targetSidecar}`
      );
    } catch (error) {
      log.error(
        `[BackupDirMigrate] Failed to move sidecar for ${filename}:`,
        error
      );
      // Sidecar failure is non-fatal for the backup file itself.
    }
  }

  return result;
}
