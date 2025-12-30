import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, desc, count, and, like, sql, gte } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { posts, artists, type Post } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { toIpcSafe } from "../../utils/ipc-serialization";
import { PostDataSchema, type PostData } from "../../../shared/schemas/post";
import { EXTERNAL_ARTIST_ID, EXTERNAL_ARTIST_TAG_PREFIX } from "../../../shared/constants";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * IPC-safe Post type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 *
 * Uses TypeScript utility types to automatically map Date fields to numbers.
 * This ensures type safety and eliminates manual field enumeration.
 */
type IpcPost = {
  [K in keyof Post]: Post[K] extends Date
    ? number
    : Post[K] extends Date | null
    ? number | null
    : Post[K];
};

/**
 * Post Filter Schema
 *
 * Single source of truth for post filtering validation and typing.
 */
export const PostFilterSchema = z
  .object({
    tags: z.string().optional(),
    rating: z.enum(["s", "q", "e"]).optional(),
    isFavorited: z.boolean().optional(),
    isViewed: z.boolean().optional(),
    sinceTracking: z.boolean().optional(),
  })
  .partial();

/**
 * Post Filter Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type PostFilterRequest = z.infer<typeof PostFilterSchema>;

/**
 * Get Posts Schema
 *
 * Single source of truth for GetPosts validation and typing.
 */
