import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { settings, SETTINGS_ID } from "../db/schema";

export const DEFAULT_BACKUP_RETENTION = 5;
export const MIN_BACKUP_RETENTION = 1;
export const MAX_BACKUP_RETENTION = 20;

/**
 * Read `settings.backupRetention` and clamp to the supported range.
 * Shared by manual cleanup (MaintenanceController) and auto-backup prune (BackupService).
 */
export function getBackupRetention(): number {
  const db = getDb();
  const currentSettings = db
    .select({
      backupRetention: settings.backupRetention,
    })
    .from(settings)
    .where(eq(settings.id, SETTINGS_ID))
    .limit(1)
    .all()[0];

  const retention = currentSettings?.backupRetention ?? DEFAULT_BACKUP_RETENTION;
  return Math.max(
    MIN_BACKUP_RETENTION,
    Math.min(MAX_BACKUP_RETENTION, retention)
  );
}
