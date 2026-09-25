import fs from "fs";
import Database from "better-sqlite3";
import log from "electron-log";
import { isErrnoException } from "../../shared/utils/type-guards";
import {
  logRestoredSettingsSnapshot,
  restoreBackupSidecar,
} from "./backup-sidecar";

export type DatabaseFilePaths = {
  dbPath: string;
  walPath: string;
  shmPath: string;
};

export type RestoreDatabaseDeps = {
  getPaths: () => DatabaseFilePaths;
  closeDatabase: () => void;
  initializeDatabase: () => Promise<unknown>;
  afterSuccessfulReinit?: () => void;
  restoreSidecar?: (backupPath: string) => void;
  logSettingsSnapshot?: () => void;
};

export type RestoreDatabaseResult = {
  success: boolean;
  message?: string;
  error?: string;
};

async function renameToBak(source: string, target: string): Promise<void> {
  try {
    await fs.promises.access(source);
    await fs.promises.rename(source, target);
  } catch (error) {
    if (!isErrnoException(error) || error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function restoreFromBak(
  bakPath: string,
  originalPath: string
): Promise<void> {
  try {
    await fs.promises.access(bakPath);
    await fs.promises.rename(bakPath, originalPath);
  } catch (error) {
    log.error(
      `[DatabaseRestore] Failed to restore ${originalPath} from backup:`,
      error
    );
  }
}

async function deleteBak(bakPath: string): Promise<void> {
  try {
    await fs.promises.access(bakPath);
    await fs.promises.rm(bakPath, { force: true });
  } catch (error) {
    if (isErrnoException(error) && error.code !== "ENOENT") {
      log.warn(`[DatabaseRestore] Failed to delete backup file ${bakPath}:`, error);
    }
  }
}

/**
 * Replace the live DB with a backup file.
 *
 * Order (critical): rename live → `.bak`, copy+integrity, swap in backup,
 * reinitialize, **only then** delete `.bak`. If reinit fails, `.bak` still
 * exists for rollback.
 */
export async function restoreDatabaseFromBackup(
  backupPath: string,
  deps: RestoreDatabaseDeps
): Promise<RestoreDatabaseResult> {
  if (backupPath.includes("\0")) {
    return { success: false, error: "Invalid backup path" };
  }

  try {
    await fs.promises.access(backupPath);
  } catch {
    return { success: false, error: "Backup file not found" };
  }

  deps.closeDatabase();

  const { dbPath, walPath, shmPath } = deps.getPaths();
  const tempDbPath = `${dbPath}.tmp`;
  const bakPaths = {
    db: `${dbPath}.bak`,
    wal: `${walPath}.bak`,
    shm: `${shmPath}.bak`,
  };

  await renameToBak(dbPath, bakPaths.db);
  await renameToBak(walPath, bakPaths.wal);
  await renameToBak(shmPath, bakPaths.shm);

  try {
    await fs.promises.copyFile(backupPath, tempDbPath);

    let tempDb: InstanceType<typeof Database> | null = null;
    try {
      tempDb = new Database(tempDbPath, { readonly: true });

      // boundary: better-sqlite3 raw row
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
      const integrityRows = tempDb
        .prepare("PRAGMA integrity_check")
        .all() as { integrity_check: string }[];
      const isValid =
        integrityRows.length === 1 && integrityRows[0]?.integrity_check === "ok";

      if (!isValid) {
        const errorMsg = integrityRows.map((r) => r.integrity_check).join("; ");
        throw new Error(
          `Database integrity check failed: ${errorMsg || "unknown result"}`
        );
      }

      log.info("[DatabaseRestore] Backup file integrity check passed");
    } finally {
      if (tempDb) {
        tempDb.close();
      }
    }

    await fs.promises.rename(tempDbPath, dbPath);

    // Reinit BEFORE deleting .bak — if this throws, catch rolls back from .bak.
    await deps.initializeDatabase();
    deps.afterSuccessfulReinit?.();
    (deps.restoreSidecar ?? restoreBackupSidecar)(backupPath);
    (deps.logSettingsSnapshot ?? logRestoredSettingsSnapshot)();

    await deleteBak(bakPaths.db);
    await deleteBak(bakPaths.wal);
    await deleteBak(bakPaths.shm);

    log.info(`[DatabaseRestore] Database restored from ${backupPath}`);
    return {
      success: true,
      message: "Database restored successfully.",
    };
  } catch (restoreError) {
    log.error("[DatabaseRestore] Restore failed, rolling back:", restoreError);

    try {
      await fs.promises.access(tempDbPath);
      await fs.promises.rm(tempDbPath, { force: true });
    } catch {
      // Ignore temp cleanup errors
    }

    // If live dbPath exists from a failed mid-path, remove it so .bak can rename back.
    try {
      if (fs.existsSync(dbPath) && fs.existsSync(bakPaths.db)) {
        await fs.promises.rm(dbPath, { force: true });
      }
    } catch (error) {
      log.warn("[DatabaseRestore] Failed to clear broken db before rollback:", error);
    }

    await restoreFromBak(bakPaths.db, dbPath);
    await restoreFromBak(bakPaths.wal, walPath);
    await restoreFromBak(bakPaths.shm, shmPath);

    try {
      await deps.initializeDatabase();
      deps.afterSuccessfulReinit?.();
    } catch (initError) {
      log.error(
        "[DatabaseRestore] Failed to reinitialize database after rollback:",
        initError
      );
    }

    const errorMessage =
      restoreError instanceof Error
        ? restoreError.message
        : "Restore failed, rolled back to previous state.";
    log.error(`[DatabaseRestore] Restore failed, rolled back. Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
