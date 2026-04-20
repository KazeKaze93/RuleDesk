import { BrowserWindow, safeStorage } from "electron";
import { eq } from "drizzle-orm";
import { getDb, getSqliteInstance } from "../db/client";
import { artists, settings, SETTINGS_ID } from "../db/schema";
import { logger } from "../lib/logger";
import { getProvider, type ProviderId } from "../providers";
import { SyncOrchestrator } from "./sync-orchestrator";

// Safety limit for initial sync to prevent infinite loops (page count × provider page size)
const MAX_PAGES_SAFETY_LIMIT = 1000;
type CredentialErrorCode = "KEYCHAIN_UNAVAILABLE" | "DECRYPT_FAILED";
type DecryptedSettings = { userId: string; apiKey: string };

class CredentialDecryptionError extends Error {
  public readonly code: CredentialErrorCode;

  constructor(code: CredentialErrorCode, message: string) {
    super(message);
    this.name = "CredentialDecryptionError";
    this.code = code;
  }
}

const isCredentialDecryptionError = (
  error: unknown
): error is CredentialDecryptionError => {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error instanceof CredentialDecryptionError ||
    error.name === "CredentialDecryptionError"
  );
};

export class SyncService {
  private window: BrowserWindow | null = null;
  private isSyncing = false;

  public setWindow(window: BrowserWindow) {
    this.window = window;
  }

  public sendEvent(channel: string, data?: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  private async getDecryptedSettings(): Promise<DecryptedSettings | null> {
    const db = getDb();
    const settingsRecord = await db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      logger.warn("SyncService: No settings found in database");
      return null;
    }

    const storedApiKey = settingsRecord.encryptedApiKey || "";
    if (!storedApiKey) {
      return {
        userId: settingsRecord.userId || "",
        apiKey: "",
      };
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new CredentialDecryptionError(
        "KEYCHAIN_UNAVAILABLE",
        "OS keychain unavailable; cannot decrypt API key."
      );
    }

    try {
      const decryptedApiKey = safeStorage.decryptString(
        Buffer.from(storedApiKey, "base64")
      );
      return {
        userId: settingsRecord.userId || "",
        apiKey: decryptedApiKey,
      };
    } catch (error: unknown) {
      logger.warn("SyncService: Failed to decrypt API Key.", error);
      throw new CredentialDecryptionError(
        "DECRYPT_FAILED",
        "Failed to decrypt API key; credentials may be from another OS user or corrupted."
      );
    }
  }

  public async checkCredentials(providerId: ProviderId = "rule34"): Promise<boolean> {
    try {
      const settings = await this.getDecryptedSettings();
      if (!settings?.userId || !settings?.apiKey) {
        logger.warn(
          "SyncService: Cannot verify credentials - missing ID or Key."
        );
        return false;
      }
      logger.info(
        `SyncService: Verifying connectivity for User ID: ${settings.userId}...`
      );

      const provider = getProvider(providerId);
      const isValid = await provider.checkAuth({
        userId: settings.userId,
        apiKey: settings.apiKey,
      });

      if (isValid) {
        logger.info("SyncService: Connection verified.");
      } else {
        logger.warn("SyncService: Verification failed.");
      }
      return isValid;
    } catch (error: unknown) {
      if (isCredentialDecryptionError(error)) {
        this.sendEvent(
          "sync:error",
          "Credentials invalid. Please re-enter API key in settings."
        );
        logger.warn(
          `SyncService: Credential decryption failed (${error.code}) during verification.`
        );
        return false;
      }
      logger.error("SyncService: Verification error", error);
      return false;
    }
  }

  public async syncAllArtists() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    logger.info("SyncService: Start Full Sync");
    this.sendEvent("sync:start");

    try {
      let settingsData: DecryptedSettings | null;
      try {
        settingsData = await this.getDecryptedSettings();
      } catch (error: unknown) {
        if (isCredentialDecryptionError(error)) {
          this.sendEvent(
            "sync:error",
            "Credentials invalid. Please re-enter API key in settings."
          );
          logger.warn(
            `SyncService: Credential decryption failed (${error.code}) before full sync.`
          );
          return;
        }
        throw error;
      }
      if (!settingsData?.userId) throw new Error("No API credentials");
      const orchestrator = this.createOrchestrator();
      await orchestrator.syncAllArtists(settingsData);
    } catch (error: unknown) {
      logger.error("Sync error", error);
      this.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Error"
      );
    } finally {
      this.isSyncing = false;
      try {
        const sqlite = getSqliteInstance();
        sqlite.exec("PRAGMA wal_checkpoint(TRUNCATE);");
        logger.info("SyncService: WAL checkpoint truncated.");
      } catch (e) {
        logger.warn("SyncService: WAL checkpoint failed", e);
      }
      this.sendEvent("sync:end");
    }
  }

  public async repairArtist(artistId: number) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const db = getDb();
      const artist = await db.query.artists.findFirst({
        where: eq(artists.id, artistId),
      });
      let settingsData: DecryptedSettings | null;
      try {
        settingsData = await this.getDecryptedSettings();
      } catch (error: unknown) {
        if (isCredentialDecryptionError(error)) {
          this.sendEvent(
            "sync:error",
            "Credentials invalid. Please re-enter API key in settings."
          );
          logger.warn(
            `SyncService: Credential decryption failed (${error.code}) during repair sync.`
          );
          return;
        }
        throw error;
      }

      if (artist && settingsData) {
        this.sendEvent("sync:repair:start", artist.name);
        await this.syncArtist(
          { ...artist, lastPostId: 0 },
          settingsData,
          MAX_PAGES_SAFETY_LIMIT
        );
      }
    } catch (error: unknown) {
      logger.error("Repair error", error);
    } finally {
      this.isSyncing = false;
      this.sendEvent("sync:repair:end");
    }
  }

  public async syncArtist(
    artist: (typeof artists.$inferSelect),
    settings: { userId: string; apiKey: string },
    maxPages = Infinity
  ): Promise<void> {
    const orchestrator = this.createOrchestrator();
    await orchestrator.syncArtist(artist, settings, maxPages);
  }

  private createOrchestrator(): SyncOrchestrator {
    const db = getDb();
    const sqlite = getSqliteInstance();
    return new SyncOrchestrator({
      db,
      sqlite,
      sendEvent: (channel, data) => this.sendEvent(channel, data),
    });
  }
}

export const syncService = new SyncService();
