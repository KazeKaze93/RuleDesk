import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, desc, count, and, like } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_KEYS } from "../../core/di/Container";
import { posts, type Post } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;

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
  artistId: z.number().int().positive(),
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
    return container.resolve<AppDatabase>(DI_KEYS.DB);
  }

  /**
   * Setup IPC handlers for post operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS,
      z.tuple([GetPostsSchema]),
      this.getPosts.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS_COUNT,
      z.tuple([z.number().int().positive().optional()]),
      this.getPostsCount.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.MARK_VIEWED,
      z.tuple([z.number().int().positive()]),
      this.markViewed.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );

    log.info("[PostsController] All handlers registered");
  }

  /**
   * Get posts for an artist with pagination and filters
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters: artistId, page, filters, limit
   * @returns Array of posts
   * @throws {Error} If database operation fails
   */
  private async getPosts(
    _event: IpcMainInvokeEvent,
    params: GetPostsParams
  ): Promise<Post[]> {
    const { artistId, page, filters, limit } = params;
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

      // Build where conditions: start with base condition
      const baseCondition = eq(posts.artistId, artistId);

      // Add optional filter conditions
      const filterConditions: ReturnType<typeof eq | typeof like>[] = [];
      if (filters?.tags !== undefined) {
        filterConditions.push(like(posts.tags, `%${filters.tags}%`));
      }
      if (filters?.rating !== undefined) {
        filterConditions.push(eq(posts.rating, filters.rating));
      }
      if (filters?.isFavorited !== undefined) {
        filterConditions.push(eq(posts.isFavorited, filters.isFavorited));
      }
      if (filters?.isViewed !== undefined) {
        filterConditions.push(eq(posts.isViewed, filters.isViewed));
      }

      // Combine conditions: if filters exist, use AND; otherwise just base condition
      const whereClause =
        filterConditions.length > 0
          ? and(baseCondition, ...filterConditions)
          : baseCondition;

      const result = await db.query.posts.findMany({
        where: whereClause,
        orderBy: [desc(posts.publishedAt)],
        limit,
        offset,
      });

      log.info(
        `[PostsController] Retrieved ${result.length} posts for artist ${artistId} (page ${page})`
      );
      return result;
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
}

