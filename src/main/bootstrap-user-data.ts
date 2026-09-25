/**
 * Must be imported before logger, electron-store, and any module that reads userData at load time.
 */
import { app } from "electron";
import path from "node:path";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import {
  LEGACY_NEUTRAL_USER_DATA_DIR_NAME,
  USER_DATA_DIR_NAME,
  getNeutralDataRoot,
} from "./db/paths";

const isTestMode = process.env.NODE_ENV === "test";

function migrateFileIfMissing(sourcePath: string, targetPath: string): void {
  if (!existsSync(sourcePath) || existsSync(targetPath)) {
    return;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

/**
 * Copy light sidecars (backup schedule + app log) when the target is missing.
 * Idempotent: no-op if source is absent or target already exists.
 */
function migrateLegacyUserDataFiles(
  legacyUserDataDir: string,
  targetUserDataDir: string
): void {
  if (legacyUserDataDir === targetUserDataDir) {
    return;
  }

  migrateFileIfMissing(
    path.join(legacyUserDataDir, "backup-settings.json"),
    path.join(targetUserDataDir, "backup-settings.json")
  );
  migrateFileIfMissing(
    path.join(legacyUserDataDir, "logs", "app.log"),
    path.join(targetUserDataDir, "logs", "app.log")
  );
}

function configureUserDataPath(): void {
  if (isTestMode) {
    process.env.USER_DATA_PATH = app.getPath("userData");
    return;
  }

  const electronDefaultUserDataDir = app.getPath("userData");
  const neutralRoot = getNeutralDataRoot();
  const targetUserDataDir = path.join(neutralRoot, USER_DATA_DIR_NAME);
  const rdcacheUserDataDir = path.join(
    neutralRoot,
    LEGACY_NEUTRAL_USER_DATA_DIR_NAME
  );

  mkdirSync(targetUserDataDir, { recursive: true });

  app.setPath("userData", targetUserDataDir);
  // (1) Electron default product dir → RuleDesk-Data (first-time redirect users).
  migrateLegacyUserDataFiles(electronDefaultUserDataDir, targetUserDataDir);
  // (2) Legacy .rdcache → RuleDesk-Data (users already on the neutral cache path).
  migrateLegacyUserDataFiles(rdcacheUserDataDir, targetUserDataDir);
  process.env.USER_DATA_PATH = targetUserDataDir;
}

configureUserDataPath();
