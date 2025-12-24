import { ipcMain } from "electron";
import { z } from "zod";
import { eq, desc, count, sql } from "drizzle-orm";
import { IPC_CHANNELS } from "../channels";
import { getDb } from "../../db/client";
import { posts } from "../../db/schema";
import { logger } from "../../lib/logger";

const PostFilterSchema = z
  .object({
    tags: z.string().optional(),
    rating: z.enum(["s", "q", "e"]).optional(),
    isFavorited: z.boolean().optional(),
  })
  .partial();

const GetPostsSchema = z.object({
  artistId: z.number(),
  page: z.number().default(1),
  limit: z.number().int().min(1).default(50),
  filters: PostFilterSchema.optional(),
});

export const registerPostHandlers = () => {
  ipcMain.handle(IPC_CHANNELS.DB.GET_POSTS, async (_, payload: unknown) => {
    const validation = GetPostsSchema.safeParse(payload);
    if (!validation.success)
      throw new Error(`Validation Error: ${validation.error.message}`);

    const { artistId, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    try {
      const db = getDb();
      return await db.query.posts.findMany({
        where: eq(posts.artistId, artistId),
        orderBy: [desc(posts.postId)],
        limit,
        offset,
      });
    } catch (error) {
      logger.error(`IPC: [db:get-posts] error:`, error);
      throw new Error("Failed to fetch posts.");
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.DB.GET_POSTS_COUNT,
    async (_, payload: unknown) => {
      try {
        // Schema should allow optional number, null, or undefined
        const countSchema = z.number().int().positive().optional().nullable();

        // Parse payload, but allow it to be undefined
        const artistId =
          payload !== undefined && payload !== null
            ? countSchema.parse(payload) ?? undefined
            : undefined;

        const db = getDb();
        const whereClause = artistId ? eq(posts.artistId, artistId) : undefined;
        const result = await db
          .select({ value: count() })
          .from(posts)
          .where(whereClause);
        const total = result[0]?.value ?? 0;

        console.log(
          `[IPC] Count requested. Filter: ${
            artistId || "ALL"
          }. Result: ${total}`
        );
        return total;
      } catch (err) {
        console.error("Failed to get posts count:", err);
        return 0;
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.DB.MARK_VIEWED, async (_, postId: unknown) => {
    const result = z.number().int().positive().safeParse(postId);
    if (!result.success) return false;

    try {
      const db = getDb();
      await db
        .update(posts)
        .set({ isViewed: true })
        .where(eq(posts.id, result.data));
      return true;
    } catch (error) {
      logger.error(`[IPC] Failed to mark post viewed`, error);
      return false;
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.DB.TOGGLE_FAVORITE,
    async (_, postId: unknown) => {
      try {
        const result = z.number().int().positive().safeParse(postId);
        if (!result.success) {
          logger.warn(
            `[IPC] TOGGLE_FAVORITE failed validation for postId: ${postId}`
          );
          return false;
        }

        const db = getDb();
        const updateResult = await db
          .update(posts)
          .set({ isFavorited: sql`NOT ${posts.isFavorited}` })
          .where(eq(posts.id, result.data))
          .returning({ isFavorited: posts.isFavorited });

        return updateResult[0]?.isFavorited ?? false;
      } catch (error) {
        logger.error(`[IPC] Failed to toggle post favorite`, error);
        return false;
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.DB.TOGGLE_POST_VIEWED,
    async (_, postId: unknown) => {
      const result = z.number().int().positive().safeParse(postId);
      if (!result.success) {
        logger.warn(
          `Validation failed for togglePostViewed: ${result.error.message}`
        );
        return false;
      }

      try {
        const db = getDb();
        const updateResult = await db
          .update(posts)
          .set({ isViewed: sql`NOT ${posts.isViewed}` })
          .where(eq(posts.id, result.data))
          .returning({ isViewed: posts.isViewed });

        return updateResult[0]?.isViewed ?? false;
      } catch (error) {
        logger.error(`[IPC] Failed to toggle post viewed`, error);
        return false;
      }
    }
  );
};
