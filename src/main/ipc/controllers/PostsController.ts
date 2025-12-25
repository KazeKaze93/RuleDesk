import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, desc, count, and, like } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container } from "../../core/di/Container";
import { posts, type Post } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;

const PostFilterSchema = z
  .object({
    tags: z.string().optional(),
    rating: z.enum(["s", "q", "e"]).optional(),
    isFavorited: z.boolean().optional(),
    isViewed: z.boolean().optional(),
  })
  .partial();

const GetPostsSchema = z.object({
  artistId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  filters: PostFilterSchema.optional(),
});

// Export types for use in bridge.ts
export type GetPostsParams = z.infer<typeof GetPostsSchema>;
export type PostFilterParams = z.infer<typeof PostFilterSchema>;


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
    return container.resolve<AppDatabase>("Database");
  }

  /**
   * Setup IPC handlers for post operations
   */
  public setup(): void {
    this.handle(IPC_CHANNELS.DB.GET_POSTS, this.getPosts.bind(this));
    this.handle(IPC_CHANNELS.DB.GET_POSTS_COUNT, this.getPostsCount.bind(this));
    this.handle(IPC_CHANNELS.DB.MARK_VIEWED, this.markViewed.bind(this));

    log.info("[PostsController] All handlers registered");
  }

  /**
   * Get posts for an artist with pagination and filters
   *
   * @param _event - IPC event (unused)
   * @param payload - Request parameters: artistId, page, filters
   * @returns Array of posts
   * @throws {Error} If validation fails or database operation fails
   */
  private async getPosts(
    _event: IpcMainInvokeEvent,
    payload: unknown
  ): Promise<Post[]> {
    const validation = GetPostsSchema.safeParse(payload);
    if (!validation.success) {
      log.error(
        "[PostsController] Invalid get posts payload:",
        validation.error.errors
      );
      throw new Error(
        `Validation failed: ${validation.error.errors.map((e) => e.message).join(", ")}`
      );
    }

    const { artistId, page, filters } = validation.data;
    const limit = 50; // Default page size
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

      // Build where conditions
      const conditions = [eq(posts.artistId, artistId)];

      if (filters) {
        if (filters.tags !== undefined) {
          const searchPattern = `%${filters.tags}%`;
          conditions.push(like(posts.tags, searchPattern));
        }

        if (filters.rating !== undefined) {
          conditions.push(eq(posts.rating, filters.rating));
        }

        if (filters.isFavorited !== undefined) {
          conditions.push(eq(posts.isFavorited, filters.isFavorited));
        }

        if (filters.isViewed !== undefined) {
          conditions.push(eq(posts.isViewed, filters.isViewed));
        }
      }

      const whereClause =
        conditions.length > 1 ? and(...conditions) : conditions[0];

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
      throw new Error("Failed to fetch posts");
    }
  }

  /**
   * Get posts count for an artist (or all posts if artistId is not provided)
   *
   * @param _event - IPC event (unused)
   * @param artistId - Artist ID (legacy format: direct number or undefined, not object)
   * @returns Number of posts
   */
  private async getPostsCount(
    _event: IpcMainInvokeEvent,
    artistId: unknown
  ): Promise<number> {
    // Legacy format: artistId is passed directly as number or undefined, not as object
    const countSchema = z.number().int().positive().optional().nullable();
    const validArtistId =
      artistId !== undefined && artistId !== null
        ? countSchema.parse(artistId) ?? undefined
        : undefined;

    try {
      const db = this.getDb();
      const whereClause = validArtistId ? eq(posts.artistId, validArtistId) : undefined;

      const result = await db
        .select({ value: count() })
        .from(posts)
        .where(whereClause);

      const total = result[0]?.value ?? 0;

      log.info(
        `[PostsController] Posts count: ${total} ${
          validArtistId ? `for artist ${validArtistId}` : "(all artists)"
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
   * @param postId - Post ID (legacy format: direct number, not object)
   * @returns true if update succeeded
   * @throws {Error} If validation fails or update fails}
   */
  private async markViewed(
    _event: IpcMainInvokeEvent,
    postId: unknown
  ): Promise<boolean> {
    // Legacy format: postId is passed directly as number, not as object
    const validation = z.number().int().positive().safeParse(postId);
    if (!validation.success) {
      log.error("[PostsController] Invalid mark viewed postId:", postId);
      return false;
    }

    try {
      const db = this.getDb();
      await db
        .update(posts)
        .set({ isViewed: true })
        .where(eq(posts.id, validation.data));

      log.info(
        `[PostsController] Post ${validation.data} marked as viewed`
      );
      return true;
    } catch (error) {
      log.error("[PostsController] Failed to mark post as viewed:", error);
      return false;
    }
  }
}

