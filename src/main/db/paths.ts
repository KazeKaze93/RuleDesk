import { app } from "electron";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const DB_FILE_NAME = "data.bin";
export const LEGACY_DB_FILE_NAME = "metadata.db";
/**
 * Live userData under the neutral root (human-readable).
 * Must NEVER match `LEGACY_USER_DATA_DIR_NAMES`, `BACKUP_DIR_NAME`, or
 * `LEGACY_NEUTRAL_USER_DATA_DIR_NAME`.
 */
export const USER_DATA_DIR_NAME = "RuleDesk-Data";
/**
 * Pre-relocate neutral cache dir. Still a migrate source for `data.bin`,
 * light sidecars, and leftover backup files.
 */
export const LEGACY_NEUTRAL_USER_DATA_DIR_NAME = ".rdcache";
/**
 * Sibling of live userData under the neutral root — human-readable, not a cache name.
 * Must NEVER match any entry in `LEGACY_USER_DATA_DIR_NAMES` (those folders still
 * hold legacy `metadata.db` candidates).
 */
export const BACKUP_DIR_NAME = "RuleDesk-Backups";
export const LEGACY_USER_DATA_DIR_NAMES = ["RuleDesk", "NSFW Booru Client"] as const;
export const BACKUP_FILE_PREFIX = ".ruledesk-backup";

export type DatabasePaths = {
  userDataDir: string;
  dbPath: string;
  walPath: string;
  shmPath: string;
};

export type LegacyDatabasePaths = DatabasePaths & {
  userDataDirName: string;
};

function getSqliteAuxPath(dbPath: string, suffix: "-wal" | "-shm"): string {
  return `${dbPath}${suffix}`;
}

/**
 * Root that holds `RuleDesk-Data` (live DB), `RuleDesk-Backups`, and optionally
 * leftover `.rdcache` as siblings.
 * Same win32/appData rules as `bootstrap-user-data.ts`.
 * In test mode, stay under the temp `userData` so CI never writes to real disks.
 */
export function getNeutralDataRoot(): string {
  if (process.env.NODE_ENV === "test") {
    return app.getPath("userData");
  }
  if (process.platform === "win32") {
    return process.env.LOCALAPPDATA || app.getPath("appData");
  }
  return app.getPath("appData");
}

/** Absolute path of the legacy `.rdcache` directory under the neutral root. */
export function getLegacyNeutralUserDataDir(): string {
  return path.join(getNeutralDataRoot(), LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
}

/**
 * Directory for auto/manual/legacy backup files (and their `.settings.json` sidecars).
 * Creates the directory on first use. Live `data.bin` lives under `RuleDesk-Data`.
 */
export function getBackupDirectory(): string {
  const dir = path.join(getNeutralDataRoot(), BACKUP_DIR_NAME);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDatabasePaths(): DatabasePaths {
  const userDataDir = app.getPath("userData");
  const dbPath = path.join(userDataDir, DB_FILE_NAME);

  return {
    userDataDir,
    dbPath,
    walPath: getSqliteAuxPath(dbPath, "-wal"),
    shmPath: getSqliteAuxPath(dbPath, "-shm"),
  };
}

export function getLegacyDatabasePaths(): LegacyDatabasePaths[] {
  const roots = new Set<string>([app.getPath("appData")]);
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    roots.add(process.env.LOCALAPPDATA);
  }

  const paths: LegacyDatabasePaths[] = [];
  for (const root of roots) {
    for (const legacyDirName of LEGACY_USER_DATA_DIR_NAMES) {
      const userDataDir = path.join(root, legacyDirName);
      const dbPath = path.join(userDataDir, LEGACY_DB_FILE_NAME);
      paths.push({
        userDataDirName: legacyDirName,
        userDataDir,
        dbPath,
        walPath: getSqliteAuxPath(dbPath, "-wal"),
        shmPath: getSqliteAuxPath(dbPath, "-shm"),
      });
    }
  }

  return paths;
}
