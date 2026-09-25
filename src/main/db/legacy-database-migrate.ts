import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import log from "electron-log";
import { isErrnoException } from "../../shared/utils/type-guards";

export type LegacyDbCandidate = {
  userDataDirName: string;
  userDataDir: string;
  dbPath: string;
};

export type LegacyMigrateFs = {
  access: (path: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<string | undefined>;
  rename: (source: string, target: string) => Promise<void>;
  copyFile: (source: string, target: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  stat: (path: string) => Promise<fs.Stats>;
  readdir: (path: string) => Promise<string[]>;
  rmdir: (path: string) => Promise<void>;
  rmSync: (path: string, options: { force: boolean }) => void;
  existsSync: (path: string) => boolean;
};

export type LegacyMigrateDeps = {
  fs?: LegacyMigrateFs;
  openDatabase?: (dbPath: string) => InstanceType<typeof Database>;
};

const defaultFs: LegacyMigrateFs = {
  access: (p) => fs.promises.access(p),
  mkdir: (p, options) => fs.promises.mkdir(p, options),
  rename: (source, target) => fs.promises.rename(source, target),
  copyFile: (source, target) => fs.promises.copyFile(source, target),
  unlink: (p) => fs.promises.unlink(p),
  stat: (p) => fs.promises.stat(p),
  readdir: (p) => fs.promises.readdir(p),
  rmdir: (p) => fs.promises.rmdir(p),
  rmSync: (p, options) => fs.rmSync(p, options),
  existsSync: (p) => fs.existsSync(p),
};

function defaultOpenDatabase(dbPath: string): InstanceType<typeof Database> {
  return new Database(dbPath);
}

/**
 * True when the DB file looks like a real RuleDesk database (not an empty stub
 * created after a failed legacy migrate attempt).
 *
 * Note: a fresh `runManualMigrations` on an empty file also passes this check
 * (artists table exists, __drizzle_migrations has rows). Callers that care about
 * orphaning legacy data must also use `databaseHasUserContent` / leftover-legacy
 * handling in `migrateLegacyDatabase`.
 */
export function databaseLooksInitialized(
  dbPath: string,
  openDatabase: (dbPath: string) => InstanceType<typeof Database> = defaultOpenDatabase
): boolean {
  if (!fs.existsSync(dbPath)) {
    return false;
  }
  let sqlite: InstanceType<typeof Database> | null = null;
  try {
    sqlite = openDatabase(dbPath);
    const artists = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='artists'"
      )
      .get();
    if (artists) {
      return true;
    }
    const migrations = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'"
      )
      .get();
    if (!migrations) {
      return false;
    }
    // boundary: better-sqlite3 raw row
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
    const countRow = sqlite
      .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
      .get() as { count: number } | undefined;
    return (countRow?.count ?? 0) > 0;
  } catch {
    return false;
  } finally {
    sqlite?.close();
  }
}

/**
 * True when the DB has at least one artists row (proxy for real user data).
 * Used to distinguish an empty post-migrate stub from a gallery the user already uses.
 */
export function databaseHasUserContent(
  dbPath: string,
  openDatabase: (dbPath: string) => InstanceType<typeof Database> = defaultOpenDatabase
): boolean {
  if (!fs.existsSync(dbPath)) {
    return false;
  }
  let sqlite: InstanceType<typeof Database> | null = null;
  try {
    sqlite = openDatabase(dbPath);
    const artists = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='artists'"
      )
      .get();
    if (!artists) {
      return false;
    }
    // boundary: better-sqlite3 raw row
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
    const countRow = sqlite
      .prepare("SELECT COUNT(*) AS count FROM artists")
      .get() as { count: number } | undefined;
    return (countRow?.count ?? 0) > 0;
  } catch {
    return false;
  } finally {
    sqlite?.close();
  }
}

function removeDbSidecars(dbPath: string, fileFs: LegacyMigrateFs): void {
  fileFs.rmSync(dbPath, { force: true });
  fileFs.rmSync(`${dbPath}-wal`, { force: true });
  fileFs.rmSync(`${dbPath}-shm`, { force: true });
}

/**
 * Move a single file; on EXDEV (cross-volume), copy → verify size → unlink source.
 * Returns false if source does not exist.
 */
export async function moveFileWithExdevFallback(
  sourcePath: string,
  targetPath: string,
  fileFs: LegacyMigrateFs = defaultFs
): Promise<boolean> {
  try {
    await fileFs.access(sourcePath);
  } catch {
    return false;
  }

  await fileFs.mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await fileFs.rename(sourcePath, targetPath);
    return true;
  } catch (error) {
    if (!isErrnoException(error) || error.code !== "EXDEV") {
      throw error;
    }

    log.warn(
      `[DB] Cross-volume rename (EXDEV) for ${sourcePath} → ${targetPath}; using copy+verify+unlink`
    );
    await fileFs.copyFile(sourcePath, targetPath);

    const sourceStat = await fileFs.stat(sourcePath);
    const targetStat = await fileFs.stat(targetPath);
    if (sourceStat.size !== targetStat.size) {
      try {
        await fileFs.unlink(targetPath);
      } catch {
        // ignore cleanup of bad copy
      }
      throw new Error(
        `Legacy DB copy verification failed: size mismatch ` +
          `(source=${sourceStat.size}, target=${targetStat.size}) for ${sourcePath}`
      );
    }

    await fileFs.unlink(sourcePath);
    return true;
  }
}

