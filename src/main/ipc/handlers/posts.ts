import { ipcMain, safeStorage } from "electron";
import { z } from "zod";
import { IPC_CHANNELS } from "../channels";
import { PostsService } from "../../services/posts.service";
import { logger } from "../../lib/logger";
import { SettingsService } from "../../services/settings.service";

// --- Schemas & Interfaces ---

const GetPostsSchema = z.object({
  artistId: z.number().int(),
  page: z.number().int().default(1),
  filters: z
    .object({
      tags: z.string().optional(),
      rating: z.enum(["s", "q", "e"]).optional(),
      isFavorited: z.boolean().optional(),
    })
    .optional(),
});

const UpdatePostSchema = z.object({
  id: z.number(),
  changes: z.object({
    isViewed: z.boolean().optional(),
    isFavorited: z.boolean().optional(),
  }),
});

const GetRecentPostsSchema = z.object({
  page: z.number().default(1),
  tags: z.string().optional(),
});

interface RemotePost {
  id: number;
  postId: number;
  artistId: number;
  fileUrl: string;
  previewUrl: string;
  sampleUrl: string;
  title: string;
  rating: string;
  tags: string;
  publishedAt: Date;
  createdAt: Date;
  isViewed: boolean;
  isFavorited: boolean;
}

// --- Handlers ---

export const registerPostHandlers = (service: PostsService) => {
  // [DB] Get Posts
  ipcMain.handle(IPC_CHANNELS.DB.GET_POSTS, async (_, payload: unknown) => {
    const validation = GetPostsSchema.safeParse(payload);
    if (!validation.success) return [];
    try {
      const { artistId, page, filters } = validation.data;
      const limit = 50;
      const offset = (page - 1) * limit;
      return await service.getPosts({ artistId, filters, limit, offset });
    } catch (error) {
      logger.error("IPC: [db:get-posts] error:", error);
      return [];
    }
  });

  // [DB] Get Posts Count
  ipcMain.handle(
    IPC_CHANNELS.DB.GET_POSTS_COUNT,
    async (_, artistId: number) => {
      try {
        return await service.getPostsCount({ artistId });
      } catch (_error) {
        return 0;
      }
    }
  );

  // [DB] Update Post
  ipcMain.handle(IPC_CHANNELS.DB.UPDATE_POST, async (_, payload: unknown) => {
    const validation = UpdatePostSchema.safeParse(payload);
    if (!validation.success) return false;
    try {
      const { id, changes } = validation.data;
      await service.updatePost(id, changes);
      return true;
    } catch (_error) {
      return false;
    }
  });

  // [DB] Toggle Favorite
  ipcMain.handle(IPC_CHANNELS.DB.TOGGLE_FAVORITE, async (_, id: number) => {
    try {
      return await service.toggleFavorite(id);
    } catch (error) {
      logger.error("IPC: Failed to toggle favorite", error);
      throw error;
    }
  });

  // [DB] Mark Post Viewed
  ipcMain.handle(IPC_CHANNELS.DB.MARK_VIEWED, async (_, id: number) => {
    try {
      await service.updatePost(id, { isViewed: true });
      return true;
    } catch (error) {
      logger.error("IPC: Failed to mark post as viewed", error);
      return false;
    }
  });

  // [API] Get Recent Posts
  ipcMain.handle(
    IPC_CHANNELS.API.GET_RECENT_POSTS,
    async (_, payload: unknown) => {
      const validation = GetRecentPostsSchema.safeParse(payload);
      const { page, tags } = validation.success
        ? validation.data
        : { page: 1, tags: "" };

      try {
        const pid = Math.max(0, page - 1);
        const limit = 100;
        const baseUrl = "https://api.rule34.xxx/index.php";

        const queryTags = tags && tags.trim().length > 0 ? tags : "all";

        const params = new URLSearchParams({
          page: "dapi",
          s: "post",
          q: "index",
          limit: limit.toString(),
          pid: pid.toString(),
          // json: "1" УБРАН, чтобы получать XML
          tags: queryTags,
        });

        const settingsService = new SettingsService();
        const settings = await settingsService.getSettings();

        if (settings.userId && settings.encryptedApiKey) {
          params.append("user_id", settings.userId);
          if (safeStorage.isEncryptionAvailable()) {
            try {
              const decrypted = safeStorage.decryptString(
                Buffer.from(settings.encryptedApiKey, "base64")
              );
              params.append("api_key", decrypted);
            } catch (e) {
              logger.warn("Failed to decrypt API key for browse", e);
            }
          }
        }

        const url = `${baseUrl}?${params.toString()}`;
        logger.info(`IPC: Fetching remote posts (XML): ${url}`);

        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        if (!response.ok) return [];

        const xmlText = await response.text();
        const posts: RemotePost[] = [];

        const rawParts = xmlText.split("<post ");

        for (let i = 1; i < rawParts.length; i++) {
          const part = rawParts[i];

          // FIX: Строгий Regex. Ищет name="value", где перед name начало строки или пробел.
          // Это предотвращает нахождение 'id' внутри 'parent_id' или 'creator_id'.
          const getAttr = (name: string) => {
            const regex = new RegExp(`(?:^|\\s)${name}="([^"]*)"`);
            const match = part.match(regex);
            return match ? match[1] : "";
          };

          const id = getAttr("id");
          const fileUrl = getAttr("file_url");

          // Если id или fileUrl не найдены - пост пропускается.
          // Теперь, благодаря исправленному Regex, id будет находиться корректно.
          if (id && fileUrl) {
            posts.push({
              id: Number(id),
              postId: Number(id),
              artistId: 0,
              fileUrl: fileUrl,
              previewUrl: getAttr("preview_url") || fileUrl,
              sampleUrl: getAttr("sample_url") || fileUrl,
              title: "",
              rating: getAttr("rating") || "q",
              tags: getAttr("tags"),
              publishedAt: new Date(
                Number(getAttr("change") || Date.now() / 1000) * 1000
              ),
              createdAt: new Date(),
              isViewed: false,
              isFavorited: false,
            });
          }
        }

        logger.info(
          `IPC: Parsed ${posts.length} posts from XML (Split Method)`
        );
        return posts;
      } catch (error) {
        logger.error("IPC: [api:get-recent-posts] error:", error);
        return [];
      }
    }
  );
};
