import { BrowserWindow, safeStorage } from "electron";
import { logger } from "../lib/logger";
import { getDb } from "../db/client";
import { artists, settings, posts, SETTINGS_ID } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import axios from "axios";
import type { Artist, NewPost } from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { getProvider, PROVIDER_IDS, type ProviderId } from "../providers";
import type { BooruPost } from "../providers/types";

// SQLite default limit: 999 variables per query (SQLITE_MAX_VARIABLE_NUMBER)
// Each post has ~12 fields for INSERT + ~6 for UPDATE in onConflictDoUpdate
// Safe calculation: 999 / 18 ≈ 55, use 75 for optimal performance
// Better-SQLite3 uses modern SQLite (3.40+) with 32766 limit, but we stay conservative
const CHUNK_SIZE = 75;

function bulkUpsertPosts(
  postsToSave: NewPost[],
  tx: BetterSQLite3Database<typeof schema>
): void {
  if (postsToSave.length === 0) return;
  for (let i = 0; i < postsToSave.length; i += CHUNK_SIZE) {
    const chunk = postsToSave.slice(i, i + CHUNK_SIZE);
    // Drizzle operations for better-sqlite3 are synchronous
    // CRITICAL: Must call .run() to execute the query
    tx.insert(posts)
      .values(chunk)
      .onConflictDoUpdate({
        target: [posts.artistId, posts.postId],
        set: {
          fileUrl: sql`excluded.file_url`,
          sampleUrl: sql`excluded.sample_url`,
          previewUrl: sql`excluded.preview_url`,
          tags: sql`excluded.tags`,
          rating: sql`excluded.rating`,
          publishedAt: sql`excluded.published_at`,
        },
      })
      .run();
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000,
  contextName = "unknown"
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!axios.isAxiosError(error)) {
        if (attempt === maxRetries) throw error;
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(
          `SyncService: Retry attempt ${
            attempt + 1
          }/${maxRetries} for ${contextName} after ${delay}ms. Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      const status = error.response?.status;
      const isRateLimit = status === 429 || status === 503;
      const isServerError =
        status !== undefined && status >= 500 && status < 600;
      const isNetworkError = !error.response && error.request;

      const shouldRetry = isRateLimit || isServerError || isNetworkError;
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      const retryAfterHeader = error.response?.headers["retry-after"];
      const retryAfter = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : null;
      const waitTime = retryAfter ? Math.max(retryAfter, delay) : delay;

      logger.warn(
        `SyncService: Retry attempt ${
          attempt + 1
        }/${maxRetries} for ${contextName} after ${waitTime}ms. Status: ${
          status || "network error"
        }`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw lastError;
}

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

  private async getDecryptedSettings() {
    try {
      const db = getDb();
      const settingsRecord = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });

      if (!settingsRecord) {
        logger.warn("SyncService: No settings found in database");
        return null;
      }

      let realApiKey = settingsRecord.encryptedApiKey || "";
      if (realApiKey && safeStorage.isEncryptionAvailable()) {
        try {
          const buff = Buffer.from(realApiKey, "base64");
          realApiKey = safeStorage.decryptString(buff);
        } catch (e) {
          logger.warn("SyncService: Failed to decrypt API Key.", e);
          realApiKey = settingsRecord.encryptedApiKey || "";
        }
      }
      return {
        userId: settingsRecord.userId || "",
        apiKey: realApiKey,
      };
    } catch (error) {
      logger.error("SyncService: Error fetching settings:", error);
      return null;
    }
  }

  public async checkCredentials(): Promise<boolean> {
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

      const provider = getProvider("rule34");
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
    } catch (error) {
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
      const db = getDb();
      const artistsList = await db.query.artists.findMany({
        orderBy: [artists.name],
      });
      const settingsData = await this.getDecryptedSettings();
      if (!settingsData?.userId) throw new Error("No API credentials");

      const CONCURRENT_SYNC_LIMIT = 3;
      const DELAY_BETWEEN_BATCHES = 1500;

      for (let i = 0; i < artistsList.length; i += CONCURRENT_SYNC_LIMIT) {
        const batch = artistsList.slice(i, i + CONCURRENT_SYNC_LIMIT);

        await Promise.allSettled(
          batch.map(async (artist) => {
            try {
              this.sendEvent("sync:progress", `Checking ${artist.name}...`);
              await this.syncArtist(artist, settingsData);
            } catch (error) {
              const errorMsg = axios.isAxiosError(error)
                ? `HTTP ${error.response?.status}: ${error.message}`
                : error instanceof Error
                ? error.message
                : "Unknown error";
              logger.error(`Sync error for ${artist.name}: ${errorMsg}`);
              this.sendEvent("sync:error", `${artist.name}: ${errorMsg}`);
            }
          })
        );

        if (i + CONCURRENT_SYNC_LIMIT < artistsList.length) {
          await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES));
        }
      }
    } catch (error) {
      logger.error("Sync error", error);
      this.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Error"
      );
    } finally {
      this.isSyncing = false;
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
      const settingsData = await this.getDecryptedSettings();

      if (artist && settingsData) {
        this.sendEvent("sync:repair:start", artist.name);
        await this.syncArtist({ ...artist, lastPostId: 0 }, settingsData, 3);
      }
    } catch (e) {
      logger.error("Repair error", e);
    } finally {
      this.isSyncing = false;
      this.sendEvent("sync:repair:end");
    }
  }

  private async syncArtist(
    artist: Artist,
    settings: { userId: string; apiKey: string },
    maxPages = Infinity
  ) {
    const db = getDb();

    // DYNAMIC PROVIDER SELECTION
    // Validate provider ID against known providers
    const rawProviderId = artist.provider || "rule34";

    // Type-safe validation without casting
    const isValidProvider = (id: string): id is ProviderId => {
      return PROVIDER_IDS.some((validId) => validId === id);
    };

    let providerId: ProviderId;
    if (!isValidProvider(rawProviderId)) {
      logger.error(
        `SyncService: Invalid provider '${rawProviderId}' for artist ${artist.name} (ID: ${artist.id}). ` +
          `Database integrity compromised. Expected one of: ${PROVIDER_IDS.join(
            ", "
          )}. ` +
          `Falling back to 'rule34' to continue sync.`
      );
      // Fallback to rule34 instead of throwing - don't kill entire sync process
      providerId = "rule34";
      this.sendEvent(
        "sync:error",
        `${artist.name}: Invalid provider, using Rule34 fallback`
      );
    } else {
      providerId = rawProviderId;
    }

    const provider = getProvider(providerId);

    logger.info(
      `SyncService: Syncing ${artist.name} using provider: ${provider.name}`
    );

    let page = 0;
    let hasMore = true;
    let newPostsCount = 0;
    // Track current lastPostId separately to avoid mutating artist object
    let currentLastPostId = artist.lastPostId;

    while (hasMore && page < maxPages) {
      try {
        const idFilter =
          currentLastPostId > 0 ? ` id:>${currentLastPostId}` : "";

        // Use provider to format tag (handles 'user:' prefix logic)
        const baseTag = provider.formatTag(artist.tag, artist.type);
        const tagsQuery = `${baseTag}${idFilter}`;

        const postsData = await retryWithBackoff(
          () =>
            provider.fetchPosts(tagsQuery, page, {
              userId: settings.userId,
              apiKey: settings.apiKey,
            }),
          3,
          2000,
          artist.name
        );

        const newPosts = postsData.filter((p) => p.id > currentLastPostId);

        if (newPosts.length === 0 && currentLastPostId > 0) {
          hasMore = false;
          break;
        }

        const postsToSave: NewPost[] = newPosts.map((p: BooruPost) => ({
          artistId: artist.id,
          fileUrl: p.fileUrl,
          postId: p.id,
          previewUrl: p.previewUrl,
          sampleUrl: p.sampleUrl,
          title: "",
          rating: p.rating,
          tags: p.tags.join(" "),
          publishedAt: p.createdAt,
          isViewed: false,
          isFavorited: false,
        }));

        // Save posts and update artist metadata atomically after each page
        if (postsToSave.length > 0) {
          // Calculate max post ID from this batch BEFORE transaction
          const batchHighestPostId = Math.max(
            ...postsToSave.map((p) => p.postId)
          );

          // better-sqlite3 transactions are synchronous
          // Drizzle wraps them but the callback should not be async
          // CRITICAL: All operations inside transaction must be synchronous and end with .run()
          db.transaction((tx) => {
            bulkUpsertPosts(postsToSave, tx);

            // Update lastPostId ONLY with posts that were actually saved in this transaction
            // Use currentLastPostId (not artist.lastPostId) to avoid race conditions
            tx.update(artists)
              .set({
                lastPostId: Math.max(currentLastPostId, batchHighestPostId),
                newPostsCount: sql`${artists.newPostsCount} + ${postsToSave.length}`,
                lastChecked: new Date(),
              })
              .where(eq(artists.id, artist.id))
              .run();
          });

          // Update local tracking variable for next iteration
          currentLastPostId = Math.max(currentLastPostId, batchHighestPostId);
          newPostsCount += postsToSave.length;
        }

        if (postsData.length < 100) hasMore = false;
        else page++;
      } catch (e) {
        logger.error(`Sync error for ${artist.name}`, e);
        hasMore = false;
        throw e; // Rethrow to let syncAllArtists handle it
      }
    }

    // Final update of lastChecked even if no new posts were found
    if (newPostsCount === 0) {
      // better-sqlite3 transactions are synchronous
      // CRITICAL: Must call .run() to execute the query
      db.transaction((tx) => {
        tx.update(artists)
          .set({ lastChecked: new Date() })
          .where(eq(artists.id, artist.id))
          .run();
      });
    }

    logger.info(`Sync finished for ${artist.name}. Added: ${newPostsCount}`);
  }
}

export const syncService = new SyncService();
