import { BrowserWindow } from "electron";
import { logger } from "../lib/logger";
import { getDb, getSqliteInstance } from "../db/client";
import { artists, settings, posts, SETTINGS_ID } from "../db/schema";
import {
  getDecryptedCredentialsStrict,
  isCredentialDecryptionError,
} from "../utils/decrypted-credentials";
import { eq, sql } from "drizzle-orm";
import axios from "axios";
import {
  isProviderSearchError,
  ProviderSearchError,
} from "../providers/provider-search-errors";
import type { Artist, NewPost } from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { getProvider, PROVIDER_IDS, type ProviderId } from "../providers";
import { PAGE_SIZE, type BooruPost } from "../providers/types";
import { isVideoUrl } from "@shared/utils/media";
import { IPC_CHANNELS } from "../ipc/channels";

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
const POSTS_FTS_INSERT_TRIGGER_NAME = "posts_fts_insert";
const FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME = "fts5_cache_invalidate_insert";

type DecryptedSettings = { userId: string; apiKey: string };

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

function countArtistPosts(
  tx: BetterSQLite3Database<typeof schema>,
  artistId: number
): number {
  const row = tx
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(posts)
    .where(eq(posts.artistId, artistId))
    .all()[0];
  return row?.count ?? 0;
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
      if (isProviderSearchError(error)) {
        if (error.kind === "rate_limit" && attempt < maxRetries) {
          const delay =
            error.retryAfterMs ?? baseDelay * Math.pow(2, attempt);
          logger.warn(
            `SyncService: Provider rate limit for ${contextName}; retrying in ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
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
  /** Serializes syncAllArtists / repairArtist — queued calls run after the active one finishes */
  private syncChain: Promise<void> = Promise.resolve();

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  private runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      this.isSyncing = true;
      try {
        return await task();
      } finally {
        this.isSyncing = false;
      }
    };

    const result = this.syncChain.then(run);
    this.syncChain = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

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

    return getDecryptedCredentialsStrict(settingsRecord);
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
          IPC_CHANNELS.SYNC.ERROR,
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
    return this.runExclusive(async () => {
    logger.info("SyncService: Start Full Sync");
    this.sendEvent(IPC_CHANNELS.SYNC.START);

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
            IPC_CHANNELS.SYNC.ERROR,
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
          this.sendEvent(IPC_CHANNELS.SYNC.PROGRESS, `Checking ${artist.name}...`);
          await this.syncArtist(artist, settingsData);
        } catch (error) {
          const errorMsg = isProviderSearchError(error)
            ? error.message
            : axios.isAxiosError(error)
            ? `HTTP ${error.response?.status}: ${error.message}`
            : error instanceof Error
            ? error.message
            : "Unknown error";
          logger.error(`Sync error for ${artist.name}: ${errorMsg}`);
          this.sendEvent(IPC_CHANNELS.SYNC.ERROR, `${artist.name}: ${errorMsg}`);
        }
      }
    } catch (error) {
      logger.error("Sync error", error);
      this.sendEvent(
        IPC_CHANNELS.SYNC.ERROR,
        error instanceof Error ? error.message : "Error"
      );
    } finally {
      try {
        const sqlite = getSqliteInstance();
        // PRAGMA/VACUUM: no Drizzle equivalent, raw SQL required
        sqlite.exec("PRAGMA wal_checkpoint(TRUNCATE);");
        logger.info("SyncService: WAL checkpoint truncated.");
      } catch (e) {
        logger.warn("SyncService: WAL checkpoint failed", e);
      }
      this.sendEvent(IPC_CHANNELS.SYNC.END);
    }
    });
  }

  public async repairArtist(artistId: number) {
    return this.runExclusive(async () => {
    let artistName = "Artist";
    try {
      const db = getDb();
      const artist = await db.query.artists.findFirst({
        where: eq(artists.id, artistId),
      });
      if (artist) {
        artistName = artist.name;
      }
      let settingsData: DecryptedSettings | null;
      try {
        settingsData = await this.getDecryptedSettings();
      } catch (error: unknown) {
        if (isCredentialDecryptionError(error)) {
          this.sendEvent(
            IPC_CHANNELS.SYNC.ERROR,
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
        this.sendEvent(IPC_CHANNELS.SYNC.REPAIR_START, artist.name);
        // Repair: reset lastPostId to 0 and sync posts with safety limit
        await this.syncArtist({ ...artist, lastPostId: 0 }, settingsData, MAX_PAGES_SAFETY_LIMIT);
      }
    } catch (e) {
      if (isProviderSearchError(e)) {
        this.sendEvent(
          IPC_CHANNELS.SYNC.ERROR,
          `${artistName}: ${e.message}`
        );
      }
      logger.error("Repair error", e);
    } finally {
      this.sendEvent(IPC_CHANNELS.SYNC.REPAIR_END);
    }
    });
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
        IPC_CHANNELS.SYNC.ERROR,
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
    const sqlite = getSqliteInstance();
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
    let paginationCompleted = false;
    
    // Batch posts for transaction - collect multiple pages before committing
    // This reduces transaction overhead (better-sqlite3 blocks DB on write)
    // Batch size: 5 pages (500 posts) or until end of sync
    const BATCH_SIZE_PAGES = 5;
    const allPostsToSave: NewPost[] = [];

    if (isInitial) {
      logger.info(
        `SyncService: ${artist.name} - disabling initial-sync FTS insert triggers`
      );
      // FTS5 trigger management: no Drizzle equivalent
      sqlite.exec(`DROP TRIGGER IF EXISTS ${POSTS_FTS_INSERT_TRIGGER_NAME};`);
      sqlite.exec(
        `DROP TRIGGER IF EXISTS ${FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME};`
      );
    }

    try {
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

          // Stop if no new posts found — known territory reached (incremental complete)
          if (newPosts.length === 0) {
            paginationCompleted = true;
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
            let insertedInBatch = 0;
            // Mid-batch / in-loop commits never advance the sync cursor.
            db.transaction((tx) => {
              const postsCountBefore = countArtistPosts(tx, artist.id);
              bulkUpsertPosts(allPostsToSave, tx);
              const postsCountAfter = countArtistPosts(tx, artist.id);
              insertedInBatch = Math.max(0, postsCountAfter - postsCountBefore);

              tx.update(artists)
                .set({
                  newPostsCount: sql`${artists.newPostsCount} + ${insertedInBatch}`,
                })
                .where(eq(artists.id, artist.id))
                .run();
            });

            newPostsCount += insertedInBatch;
            allPostsToSave.length = 0; // Clear batch
            
            logger.debug(
              `SyncService: ${artist.name} - Committed batch of ${insertedInBatch} new posts`
            );
          }

          // Continue pagination if we got a full page (PAGE_SIZE posts)
          if (postsData.length < PAGE_SIZE) {
            paginationCompleted = true;
            hasMore = false;
            logger.debug(`SyncService: ${artist.name} - Page ${page} returned ${postsData.length} posts (< ${PAGE_SIZE}), stopping pagination`);
          } else {
            page++;
            logger.debug(`SyncService: ${artist.name} - Page ${page - 1} returned ${postsData.length} posts, continuing to page ${page}`);
          }
        } catch (e) {
          logger.error(`Sync error for ${artist.name}`, e);
          hasMore = false;

          try {
            let partialSize = 0;
            db.transaction((tx) => {
              if (allPostsToSave.length > 0) {
                const postsCountBefore = countArtistPosts(tx, artist.id);
                bulkUpsertPosts(allPostsToSave, tx);
                const postsCountAfter = countArtistPosts(tx, artist.id);
                partialSize = Math.max(0, postsCountAfter - postsCountBefore);
              }

              if (partialSize > 0) {
                tx.update(artists)
                  .set({
                    newPostsCount: sql`${artists.newPostsCount} + ${partialSize}`,
                    lastSyncIncomplete: true,
                  })
                  .where(eq(artists.id, artist.id))
                  .run();
              } else {
                tx.update(artists)
                  .set({ lastSyncIncomplete: true })
                  .where(eq(artists.id, artist.id))
                  .run();
              }
            });

            if (partialSize > 0) {
              newPostsCount += partialSize;
              logger.warn(
                `SyncService: Partial commit of ${partialSize} posts after error for ${artist.name}`
              );
            }
            allPostsToSave.length = 0;
          } catch (commitErr) {
            logger.error(
              `SyncService: Partial commit failed for ${artist.name}`,
              commitErr
            );
          }

          if (isProviderSearchError(e)) {
            if (
              e.kind === "auth" ||
              e.kind === "rate_limit" ||
              e.kind === "network"
            ) {
              throw e;
            }
          } else if (axios.isAxiosError(e)) {
            throw new ProviderSearchError("network");
          } else {
            throw e;
          }
        }
      }
      
      // Commit any remaining posts in batch (cursor still deferred)
      if (allPostsToSave.length > 0) {
        let insertedInFinalBatch = 0;
        db.transaction((tx) => {
          const postsCountBefore = countArtistPosts(tx, artist.id);
          bulkUpsertPosts(allPostsToSave, tx);
          const postsCountAfter = countArtistPosts(tx, artist.id);
          insertedInFinalBatch = Math.max(0, postsCountAfter - postsCountBefore);

          tx.update(artists)
            .set(
              paginationCompleted
                ? {
                    newPostsCount: sql`${artists.newPostsCount} + ${insertedInFinalBatch}`,
                  }
                : {
                    newPostsCount: sql`${artists.newPostsCount} + ${insertedInFinalBatch}`,
                    lastSyncIncomplete: true,
                  }
            )
            .where(eq(artists.id, artist.id))
            .run();
        });

        newPostsCount += insertedInFinalBatch;
        allPostsToSave.length = 0;
        logger.debug(
          `SyncService: ${artist.name} - Committed final batch of ${insertedInFinalBatch} new posts`
        );
      }

      // Sole cursor write path: only after natural pagination end.
      if (paginationCompleted) {
        db.transaction((tx) => {
          tx.update(artists)
            .set({
              lastPostId: batchHighestPostId,
              lastChecked: new Date(),
              lastSyncIncomplete: false,
            })
            .where(eq(artists.id, artist.id))
            .run();
        });
      } else {
        db.transaction((tx) => {
          tx.update(artists)
            .set({ lastSyncIncomplete: true })
            .where(eq(artists.id, artist.id))
            .run();
        });
      }

      const previousLastPostId = isInitial ? artist.lastPostId : currentLastPostId;
      logger.info(
        `${syncType} sync finished for ${artist.name}. Added: ${newPostsCount} posts. ` +
        `Final lastPostId: ${paginationCompleted ? batchHighestPostId : previousLastPostId} ` +
        `(was: ${previousLastPostId}, paginationCompleted: ${paginationCompleted})`
      );
    } finally {
      if (isInitial) {
        logger.info(
          `SyncService: ${artist.name} - rebuilding FTS index and restoring insert triggers`
        );

        sqlite
          .prepare(`
            INSERT INTO posts_fts(rowid, tags)
            SELECT id, tags FROM posts
            WHERE artist_id = ? AND id NOT IN (SELECT rowid FROM posts_fts);
          `)
          .run(artist.id);

        // FTS5 trigger management: no Drizzle equivalent
        sqlite.exec(`
          CREATE TRIGGER IF NOT EXISTS posts_fts_insert
          AFTER INSERT ON posts BEGIN
            INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
          END;
        `);

        try {
          sqlite.exec(`
            CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_insert
            AFTER INSERT ON posts_fts BEGIN
              UPDATE fts5_cache_invalidation
              SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
              WHERE id = 1;
            END;
          `);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("cannot create triggers on virtual tables")) {
            logger.warn(
              `SyncService: Could not recreate ${FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME} (${errorMessage})`
            );
          } else {
            logger.error(
              `SyncService: Failed to recreate ${FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME}`,
              error
            );
          }
        }
      }
    }
  }
}

export const syncService = new SyncService();
