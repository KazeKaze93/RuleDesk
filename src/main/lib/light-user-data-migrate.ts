import path from "node:path";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { DB_FILE_NAME } from "../db/paths";

/** Chromium / Electron OSCrypt key material; required to decrypt `safeStorage` ciphertext in `data.bin`. */
export const LOCAL_STATE_FILE_NAME = "Local State";

function migrateFileIfMissing(sourcePath: string, targetPath: string): void {
  if (!existsSync(sourcePath) || existsSync(targetPath)) {
    return;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

/**
 * Copy `Local State` so `safeStorage` can decrypt API keys that lived under the prior userData.
 * - Normal: first-write-wins when the target file is absent.
 * - Pending DB migrate: if the target has no `data.bin` yet but a source still has both
 *   `data.bin` and `Local State`, overwrite the target's `Local State`. A failed earlier
 *   launch may have already written a fresh os_crypt key that cannot decrypt the old DB.
 */
function migrateLocalStateForPendingDb(
  sourceUserDataDir: string,
  targetUserDataDir: string
): void {
  const sourceLocalState = path.join(sourceUserDataDir, LOCAL_STATE_FILE_NAME);
  const sourceDb = path.join(sourceUserDataDir, DB_FILE_NAME);
  const targetLocalState = path.join(targetUserDataDir, LOCAL_STATE_FILE_NAME);
  const targetDb = path.join(targetUserDataDir, DB_FILE_NAME);

  if (!existsSync(sourceLocalState)) {
    return;
  }

  if (!existsSync(targetDb) && existsSync(sourceDb)) {
    mkdirSync(targetUserDataDir, { recursive: true });
    copyFileSync(sourceLocalState, targetLocalState);
    return;
  }

  migrateFileIfMissing(sourceLocalState, targetLocalState);
}

/**
 * Copy light sidecars (backup schedule + app log) when the target is missing.
 * Idempotent: no-op if source is absent or target already exists.
 */
export function migrateLegacyUserDataFiles(
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
  migrateLocalStateForPendingDb(legacyUserDataDir, targetUserDataDir);
}

/**
 * Prefer the fresher `.rdcache` sidecars over a stale Electron-default copy.
 * `migrateFileIfMissing` keeps the first successful source forever, so order matters:
 * users who once redirected into `.rdcache` still have ancient `app.log` under the
 * product dir (copy, not rename) — that frozen file must not win.
 */
export function migrateLightUserDataSidecars(params: {
  rdcacheUserDataDir: string;
  electronDefaultUserDataDir: string;
  targetUserDataDir: string;
}): void {
  migrateLegacyUserDataFiles(
    params.rdcacheUserDataDir,
    params.targetUserDataDir
  );
  migrateLegacyUserDataFiles(
    params.electronDefaultUserDataDir,
    params.targetUserDataDir
  );
}
