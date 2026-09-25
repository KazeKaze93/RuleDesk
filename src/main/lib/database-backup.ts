import type Database from "better-sqlite3";
import { BACKUP_FILE_PREFIX } from "../db/paths";
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

/**
 * Consistent online SQLite snapshot via VACUUM INTO, then settings sidecar.
 * Does not perform retention pruning — callers own that policy.
 */
export function createConsistentBackup(
  sqlite: InstanceType<typeof Database>,
  targetPath: string
): void {
  sqlite.prepare("VACUUM INTO ?").run(targetPath);
  writeBackupSidecar(targetPath);
}
