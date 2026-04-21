import { app } from "electron";
import path from "node:path";

export const DB_FILE_NAME = "data.bin";
export const LEGACY_DB_FILE_NAME = "metadata.db";
export const USER_DATA_DIR_NAME = ".rdcache";
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