async function removeDirectoryIfEmpty(
  dirPath: string,
  fileFs: LegacyMigrateFs
): Promise<void> {
  try {
    const entries = await fileFs.readdir(dirPath);
    if (entries.length === 0) {
      await fileFs.rmdir(dirPath);
    }
  } catch {
    // Ignore cleanup errors - non-critical.
  }
}

function checkpointLegacyWal(
  legacyDbPath: string,
  openDatabase: (dbPath: string) => InstanceType<typeof Database>
): void {
  const sqlite = openDatabase(legacyDbPath);
  try {
    // Merge WAL into the main DB file so a single-file move is sufficient.
    sqlite.pragma("wal_checkpoint(TRUNCATE)");
  } finally {
    sqlite.close();
  }
}

/**
 * Move legacy DB (metadata.db + optional wal/shm) into the new data.bin path.
 *
 * Order: wal_checkpoint(TRUNCATE) → move main file (+ leftover wal/shm if any).
 * Checkpoint failure leaves legacy files untouched and reports
 * `blockedLegacyPath` so the caller can refuse to create an empty new DB
 * (which would permanently orphan the legacy file on the next launch).
 */
export type LegacyMigrateResult = {
  migrated: boolean;
  /** Absolute path of a legacy DB that still exists because migrate could not finish. */
  blockedLegacyPath: string | null;
};

export async function migrateLegacyDatabase(params: {
  newDbPath: string;
  legacyCandidates: readonly LegacyDbCandidate[];
  deps?: LegacyMigrateDeps;
}): Promise<LegacyMigrateResult> {
  const fileFs = params.deps?.fs ?? defaultFs;
  const openDatabase = params.deps?.openDatabase ?? defaultOpenDatabase;
  const { newDbPath, legacyCandidates } = params;

  const leftoverLegacy = legacyCandidates.find((c) =>
    fileFs.existsSync(c.dbPath)
  );

  if (fileFs.existsSync(newDbPath)) {
    if (databaseLooksInitialized(newDbPath, openDatabase)) {
      if (!leftoverLegacy) {
        return { migrated: false, blockedLegacyPath: null };
      }
      // Empty-but-migrated new DB + leftover legacy = the orphan trap from
      // continuing past a failed checkpoint. Remove the empty stub and retry.
      if (!databaseHasUserContent(newDbPath, openDatabase)) {
        log.warn(
          `[DB] Removing empty initialized stub at ${newDbPath} to retry legacy migrate ` +
            `(legacy still present at ${leftoverLegacy.dbPath})`
        );
        removeDbSidecars(newDbPath, fileFs);
      } else {
        // Both sides have real data — do not overwrite; surface to the caller.
        return {
          migrated: false,
          blockedLegacyPath: leftoverLegacy.dbPath,
        };
      }
    } else {
      // Uninitialized stub after a prior soft failure — remove so rename can land.
      log.warn(
        `[DB] Removing uninitialized stub at ${newDbPath} to retry legacy migrate`
      );
      removeDbSidecars(newDbPath, fileFs);
    }
  }

  let blockedLegacyPath: string | null = null;

  for (const legacy of legacyCandidates) {
    if (!fileFs.existsSync(legacy.dbPath)) {
      continue;
    }

    try {
      checkpointLegacyWal(legacy.dbPath, openDatabase);
    } catch (error) {
      log.error(
        `[DB] Legacy WAL checkpoint failed for ${legacy.dbPath}; leaving files in place for retry:`,
        error
      );
      blockedLegacyPath = legacy.dbPath;
      continue;
    }

    const movedDb = await moveFileWithExdevFallback(
      legacy.dbPath,
      newDbPath,
      fileFs
    );
    const movedWal = await moveFileWithExdevFallback(
      `${legacy.dbPath}-wal`,
      `${newDbPath}-wal`,
      fileFs
    );
    const movedShm = await moveFileWithExdevFallback(
      `${legacy.dbPath}-shm`,
      `${newDbPath}-shm`,
      fileFs
    );

    log.info(
      `[DB] Migrated legacy database from ${legacy.userDataDirName} to new location. ` +
        `(db:${movedDb}, wal:${movedWal}, shm:${movedShm})`
    );

    await removeDirectoryIfEmpty(legacy.userDataDir, fileFs);
    return { migrated: true, blockedLegacyPath: null };
  }

  return { migrated: false, blockedLegacyPath };
}
