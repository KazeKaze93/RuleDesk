import { ipcMain } from "electron";
import { z } from "zod";
import { IPC_CHANNELS } from "../channels";
import { PostsRepository } from "../../db/repositories/posts.repo";
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

export const registerPostHandlers = (repo: PostsRepository) => {
  ipcMain.handle(IPC_CHANNELS.DB.GET_POSTS, async (_, payload: unknown) => {
    const validation = GetPostsSchema.safeParse(payload);
    if (!validation.success)
      throw new Error(`Validation Error: ${validation.error.message}`);

    const { artistId, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    try {
      return await repo.getByArtist({ artistId, limit, offset });
    } catch (error) {
      logger.error(`IPC: [db:get-posts] error:`, error);
      throw new Error("Failed to fetch posts.");
    }
  });

  ipcMain.handle(IPC_CHANNELS.DB.MARK_VIEWED, async (_, postId: unknown) => {
    const result = z.number().int().positive().safeParse(postId);
    if (!result.success) return false;

    try {
      await repo.markAsViewed(result.data);
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

        return await repo.toggleFavorite(result.data);
      } catch (error) {
        logger.error(`[IPC] Failed to toggle post favorite`, error);
        return false;
      }
    }
  );
};
