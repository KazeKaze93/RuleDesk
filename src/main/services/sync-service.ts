import { BrowserWindow, safeStorage } from "electron";
import { logger } from "../lib/logger";
import { getDb, getSqliteInstance } from "../db/client";
import { artists, settings, posts, SETTINGS_ID } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import axios from "axios";
import type { Artist, NewPost } from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { getProvider, PROVIDER_IDS, type ProviderId } from "../providers";
import { PAGE_SIZE, type BooruPost } from "../providers/types";
import { isVideoUrl } from "@shared/utils/media";

// SQLite default limit: 999 variables per query (SQLITE_MAX_VARIABLE_NUMBER)
// Each post has ~12 fields for INSERT + ~6 for UPDATE in onConflictDoUpdate
// Safe calculation: 999 / 18 ≈ 55, use 75 for optimal performance
// Better-SQLite3 uses modern SQLite (3.40+) with 32766 limit, but we stay conservative
// NOTE: With 50 posts/page limit, this handles 1.5 pages per chunk, which is efficient
// For initial sync (1000+ posts), chunking prevents SQLite from choking on large batches
const CHUNK_SIZE = 75;

// Safety limit for initial sync to prevent infinite loops
// At 100 posts/page, this equals 100k posts - more than sufficient for any artist
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
          mediaType: sql`excluded.media_type`,
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
      const db = getDb();
      const artistsList = await db.query.artists.findMany({
        orderBy: [artists.name],
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
            `SyncService: Credential decryption failed (${error.code}) before full sync.`
          );
          return;
        }
        throw error;
      }
      if (!settingsData?.userId) throw new Error("No API credentials");
      for (const artist of artistsList) {
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
      }
    } catch (error) {
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
        // Repair: reset lastPostId to 0 and sync posts with safety limit
        await this.syncArtist({ ...artist, lastPostId: 0 }, settingsData, MAX_PAGES_SAFETY_LIMIT);
      }
    } catch (e) {
      logger.error("Repair error", e);
    } finally {
      this.isSyncing = false;
      this.sendEvent("sync:repair:end");
    }
  }

  /**
   * Sync a single artist
   * 
   * Public method for testing. Can be called directly with artist and settings.
   * In production, use repairArtist() or syncAllArtists() instead.
   *
   * @param artist - Artist to sync
   * @param settings - API credentials (userId, apiKey)
   * @param maxPages - Maximum pages to fetch (default: Infinity)
   */
  public async syncArtist(
    artist: Artist,
    settings: { userId: string; apiKey: string },
    maxPages = Infinity
  ) {

    // DYNAMIC PROVIDER SELECTION
    // Validate provider ID against known providers
    const rawProviderId = artist.provider || "rule34";

    // Type-safe validation without casting
    const isValidProvider = (id: string): id is ProviderId => {
      return PROVIDER_IDS.some((validId: ProviderId) => validId === id);
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
      `SyncService: Syncing ${artist.name} using provider: ${provider.name} (lastPostId: ${artist.lastPostId})`
    );

    // Track current lastPostId separately to avoid mutating artist object
    const currentLastPostId = artist.lastPostId;
    const isInitialSync = currentLastPostId === 0;
    
    // Unified sync method - handles both initial and incremental sync
    return await this.syncPosts(
      artist,
      settings,
      provider,
      {
        isInitial: isInitialSync,
        currentLastPostId,
        maxPages: isInitialSync ? maxPages : Infinity,
      }
    );
  }

  /**
   * Unified sync method for both initial and incremental sync
   * Parameters control behavior:
   * - isInitial: true = load all posts (no id:> filter), false = load only new posts (id:> filter)
   * - currentLastPostId: starting point for incremental sync (ignored if isInitial)
   * - maxPages: maximum pages to fetch (only used for initial sync)
   */
  private async syncPosts(
    artist: Artist,
    settings: { userId: string; apiKey: string },
    provider: ReturnType<typeof getProvider>,
    options: {
      isInitial: boolean;
      currentLastPostId: number;
      maxPages: number;
    }
  ): Promise<void> {
    const db = getDb();
    const { isInitial, currentLastPostId, maxPages } = options;
    
    const syncType = isInitial ? "Initial" : "Incremental";
    logger.info(
      `SyncService: ${syncType} sync for ${artist.name} - ` +
      (isInitial 
        ? `will load ALL posts (max ${maxPages} pages)`
        : `will load posts with id > ${currentLastPostId}`)
    );

    let page = 0;
    let hasMore = true;
    let newPostsCount = 0;
    let batchHighestPostId = isInitial ? 0 : currentLastPostId;
    
    // Batch posts for transaction - collect multiple pages before committing
    // This reduces transaction overhead (better-sqlite3 blocks DB on write)
    // Batch size: 5 pages (500 posts) or until end of sync
    const BATCH_SIZE_PAGES = 5;
    const allPostsToSave: NewPost[] = [];

    while (hasMore && page < maxPages) {
      try {
        // Build tags query: initial sync uses base tag, incremental uses id:> filter
        const baseTag = provider.formatTag(artist.tag, artist.type);
        const tagsQuery = isInitial 
          ? baseTag 
          : `${baseTag} id:>${currentLastPostId}`;

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

        // Filter posts: initial sync saves all, incremental only saves new ones
        const newPosts = isInitial 
          ? postsData 
          : postsData.filter((p) => p.id > currentLastPostId);

        // Stop if no new posts found
        if (newPosts.length === 0) {
          hasMore = false;
          break;
        }

        // Pre-compute mediaType for all posts to avoid repeated URL parsing
        // This optimizes the map operation by computing mediaType once per post
        const postsToSave: NewPost[] = newPosts.map((p: BooruPost) => {
          // Compute mediaType once per post (isVideoUrl is optimized but still benefits from single call)
          const mediaType = isVideoUrl(p.fileUrl) ? "video" : "image";
          return {
            artistId: artist.id,
            fileUrl: p.fileUrl,
            postId: p.id,
            previewUrl: p.previewUrl,
            sampleUrl: p.sampleUrl,
            title: "",
            rating: p.rating,
            tags: p.tags.join(" "),
            mediaType,
            publishedAt: p.createdAt,
            isViewed: false,
            isFavorited: false,
          };
        });

        // Collect posts for batch transaction
        allPostsToSave.push(...postsToSave);
        
        // Update highest post ID seen
        if (postsToSave.length > 0) {
          const pageHighestPostId = Math.max(...postsToSave.map((p) => p.postId));
          batchHighestPostId = Math.max(batchHighestPostId, pageHighestPostId);
        }

        // Commit batch transaction when we have enough pages or reached end
        const shouldCommitBatch = 
          allPostsToSave.length >= BATCH_SIZE_PAGES * PAGE_SIZE || // 5 pages worth
          (postsData.length < PAGE_SIZE && allPostsToSave.length > 0) || // End of pagination
          !hasMore; // No more pages

        if (shouldCommitBatch && allPostsToSave.length > 0) {
          // Single transaction for entire batch
          db.transaction((tx) => {
            bulkUpsertPosts(allPostsToSave, tx);

            tx.update(artists)
              .set({
                lastPostId: batchHighestPostId,
                newPostsCount: sql`${artists.newPostsCount} + ${allPostsToSave.length}`,
                lastChecked: new Date(),
              })
              .where(eq(artists.id, artist.id))
              .run();
          });

          newPostsCount += allPostsToSave.length;
          allPostsToSave.length = 0; // Clear batch
          
          logger.debug(`SyncService: ${artist.name} - Committed batch of ${newPostsCount} posts`);
        }

        // Continue pagination if we got a full page (PAGE_SIZE posts)
        if (postsData.length < PAGE_SIZE) {
          hasMore = false;
          logger.debug(`SyncService: ${artist.name} - Page ${page} returned ${postsData.length} posts (< ${PAGE_SIZE}), stopping pagination`);
        } else {
          page++;
          logger.debug(`SyncService: ${artist.name} - Page ${page - 1} returned ${postsData.length} posts, continuing to page ${page}`);
        }
      } catch (e) {
        logger.error(`Sync error for ${artist.name}`, e);
        hasMore = false;

        if (allPostsToSave.length > 0) {
          try {
            const partialSize = allPostsToSave.length;
            db.transaction((tx) => {
              bulkUpsertPosts(allPostsToSave, tx);

              tx.update(artists)
                .set({
                  lastPostId: batchHighestPostId,
                  newPostsCount: sql`${artists.newPostsCount} + ${partialSize}`,
                  lastChecked: new Date(),
                })
                .where(eq(artists.id, artist.id))
                .run();
            });

            newPostsCount += partialSize;
            logger.warn(
              `SyncService: Partial commit of ${partialSize} posts after error for ${artist.name}`
            );
          } catch (commitErr) {
            logger.error(
              `SyncService: Partial commit failed for ${artist.name}`,
              commitErr
            );
          }
        }

        throw e;
      }
    }
    
    // Commit any remaining posts in batch
    if (allPostsToSave.length > 0) {
      db.transaction((tx) => {
        bulkUpsertPosts(allPostsToSave, tx);

        tx.update(artists)
          .set({
            lastPostId: batchHighestPostId,
            newPostsCount: sql`${artists.newPostsCount} + ${allPostsToSave.length}`,
            lastChecked: new Date(),
          })
          .where(eq(artists.id, artist.id))
          .run();
      });

      newPostsCount += allPostsToSave.length;
      logger.debug(`SyncService: ${artist.name} - Committed final batch of ${allPostsToSave.length} posts`);
    }

    // Final update of lastChecked even if no new posts were found
    if (newPostsCount === 0) {
      db.transaction((tx) => {
        tx.update(artists)
          .set({ lastChecked: new Date() })
          .where(eq(artists.id, artist.id))
          .run();
      });
    }

    const previousLastPostId = isInitial ? artist.lastPostId : currentLastPostId;
    logger.info(
      `${syncType} sync finished for ${artist.name}. Added: ${newPostsCount} posts. ` +
      `Final lastPostId: ${batchHighestPostId} (was: ${previousLastPostId})`
    );
  }
}

export const syncService = new SyncService();
