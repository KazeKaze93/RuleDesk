import { BrowserWindow, safeStorage } from "electron";
import { logger } from "../lib/logger";
import { getDb } from "../db/client";
import { artists, settings, posts, type NewPost } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import axios from "axios";
import type { Artist } from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { getProvider } from "../providers";
import type { BooruPost } from "../providers/types";

const CHUNK_SIZE = 200;

async function bulkUpsertPosts(
  postsToSave: NewPost[],
  tx: BetterSQLite3Database<typeof schema>
): Promise<void> {
  if (postsToSave.length === 0) return;
  for (let i = 0; i < postsToSave.length; i += CHUNK_SIZE) {
    const chunk = postsToSave.slice(i, i + CHUNK_SIZE);
    await tx
      .insert(posts)
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
      });
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
          `SyncService: Retry attempt ${attempt + 1}/${maxRetries} for ${contextName} after ${delay}ms. Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      const status = error.response?.status;
      const isRateLimit = status === 429 || status === 503;
      const isServerError = status !== undefined && status >= 500 && status < 600;
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
        `SyncService: Retry attempt ${attempt + 1}/${maxRetries} for ${contextName} after ${waitTime}ms. Status: ${status || "network error"}`
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
        where: eq(settings.id, 1),
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
          logger.warn(
            "SyncService: Failed to decrypt API Key.",
            e
          );
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
        logger.warn("SyncService: Cannot verify credentials - missing ID or Key.");
        return false;
      }
      logger.info(`SyncService: Verifying connectivity for User ID: ${settings.userId}...`);
      
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
    // Fallback to 'rule34' if provider column is null (safety for migration edge cases)
    const providerId = artist.provider || "rule34";
    const provider = getProvider(providerId);
    
    logger.info(`SyncService: Syncing ${artist.name} using provider: ${provider.name}`);
    
    let page = 0;
    let hasMore = true;
    let newPostsCount = 0;
    let highestPostId = artist.lastPostId;
    const allPostsToSave: NewPost[] = [];

    while (hasMore && page < maxPages) {
      try {
        const idFilter = artist.lastPostId > 0 ? ` id:>${artist.lastPostId}` : "";
        
        // Use provider to format tag (handles 'user:' prefix logic)
        const baseTag = provider.formatTag(artist.tag, artist.type as "tag" | "uploader" | "query");
        const tagsQuery = `${baseTag}${idFilter}`;

        const postsData = await retryWithBackoff(
          () => provider.fetchPosts(tagsQuery, page, {
             userId: settings.userId,
             apiKey: settings.apiKey
          }),
          3,
          2000,
          artist.name
        );

        const batchMaxId = postsData.length > 0 ? Math.max(...postsData.map((p) => p.id)) : 0;
        if (batchMaxId > highestPostId) highestPostId = batchMaxId;

        const newPosts = postsData.filter((p) => p.id > artist.lastPostId);

        if (newPosts.length === 0 && artist.lastPostId > 0) {
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
          isFavorited: false
        }));

        allPostsToSave.push(...postsToSave);
        newPostsCount += postsToSave.length;

        if (postsData.length < 100) hasMore = false;
        else page++;
        
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        logger.error(`Sync error for ${artist.name}`, e);
        hasMore = false;
        throw e; // Rethrow to let syncAllArtists handle it
      }
    }

    await db.transaction(async (tx) => {
      if (allPostsToSave.length > 0) {
        await bulkUpsertPosts(allPostsToSave, tx);
      }
      await tx
        .update(artists)
        .set({
          lastPostId: sql`CASE WHEN ${artists.lastPostId} > ${highestPostId} THEN ${artists.lastPostId} ELSE ${highestPostId} END`,
          newPostsCount: sql`${artists.newPostsCount} + ${newPostsCount}`,
          lastChecked: new Date(),
        })
        .where(eq(artists.id, artist.id));
    });

    logger.info(`Sync finished for ${artist.name}. Added: ${newPostsCount}`);
  }
}

export const syncService = new SyncService();
