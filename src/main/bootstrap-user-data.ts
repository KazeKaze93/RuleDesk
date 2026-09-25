/**
 * Must be imported before logger, electron-store, and any module that reads userData at load time.
 */
import { app } from "electron";
import path from "node:path";
import { mkdirSync } from "node:fs";
import {
  LEGACY_NEUTRAL_USER_DATA_DIR_NAME,
  USER_DATA_DIR_NAME,
  getNeutralDataRoot,
} from "./db/paths";
import { migrateLightUserDataSidecars } from "./lib/light-user-data-migrate";

const isTestMode = process.env.NODE_ENV === "test";

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
  migrateLightUserDataSidecars({
    rdcacheUserDataDir,
    electronDefaultUserDataDir,
    targetUserDataDir,
  });
  process.env.USER_DATA_PATH = targetUserDataDir;
}

configureUserDataPath();
