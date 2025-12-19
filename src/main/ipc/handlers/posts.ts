import { ipcMain } from "electron";
import { z } from "zod";
import { IPC_CHANNELS } from "../channels";
import { PostsService } from "../../services/posts.service";
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

const UpdatePostSchema = z.object({
  postId: z.number().int().positive(),
  changes: z
    .object({
      rating: z.string().optional(),
      tags: z.string().optional(),
      title: z.string().optional(),
      isViewed: z.boolean().optional(),
      isFavorited: z.boolean().optional(),
      fileUrl: z.string().optional(),
      previewUrl: z.string().optional(),
      sampleUrl: z.string().optional(),
    })
    .partial(),
});

export const registerPostHandlers = (service: PostsService) => {
  ipcMain.handle(IPC_CHANNELS.DB.GET_POSTS, async (_, payload: unknown) => {
    const validation = GetPostsSchema.safeParse(payload);
    if (!validation.success)
      throw new Error(`Validation Error: ${validation.error.message}`);

    const { artistId, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    try {
      return await service.getByArtist({ artistId, limit, offset });
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

        // Call the service with optional ID
        const total = await service.getCountByArtist(artistId);

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
      await service.markAsViewed(result.data);
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

        return await service.toggleFavorite(result.data);
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
        return await service.togglePostViewed(result.data);
      } catch (error) {
        logger.error(`[IPC] Failed to toggle post viewed`, error);
        return false;
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.DB.UPDATE_POST, async (_, payload: unknown) => {
    const validation = UpdatePostSchema.safeParse(payload);
    if (!validation.success) {
      logger.warn(
        `[IPC] UPDATE_POST failed validation: ${validation.error.message}`
      );
      return false;
    }

    try {
      const { postId, changes } = validation.data;
      return await service.updatePost(postId, changes);
    } catch (error) {
      logger.error(`[IPC] Failed to update post`, error);
      return false;
    }
  });
};
