import axios from "axios";
import type Database from "better-sqlite3";
import { eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { artists, posts } from "../db/schema";
import type { Artist, NewPost } from "../db/schema";
import type * as schema from "../db/schema";
import { logger } from "../lib/logger";
import { retryWithBackoff } from "../lib/retry";
import { getProvider, PROVIDER_IDS, type ProviderId } from "../providers";
import { PAGE_SIZE } from "../providers/types";
import { mapBooruToNewPost } from "./post-mapper";

// SQLite default limit: 999 variables per query (SQLITE_MAX_VARIABLE_NUMBER)
// Each post has ~12 fields for INSERT + ~6 for UPDATE in onConflictDoUpdate
// Safe calculation: 999 / 18 ≈ 55, use 75 for optimal performance
// Better-SQLite3 uses modern SQLite (3.40+) with 32766 limit, but we stay conservative
const CHUNK_SIZE = 75;
const BATCH_SIZE_PAGES = 5;
const POSTS_FTS_INSERT_TRIGGER_NAME = "posts_fts_insert";
const FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME = "fts5_cache_invalidate_insert";

type SyncSettings = { userId: string; apiKey: string };
type SendEvent = (channel: string, data?: unknown) => void;

type SyncPostsOptions = {
  isInitial: boolean;
  currentLastPostId: number;
  maxPages: number;
};

type SyncOrchestratorDeps = {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: InstanceType<typeof Database>;
  sendEvent: SendEvent;
};

function bulkUpsertPosts(
  postsToSave: NewPost[],
  tx: BetterSQLite3Database<typeof schema>
): void {
  if (postsToSave.length === 0) {
    return;
  }

  for (let i = 0; i < postsToSave.length; i += CHUNK_SIZE) {
    const chunk = postsToSave.slice(i, i + CHUNK_SIZE);
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

export class SyncOrchestrator {
  private readonly db: BetterSQLite3Database<typeof schema>;
  private readonly sqlite: InstanceType<typeof Database>;
  private readonly sendEvent: SendEvent;

  constructor({ db, sqlite, sendEvent }: SyncOrchestratorDeps) {
    this.db = db;
    this.sqlite = sqlite;
    this.sendEvent = sendEvent;
  }

  public async syncAllArtists(settings: SyncSettings): Promise<void> {
    const artistsList = await this.db.query.artists.findMany({
      orderBy: [artists.name],
    });

    for (const artist of artistsList) {
      try {
        this.sendEvent("sync:progress", `Checking ${artist.name}...`);
        await this.syncArtist(artist, settings);
      } catch (error: unknown) {
        const errorMsg = axios.isAxiosError(error)
          ? `HTTP ${error.response?.status}: ${error.message}`
          : error instanceof Error
            ? error.message
            : "Unknown error";
        logger.error(`Sync error for ${artist.name}: ${errorMsg}`);
        this.sendEvent("sync:error", `${artist.name}: ${errorMsg}`);
      }
    }
  }

  public async syncArtist(
    artist: Artist,
    settings: SyncSettings,
    maxPages = Infinity
  ): Promise<void> {
    const rawProviderId = artist.provider || "rule34";
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

    const currentLastPostId = artist.lastPostId;
    const isInitialSync = currentLastPostId === 0;
    await this.syncPosts(artist, settings, provider, {
      isInitial: isInitialSync,
      currentLastPostId,
      maxPages: isInitialSync ? maxPages : Infinity,
    });
  }

  private async syncPosts(
    artist: Artist,
    settings: SyncSettings,
    provider: ReturnType<typeof getProvider>,
    options: SyncPostsOptions
  ): Promise<void> {
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
    const allPostsToSave: NewPost[] = [];

    if (isInitial) {
      logger.info(
        `SyncService: ${artist.name} - disabling initial-sync FTS insert triggers`
      );
      this.sqlite.exec(`DROP TRIGGER IF EXISTS ${POSTS_FTS_INSERT_TRIGGER_NAME};`);
      this.sqlite.exec(
        `DROP TRIGGER IF EXISTS ${FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME};`
      );
    }

    let mainError: unknown = null;
    let restoreError: unknown = null;

    try {
      while (hasMore && page < maxPages) {
        try {
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

          const newPosts = isInitial
            ? postsData
            : postsData.filter((p) => p.id > currentLastPostId);

          if (newPosts.length === 0) {
            hasMore = false;
            break;
          }

          const postsToSave = newPosts.map((p) => mapBooruToNewPost(artist.id, p));
          allPostsToSave.push(...postsToSave);

          if (postsToSave.length > 0) {
            const pageHighestPostId = Math.max(...postsToSave.map((p) => p.postId));
            batchHighestPostId = Math.max(batchHighestPostId, pageHighestPostId);
          }

          const shouldCommitBatch =
            allPostsToSave.length >= BATCH_SIZE_PAGES * PAGE_SIZE ||
            (postsData.length < PAGE_SIZE && allPostsToSave.length > 0) ||
            !hasMore;

          if (shouldCommitBatch && allPostsToSave.length > 0) {
            this.db.transaction((tx) => {
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
            allPostsToSave.length = 0;
            logger.debug(
              `SyncService: ${artist.name} - Committed batch of ${newPostsCount} posts`
            );
          }

          if (postsData.length < PAGE_SIZE) {
            hasMore = false;
            logger.debug(
              `SyncService: ${artist.name} - Page ${page} returned ${postsData.length} posts (< ${PAGE_SIZE}), stopping pagination`
            );
          } else {
            page++;
            logger.debug(
              `SyncService: ${artist.name} - Page ${page - 1} returned ${postsData.length} posts, continuing to page ${page}`
            );
          }
        } catch (error: unknown) {
          logger.error(`Sync error for ${artist.name}`, error);
          hasMore = false;

          if (allPostsToSave.length > 0) {
            try {
              const partialSize = allPostsToSave.length;
              this.db.transaction((tx) => {
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
            } catch (commitError: unknown) {
              logger.error(
                `SyncService: Partial commit failed for ${artist.name}`,
                commitError
              );
            }
          }

          throw error;
        }
      }

      if (allPostsToSave.length > 0) {
        this.db.transaction((tx) => {
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
        logger.debug(
          `SyncService: ${artist.name} - Committed final batch of ${allPostsToSave.length} posts`
        );
      }

      if (newPostsCount === 0) {
        this.db.transaction((tx) => {
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
    } catch (error: unknown) {
      mainError = error;
    }

    if (isInitial) {
      logger.info(
        `SyncService: ${artist.name} - rebuilding FTS index and restoring insert triggers`
      );

      try {
        this.sqlite
          .prepare(`
            INSERT INTO posts_fts(rowid, tags)
            SELECT id, tags FROM posts
            WHERE artist_id = ? AND id NOT IN (SELECT rowid FROM posts_fts);
          `)
          .run(artist.id);

        this.sqlite.exec(`
          CREATE TRIGGER IF NOT EXISTS posts_fts_insert
          AFTER INSERT ON posts BEGIN
            INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
          END;
        `);
      } catch (error: unknown) {
        restoreError = error;
      }

      try {
        this.sqlite.exec(`
          CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_insert
          AFTER INSERT ON posts_fts BEGIN
            UPDATE fts5_cache_invalidation
            SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
            WHERE id = 1;
          END;
        `);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("cannot create triggers on virtual tables")) {
          logger.warn(
            `SyncService: Could not recreate ${FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME} (${errorMessage})`
          );
        } else {
          restoreError = error;
        }
      }
    }

    if (restoreError) {
      throw restoreError;
    }
    if (mainError) {
      throw mainError;
    }
  }
}
