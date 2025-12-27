import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, desc, count, and, like, sql } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { posts, type Post } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { toIpcSafe } from "../../utils/ipc-serialization";

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
      z.tuple([z.number().int().positive()]),
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
      z.tuple([z.number().int().positive()]),
      this.toggleFavorite.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    log.info("[PostsController] All handlers registered");
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

      // Build where conditions array
      const conditions: ReturnType<typeof eq | typeof like>[] = [];
      
      if (artistId) {
        conditions.push(eq(posts.artistId, artistId));
      }
      if (filters?.tags !== undefined) {
        conditions.push(like(posts.tags, `%${filters.tags}%`));
      }
      if (filters?.rating !== undefined) {
        conditions.push(eq(posts.rating, filters.rating));
      }
      if (filters?.isFavorited !== undefined) {
        conditions.push(eq(posts.isFavorited, filters.isFavorited));
      }
      if (filters?.isViewed !== undefined) {
        conditions.push(eq(posts.isViewed, filters.isViewed));
      }

      // Combine all conditions using and()
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
   * @param _event - IPC event (unused)
   * @param postId - Post ID
   * @returns true if update succeeded
   * @throws {Error} If update fails
   */
  private async markViewed(
    _event: IpcMainInvokeEvent,
    postId: number
  ): Promise<boolean> {
    try {
      const db = this.getDb();
      await db
        .update(posts)
        .set({ isViewed: true })
        .where(eq(posts.id, postId));

      log.info(`[PostsController] Post ${postId} marked as viewed`);
      return true;
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
      await db
        .update(posts)
        .set({ isViewed: false })
        .where(eq(posts.id, postId));

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
   * @param _event - IPC event (unused)
   * @param postId - Post ID
   * @returns New favorite state (true if favorited, false otherwise)
   * @throws {Error} If database operation fails
   */
  private async toggleFavorite(
    _event: IpcMainInvokeEvent,
    postId: number
  ): Promise<boolean> {
    try {
      const db = this.getDb();

      // Toggle the isFavorited status directly in a single query
      const result = await db
        .update(posts)
        .set({ isFavorited: sql`NOT ${posts.isFavorited}` })
        .where(eq(posts.id, postId))
        .returning({ isFavorited: posts.isFavorited });

      if (result.length === 0) {
        throw new Error(`Post with id ${postId} not found or not updated`);
      }

      const newFavoriteState = result[0].isFavorited;

      log.info(
        `[PostsController] Post ${postId} favorite toggled to ${newFavoriteState}`
      );
      return newFavoriteState;
    } catch (error) {
      log.error("[PostsController] Failed to toggle favorite:", error);
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }
}