export const GetPostsSchema = z.object({
  artistId: z.number().int().positive().optional(),
  page: z.number().int().min(1).default(1),
  filters: PostFilterSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

/**
 * Get Posts Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts) instead of duplicating interface.
 */
export type GetPostsRequest = z.infer<typeof GetPostsSchema>;

// Internal types (not exported - use types from src/main/types/ipc.ts instead)
type GetPostsParams = z.infer<typeof GetPostsSchema>;

/**
 * Posts Controller
 *
 * Handles IPC operations for post management:
 * - Get posts with pagination and filters
 * - Get posts count for artist
 * - Mark post as viewed
 */
export class PostsController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  /**
   * Setup IPC handlers for post operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS,
      z.tuple([GetPostsSchema]),
      this.getPosts.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS_COUNT,
      z.tuple([z.number().int().positive().optional()]),
      this.getPostsCount.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.MARK_VIEWED,
      z.tuple([
        z.number().int().positive(),
        PostDataSchema.optional(),
      ]),
      this.markViewed.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.RESET_POST_CACHE,
      z.tuple([z.number().int().positive()]),
      this.resetPostCache.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.TOGGLE_FAVORITE,
      z.tuple([
        z.number().int().positive(),
        PostDataSchema.optional(),
      ]),
      this.toggleFavorite.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    log.info("[PostsController] All handlers registered");
  }

  /**
   * Find existing post by database ID or by postId + EXTERNAL_ARTIST_ID
   * 
   * This is a shared helper method used by markViewed and toggleFavorite
   * to avoid code duplication.
   * 
   * @param tx - Drizzle transaction object
   * @param postId - Database post ID (for existing posts)
   * @param postData - Optional post data for external posts (contains postId for lookup)
   * @returns Found post or undefined
   */
  private findPostInTransaction(
    tx: Parameters<Parameters<AppDatabase["transaction"]>[0]>[0],
    postId: number,
    postData?: PostData
  ): Post | undefined {
    // First, try to find post by database ID (synchronous query inside transaction)
    let existingPost = tx
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)
      .all()[0];

    // If not found and postData is provided, try to find by postId and EXTERNAL_ARTIST_ID
    // SECURITY: Always use EXTERNAL_ARTIST_ID, never trust artistId from Renderer
    // This handles external posts from Browse (artistId = EXTERNAL_ARTIST_ID)
    if (!existingPost && postData) {
      existingPost = tx
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.postId, postData.postId),
            eq(posts.artistId, EXTERNAL_ARTIST_ID)
          )
        )
        .limit(1)
        .all()[0];
    }

    return existingPost;
  }

  /**
   * Get posts for an artist (or globally) with pagination and filters
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters: artistId (optional), page, filters, limit
   * @returns Array of posts
   * @throws {Error} If database operation fails
   */
  private async getPosts(
    _event: IpcMainInvokeEvent,
    params: GetPostsParams
  ): Promise<IpcPost[]> {
    const { artistId, page, filters, limit } = params;
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

      // If sinceTracking filter is enabled, we need to use join
      if (filters?.sinceTracking === true) {
        // Build where conditions array (excluding the date filter, which goes in join)
        // Note: artistId is optional - if not provided, returns posts from all tracked artists
        // This is the expected behavior for global feeds like Updates
        const baseConditions: ReturnType<typeof eq | typeof like>[] = [];

        if (artistId) {
          baseConditions.push(eq(posts.artistId, artistId));
        }
        if (filters?.tags !== undefined) {
          baseConditions.push(like(posts.tags, `%${filters.tags}%`));
        }
        if (filters?.rating !== undefined) {
          baseConditions.push(eq(posts.rating, filters.rating));
        }
        if (filters?.isFavorited !== undefined) {
          baseConditions.push(eq(posts.isFavorited, filters.isFavorited));
        }
        if (filters?.isViewed !== undefined) {
          baseConditions.push(eq(posts.isViewed, filters.isViewed));
        }

        // Combine all conditions using and()
        // Note: whereClause can be undefined if no additional filters are provided.
        // This is safe because the join condition already filters by date (sinceTracking),
        // so the join itself acts as the primary filter. Additional filters in whereClause
        // are optional refinements.
        const whereClause =
          baseConditions.length > 0 ? and(...baseConditions) : undefined;

        // Use select with innerJoin for sinceTracking filter
        // The date filter is part of the join condition for efficiency
        // This ensures filtering happens at the join level, not after
        // The join condition (gte(posts.publishedAt, artists.createdAt)) ensures
        // we only get posts published after the artist was tracked, even if whereClause is undefined
        const result = await db
          .select({
            id: posts.id,
            postId: posts.postId,
            artistId: posts.artistId,
            fileUrl: posts.fileUrl,
            previewUrl: posts.previewUrl,
            sampleUrl: posts.sampleUrl,
            title: posts.title,
            rating: posts.rating,
            tags: posts.tags,
            publishedAt: posts.publishedAt,
            createdAt: posts.createdAt,
            isViewed: posts.isViewed,
            isFavorited: posts.isFavorited,
          })
          .from(posts)
          .innerJoin(
            artists,
            and(
              eq(posts.artistId, artists.id),
              gte(posts.publishedAt, artists.createdAt)
            )
          )
          .where(whereClause)
          .orderBy(desc(posts.publishedAt))
          .limit(limit)
          .offset(offset);

        log.info(
          `[PostsController] Retrieved ${result.length} posts ${
            artistId ? `for artist ${artistId}` : "globally"
          } (page ${page}, sinceTracking: true)`
        );

        // Convert Date objects to numbers for Electron 39+ IPC serialization
        return toIpcSafe(result) as IpcPost[];
      }

      // Standard query path (no sinceTracking filter)
      // Build where conditions array
      const baseConditions: ReturnType<typeof eq | typeof like>[] = [];

      if (artistId) {
        baseConditions.push(eq(posts.artistId, artistId));
      }
      if (filters?.tags !== undefined) {
        baseConditions.push(like(posts.tags, `%${filters.tags}%`));
      }
      if (filters?.rating !== undefined) {
        baseConditions.push(eq(posts.rating, filters.rating));
      }
      if (filters?.isFavorited !== undefined) {
        baseConditions.push(eq(posts.isFavorited, filters.isFavorited));
      }
      if (filters?.isViewed !== undefined) {
        baseConditions.push(eq(posts.isViewed, filters.isViewed));
      }

      // Combine all conditions using and()
      const whereClause =
        baseConditions.length > 0 ? and(...baseConditions) : undefined;

      const result = await db.query.posts.findMany({
        where: whereClause,
        orderBy: [desc(posts.publishedAt)],
        limit,
        offset,
      });

      log.info(
        `[PostsController] Retrieved ${result.length} posts ${
          artistId ? `for artist ${artistId}` : "globally"
        } (page ${page})`
      );

      // Convert Date objects to numbers for Electron 39+ IPC serialization
      // Uses universal toIpcSafe utility to avoid code duplication
      return toIpcSafe(result) as IpcPost[];
    } catch (error) {
      log.error("[PostsController] Failed to get posts:", error);
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }

  /**
   * Get posts count for an artist (or all posts if artistId is not provided)
   *
   * @param _event - IPC event (unused)
   * @param artistId - Artist ID (optional)
   * @returns Number of posts
   */
  private async getPostsCount(
    _event: IpcMainInvokeEvent,
    artistId: number | undefined
  ): Promise<number> {
    try {
      const db = this.getDb();
      const whereClause = artistId ? eq(posts.artistId, artistId) : undefined;

      const result = await db
        .select({ value: count() })
        .from(posts)
        .where(whereClause);

      const total = result[0]?.value ?? 0;

      log.info(
        `[PostsController] Posts count: ${total} ${
          artistId ? `for artist ${artistId}` : "(all artists)"
        }`
      );
      return total;
    } catch (error) {
      log.error("[PostsController] Failed to get posts count:", error);
      return 0;
    }
  }

  /**
   * Mark post as viewed
   *
   * For posts from Browse (external posts), if post is not found in DB,
   * it will be created with the provided data.
   *
   * @param _event - IPC event (unused)
   * @param postId - Post ID (database ID for existing posts, or external postId for new posts)
   * @param postData - Optional post data for creating external posts from Browse
   * @returns true if update succeeded
   * @throws {Error} If update fails
   */
  private async markViewed(
    _event: IpcMainInvokeEvent,
    postId: number,
    postData?: PostData
  ): Promise<boolean> {
    try {
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      // All queries must be inside transaction for atomicity and efficiency
      type MarkViewedResult =
        | { success: true; postId: number; postPostId: number }
        | { success: true; postPostId: number }
        | { success: false };
      let result: MarkViewedResult = { success: false };

      db.transaction((tx) => {
        // Use shared helper method to find post
        const existingPost = this.findPostInTransaction(tx, postId, postData);

        // If post exists, update isViewed status
        if (existingPost) {
          tx.update(posts)
            .set({ isViewed: true })
            .where(eq(posts.id, existingPost.id))
            .run();

          log.debug(
            `[PostsController] Post ${existingPost.id} (postId: ${existingPost.postId}) marked as viewed in transaction`
          );

          result = {
            success: true,
            postId: existingPost.id,
            postPostId: existingPost.postId,
          };
        } else if (postData) {
          // If post doesn't exist and postData is provided, create it with isViewed = true
          const now = new Date();
          const publishedAt = postData.publishedAt
            ? new Date(postData.publishedAt)
            : now;

          tx.insert(posts)
            .values({
              postId: postData.postId,
              artistId: EXTERNAL_ARTIST_ID, // SECURITY: Always use EXTERNAL_ARTIST_ID for external posts
              fileUrl: postData.fileUrl,
              previewUrl: postData.previewUrl,
              sampleUrl: postData.sampleUrl ?? "",
              title: "",
              rating: postData.rating ?? "",
              tags: postData.tags ?? "",
              publishedAt: publishedAt,
              createdAt: now,
              isViewed: true, // Set to true since we're marking as viewed
              isFavorited: false,
            })
            .run();

          log.debug(
            `[PostsController] Created new post (postId: ${postData.postId}) and marked as viewed in transaction`
          );

          result = {
            success: true,
            postPostId: postData.postId,
          };
        }
      });

      if (result.success) {
        if ("postId" in result) {
          const r = result as { success: true; postId: number; postPostId: number };
          log.info(
            `[PostsController] Post ${r.postId} (postId: ${r.postPostId}) marked as viewed`
          );
        } else {
          const r = result as { success: true; postPostId: number };
          log.info(
            `[PostsController] Created new post (postId: ${r.postPostId}) and marked as viewed`
          );
        }
        return true;
      }

      // If post doesn't exist and no postData provided, return false (don't throw error for viewed status)
      log.warn(
        `[PostsController] Post with id ${postId} not found. For external posts from Browse, postData must be provided.`
      );
      return false;
    } catch (error) {
      log.error("[PostsController] Failed to mark post as viewed:", error);
      return false;
    }
  }

  /**
   * Reset post cache (mark post as not viewed)
   *
   * @param _event - IPC event (unused)
   * @param postId - Post ID
   * @returns true if update succeeded
   * @throws {Error} If update fails
   */
  private async resetPostCache(
    _event: IpcMainInvokeEvent,
    postId: number
  ): Promise<boolean> {
    try {
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      db.transaction((tx) => {
        tx.update(posts)
          .set({ isViewed: false })
          .where(eq(posts.id, postId))
          .run();
      });

      log.info(
        `[PostsController] Post ${postId} cache reset (marked as not viewed)`
      );
      return true;
    } catch (error) {
      log.error("[PostsController] Failed to reset post cache:", error);
      return false;
    }
  }

  /**
   * Toggle favorite status for a post
   *
   * For posts from Browse (external posts), if post is not found in DB,
   * it will be created with the provided data.
   *
   * @param _event - IPC event (unused)
   * @param postId - Post ID (database ID for existing posts, or external postId for new posts)
   * @param postData - Optional post data for creating external posts from Browse
   * @returns New favorite state (true if favorited, false otherwise)
   * @throws {Error} If database operation fails
   */
  private async toggleFavorite(
    _event: IpcMainInvokeEvent,
    postId: number,
    postData?: PostData
  ): Promise<boolean> {
    try {
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      // All queries must be inside transaction for atomicity and efficiency
      type ToggleFavoriteResult =
        | {
            existingPostId: number;
            existingPostPostId: number;
            newFavoriteState: boolean;
          }
        | {
            newPostPostId: number;
            newFavoriteState: boolean;
          };
      let result: ToggleFavoriteResult | null = null;

      db.transaction((tx) => {
        // Use shared helper method to find post
        const existingPost = this.findPostInTransaction(tx, postId, postData);

        // If post exists, toggle favorite status
        if (existingPost) {
          // Get current state before toggle
          const currentState = existingPost.isFavorited;
          const newState = !currentState;

          tx.update(posts)
            .set({ isFavorited: sql`NOT ${posts.isFavorited}` })
            .where(eq(posts.id, existingPost.id))
            .run();

          log.debug(
            `[PostsController] Post ${existingPost.id} (postId: ${existingPost.postId}) favorite toggled in transaction`
          );

          result = {
            existingPostId: existingPost.id,
            existingPostPostId: existingPost.postId,
            newFavoriteState: newState,
          };
        } else {
          // Post doesn't exist - can only add to favorites (not remove)
          // For toggle operation, if post doesn't exist, we're adding it to favorites (isFavorite = true)
          // Validate that postData is provided for network posts (Browse tab)
          if (!postData) {
            throw new Error(
              `Post with id ${postId} not found. For external posts from Browse, postData must be provided when adding to favorites.`
            );
          }

          // Validate required fields for NOT NULL constraints
          // Schema requires: fileUrl (NOT NULL), previewUrl (NOT NULL), tags (NOT NULL)
          if (!postData.fileUrl || postData.fileUrl.trim() === "") {
            throw new Error(
              `Post data validation failed: fileUrl is required and cannot be empty (NOT NULL constraint)`
            );
          }
          if (!postData.previewUrl || postData.previewUrl.trim() === "") {
            throw new Error(
              `Post data validation failed: previewUrl is required and cannot be empty (NOT NULL constraint)`
            );
          }

          // CRITICAL: Check if artist exists before inserting post (FOREIGN KEY constraint)
          // SECURITY: For external posts from Browse, always use EXTERNAL_ARTIST_ID
          // Never trust artistId from Renderer - it could be hijacked to target existing artists
          const targetArtistId = EXTERNAL_ARTIST_ID;

          // Use synchronous select query inside transaction
          // Drizzle with better-sqlite3 executes queries synchronously inside transactions
          const existingArtist = tx
            .select()
            .from(artists)
            .where(eq(artists.id, targetArtistId))
            .limit(1)
            .all()[0]; // Get first result or undefined

          if (!existingArtist) {
            // Artist doesn't exist - create placeholder artist to satisfy FOREIGN KEY constraint
            // Use explicit id (SQLite allows this even with autoIncrement by using INSERT with explicit id)
            const now = new Date();
            tx.insert(artists)
              .values({
                id: targetArtistId, // Explicit ID for placeholder artist
                name: `Artist ${targetArtistId}`,
                tag: `${EXTERNAL_ARTIST_TAG_PREFIX}${targetArtistId}`, // Unique tag for placeholder
                provider: "rule34", // Default provider
                type: "tag", // Default type
                apiEndpoint: "", // Safe default (required field)
                lastPostId: 0,
                newPostsCount: 0,
                createdAt: now,
              })
              .run();

            log.debug(
              `[PostsController] Created placeholder artist ${targetArtistId} for external post in transaction`
            );
          }

          // Create post with isFavorited = true (since we're adding to favorites via toggle)
          const now = new Date();
          const publishedAt = postData.publishedAt
            ? new Date(postData.publishedAt)
            : now;

          tx.insert(posts)
            .values({
              postId: postData.postId,
              artistId: EXTERNAL_ARTIST_ID, // SECURITY: Always use EXTERNAL_ARTIST_ID for external posts
              fileUrl: postData.fileUrl,
              previewUrl: postData.previewUrl,
              sampleUrl: postData.sampleUrl ?? "",
              title: "",
              rating: postData.rating ?? "",
              tags: postData.tags ?? "", // NOT NULL constraint - empty string is valid
              publishedAt: publishedAt,
              createdAt: now,
              isViewed: false,
              isFavorited: true, // Set to true since we're adding to favorites
            })
            .run();

          log.debug(
            `[PostsController] Created new post (postId: ${postData.postId}) and set as favorited in transaction`
          );

          result = {
            newPostPostId: postData.postId,
            newFavoriteState: true, // New posts are always favorited when created via toggle
          };
        }
      });

      if (!result) {
        throw new Error(
          `Post with id ${postId} not found or not updated. For external posts from Browse, postData must be provided.`
        );
      }

      if ("existingPostId" in result) {
        const r = result as {
          existingPostId: number;
          existingPostPostId: number;
          newFavoriteState: boolean;
        };
        log.info(
          `[PostsController] Post ${r.existingPostId} (postId: ${r.existingPostPostId}) favorite toggled to ${r.newFavoriteState}`
        );
        return r.newFavoriteState;
      } else {
        const r = result as {
          newPostPostId: number;
          newFavoriteState: boolean;
        };
        log.info(
          `[PostsController] Post new (postId: ${r.newPostPostId}) favorite toggled to ${r.newFavoriteState}`
        );
        return r.newFavoriteState;
      }
    } catch (error) {
      log.error("[PostsController] Failed to toggle favorite:", error);
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }
}
