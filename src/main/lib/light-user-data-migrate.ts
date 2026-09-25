import path from "node:path";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";

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
