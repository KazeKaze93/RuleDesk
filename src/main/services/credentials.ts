import log from "electron-log";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../db/schema";
import { settings, SETTINGS_ID } from "../db/schema";
import {
  getDecryptedCredentialsFromRecord,
  type DecryptedCredentials,
} from "../utils/decrypted-credentials";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * Load API credentials from the settings row (Playlist/Posts contract).
 *
 * Returns null when the row is missing, userId/encryptedApiKey is empty,
 * or decryption fails. SearchController and SyncService keep their own
 * variants (provider field / strict throw).
 */
export async function getDecryptedApiSettings(
  db: AppDatabase
): Promise<DecryptedCredentials | null> {
  try {
    const settingsRecord = await db
      .select()
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1)
      .all();

    if (!settingsRecord || settingsRecord.length === 0) {
      return null;
    }

    const record = settingsRecord[0];
    if (!record.userId || !record.encryptedApiKey) {
      return null;
    }

    const credentials = getDecryptedCredentialsFromRecord(record);
    if (!credentials) {
      log.warn("[credentials] Failed to decrypt API key");
      return null;
    }

    return credentials;
  } catch (error) {
    log.error("[credentials] Failed to get decrypted settings:", error);
    return null;
  }
}
