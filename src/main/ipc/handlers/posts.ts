import { ipcMain } from "electron";
import { z } from "zod";
import { IPC_CHANNELS } from "../channels";
import { PostsService } from "../../services/posts.service";
import { logger } from "../../lib/logger";

// --- Schemas ---

const PostFilterSchema = z
  .object({
    tags: z.string().optional(),
    rating: z.enum(["s", "q", "e"]).optional(),
    isFavorited: z.boolean().optional(),
    isViewed: z.boolean().optional(),
  })
  .partial();

const GetPostsSchema = z.object({
  artistId: z.number().optional(),
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

// Reusable schema for simple ID operations
const PostIdSchema = z.number().int().positive();

const CountSchema = z.object({
  artistId: z.number().optional(),
  filters: PostFilterSchema.optional(),
});

// --- Handlers ---

export const registerPostHandlers = (service: PostsService) => {
  // 1. GET POSTS
  ipcMain.handle(IPC_CHANNELS.DB.GET_POSTS, async (_, payload: unknown) => {
    const validation = GetPostsSchema.safeParse(payload);
    if (!validation.success) {
      logger.error(`Validation Error [GET_POSTS]: ${validation.error.message}`);
      throw new Error(`Validation Error: ${validation.error.message}`);
    }

    const { artistId, page, limit, filters } = validation.data;
    const offset = (page - 1) * limit;

    try {
      return await service.getPosts({
        artistId,
        limit,
        offset,
        filters,
      });
    } catch (error) {
      logger.error(`IPC: [db:get-posts] error:`, error);
      throw new Error("Failed to fetch posts.");
    }
  });

  // 2. GET COUNT
  ipcMain.handle(
    IPC_CHANNELS.DB.GET_POSTS_COUNT,
    async (_, payload: unknown) => {
      // Пытаемся распарсить как объект фильтров
      const complexValidation = CountSchema.safeParse(payload);

      // Пытаемся распарсить как просто число (легаси вызовы)
      const numberValidation = PostIdSchema.safeParse(payload);

      let params: {
        artistId?: number;
        filters?: z.infer<typeof PostFilterSchema>;
      } = {};

      if (complexValidation.success) {
        params = complexValidation.data;
      } else if (numberValidation.success) {
        params = { artistId: numberValidation.data };
      }

      try {
        return await service.getPostsCount(params);
      } catch (err) {
        logger.error("Failed to get posts count:", err);
        return 0;
      }
    }
  );

  // 3. UPDATE POST
  ipcMain.handle(IPC_CHANNELS.DB.UPDATE_POST, async (_, payload: unknown) => {
    const validation = UpdatePostSchema.safeParse(payload);
    if (!validation.success) {
      logger.warn(
        `[IPC] UPDATE_POST validation failed: ${validation.error.message}`
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

  // 4. TOGGLE FAVORITE
  ipcMain.handle(
    IPC_CHANNELS.DB.TOGGLE_FAVORITE,
    async (_, payload: unknown) => {
      const validation = PostIdSchema.safeParse(payload);

      if (!validation.success) {
        logger.warn(
          `[IPC] TOGGLE_FAVORITE invalid ID: ${JSON.stringify(payload)}`
        );
        return false;
      }

      try {
        // TypeScript теперь проверит наличие метода в интерфейсе PostsService
        return await service.toggleFavorite(validation.data);
      } catch (error) {
        logger.error(
          `[IPC] Failed to toggle favorite for post ${validation.data}`,
          error
        );
        return false;
      }
    }
  );

  // 5. MARK VIEWED
  ipcMain.handle(IPC_CHANNELS.DB.MARK_VIEWED, async (_, payload: unknown) => {
    const validation = PostIdSchema.safeParse(payload);

    if (!validation.success) {
      return false;
    }

    try {
      // Используем штатный метод updatePost, который гарантированно существует
      return await service.updatePost(validation.data, { isViewed: true });
    } catch (error) {
      logger.error(
        `[IPC] Failed to mark post as viewed ${validation.data}`,
        error
      );
      return false;
    }
  });

  // 6. RESET CACHE
  ipcMain.handle(
    IPC_CHANNELS.DB.RESET_POST_CACHE,
    async (_, payload: unknown) => {
      const validation = PostIdSchema.safeParse(payload);
      if (validation.success) {
        logger.info(`[IPC] Reset cache requested for post ${validation.data}`);
      }
      return true;
    }
  );
};
