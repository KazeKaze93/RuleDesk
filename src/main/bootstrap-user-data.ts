/**
 * Must be imported before logger, electron-store, and any module that reads userData at load time.
 */
import { app } from "electron";
import path from "node:path";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { USER_DATA_DIR_NAME } from "./db/paths";

const isTestMode = process.env.NODE_ENV === "test";

function migrateFileIfMissing(sourcePath: string, targetPath: string): void {
  if (!existsSync(sourcePath) || existsSync(targetPath)) {
    return;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

/**
 * One-time migration from Electron default userData (e.g. %APPDATA%/RuleDesk)
 * to neutral %LOCALAPPDATA%/.rdcache after path redirect was introduced.
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

  const legacyUserDataDir = app.getPath("userData");

  const neutralRoot =
    process.platform === "win32"
      ? process.env.LOCALAPPDATA || app.getPath("appData")
      : app.getPath("appData");
  const neutralUserDataPath = path.join(neutralRoot, USER_DATA_DIR_NAME);

  mkdirSync(neutralUserDataPath, { recursive: true });

  if (process.platform === "win32") {
    try {
      writeFileSync(path.join(neutralUserDataPath, ".init"), "", { flag: "a" });
    } catch {
      // Non-critical marker for hidden attribute in main.ts
    }
  }

  app.setPath("userData", neutralUserDataPath);
  migrateLegacyUserDataFiles(legacyUserDataDir, neutralUserDataPath);
  process.env.USER_DATA_PATH = neutralUserDataPath;
}

configureUserDataPath();
