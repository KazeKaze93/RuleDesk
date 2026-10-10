import fs from "node:fs";
import path from "node:path";
import { BACKUP_FILE_PREFIX } from "../db/paths";
import { runBackupIntegrityWorker } from "../workers/runBackupIntegrityWorker";
import { writeBackupSidecar } from "./backup-sidecar";

/** Legacy auto-backup names written by copyFileSync (pre consistency fix). */
export const LEGACY_AUTO_BACKUP_FILE_REGEX =
  /^data\.backup\.\d{4}-\d{2}-\d{2}\.bin$/;

/**
 * New auto-backup names: same `.db` extension as manual backups for restore UX,
 * with an `-auto-` infix so auto/manual retention stay separate.
 */
export const AUTO_BACKUP_FILE_REGEX = new RegExp(
  `^${escapeRegExp(BACKUP_FILE_PREFIX)}-auto-.+\\.db$`
);

/** Manual backups: `.ruledesk-backup-<ISO>.db`, excluding the auto infix. */
export const MANUAL_BACKUP_FILE_REGEX = new RegExp(
  `^${escapeRegExp(BACKUP_FILE_PREFIX)}-(?!auto-).+\\.db$`
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isLegacyAutoBackupFilename(filename: string): boolean {
  return LEGACY_AUTO_BACKUP_FILE_REGEX.test(filename);
}

export function isAutoBackupFilename(filename: string): boolean {
  return (
    LEGACY_AUTO_BACKUP_FILE_REGEX.test(filename) ||
    AUTO_BACKUP_FILE_REGEX.test(filename)
  );
}

export function isManualBackupFilename(filename: string): boolean {
  return MANUAL_BACKUP_FILE_REGEX.test(filename);
}

export function buildAutoBackupFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${BACKUP_FILE_PREFIX}-auto-${year}-${month}-${day}.db`;
}

export function buildManualBackupFilename(date: Date = new Date()): string {
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  return `${BACKUP_FILE_PREFIX}-${timestamp}.db`;
}

export type AutoBackupFileAge = {
  filename: string;
  mtimeMs: number;
};

/**
 * List auto-backup files (legacy `.bin` + new `-auto-*.db`) oldest-first by
 * filesystem mtime. Do NOT sort by filename: `.ruledesk-backup-auto-*` sorts
 * before `data.backup.*` lexicographically, which would delete newest first.
 */
export function listAutoBackupFilesOldestFirst(
  backupDirectory: string
): AutoBackupFileAge[] {
  return fs
    .readdirSync(backupDirectory)
    .filter((filename) => isAutoBackupFilename(filename))
    .map((filename) => {
      const fullPath = path.join(backupDirectory, filename);
      const mtimeMs = fs.statSync(fullPath).mtimeMs;
      return { filename, mtimeMs };
    })
    .sort((left, right) => {
      if (left.mtimeMs !== right.mtimeMs) {
        return left.mtimeMs - right.mtimeMs;
      }
      return left.filename.localeCompare(right.filename);
    });
}

/**
 * Filenames that exceed retention when `filesOldestFirst` is already ordered
 * by age (oldest at index 0).
 */
export function selectAutoBackupFilenamesToDelete(
  filesOldestFirst: readonly AutoBackupFileAge[],
  retention: number
): string[] {
  if (filesOldestFirst.length <= retention) {
    return [];
  }
  return filesOldestFirst
    .slice(0, filesOldestFirst.length - retention)
    .map((file) => file.filename);
}

/**
 * Consistent SQLite snapshot via `VACUUM INTO` in `backupIntegrityWorker`,
 * then settings sidecar on Main. Caller must close the Main DB handle first
 * (same connect/close protocol as VACUUM). Does not prune retention.
 */
export async function createConsistentBackup(
  dbPath: string,
  targetPath: string
): Promise<void> {
  const result = await runBackupIntegrityWorker({
    op: "vacuumInto",
    dbPath,
    targetPath,
  });
  if (!result.success) {
    throw new Error(result.error);
  }
  await writeBackupSidecar(targetPath);
}
