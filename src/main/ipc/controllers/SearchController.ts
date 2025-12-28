import { type IpcMainInvokeEvent } from "electron";
import { safeStorage } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getProvider } from "../../providers";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import type { BooruPost } from "../../providers/types";
import type { Post } from "../../db/schema";
import { SearchPostsSchema } from "../../../shared/schemas/search";
import { toIpcSafe } from "../../utils/ipc-serialization";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * IPC-safe Post type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 */
type IpcPost = {
  [K in keyof Post]: Post[K] extends Date
    ? number
    : Post[K] extends Date | null
    ? number | null
    : Post[K];
};

// Internal type alias
type SearchPostsParams = z.infer<typeof SearchPostsSchema>;

/**
 * Search Controller
 *
 * Handles IPC operations for external Booru API search:
 * - Search posts by tags (bypasses local database, queries external API directly)
 */
export class SearchController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  /**
   * Setup IPC handlers for search operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.API.SEARCH_POSTS,
      z.tuple([SearchPostsSchema]),
      this.search.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    log.info("[SearchController] All handlers registered");
  }

  /**
   * Get decrypted settings (userId, apiKey) for provider authentication
   *
   * @returns Decrypted settings or null if not available
   */
  private async getDecryptedSettings(): Promise<{
    userId: string;
    apiKey: string;
  } | null> {
    try {
      const db = this.getDb();
      const settingsRecord = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });

      if (!settingsRecord) {
        log.warn("[SearchController] No settings found in database");
        return null;
      }

      let realApiKey = settingsRecord.encryptedApiKey || "";
      if (realApiKey && safeStorage.isEncryptionAvailable()) {
        try {
          const buff = Buffer.from(realApiKey, "base64");
          realApiKey = safeStorage.decryptString(buff);
        } catch (e) {
          log.warn("[SearchController] Failed to decrypt API Key.", e);
          realApiKey = settingsRecord.encryptedApiKey || "";
        }
      }

      return {
        userId: settingsRecord.userId || "",
        apiKey: realApiKey,
      };
    } catch (error) {
      log.error("[SearchController] Error fetching settings:", error);
      return null;
    }
  }

  /**
   * Convert BooruPost to Post format for frontend compatibility
   *
   * External posts don't have database IDs or artistId, so we use sentinel values:
   * - id: Uses external postId (unique, won't conflict with DB auto-increment IDs)
   * - artistId: Uses 0 as sentinel value (indicates external post, not in database)
   *
   * @param booruPost - Post from external Booru API
   * @returns Post-compatible object
   */
  private mapBooruPostToPost(booruPost: BooruPost): Post {
    return {
      id: booruPost.id, // Use external postId as id (unique, won't conflict)
      postId: booruPost.id,
      artistId: 0, // Sentinel value for external posts (not in database)
      fileUrl: booruPost.fileUrl,
      previewUrl: booruPost.previewUrl,
      sampleUrl: booruPost.sampleUrl,
      title: "",
      rating: booruPost.rating,
      tags: booruPost.tags.join(" "), // Convert array to space-separated string
      publishedAt: booruPost.createdAt,
      createdAt: booruPost.createdAt,
      isViewed: false,
      isFavorited: false,
    };
  }

  /**
   * Search posts via external Booru API
   *
   * @param _event - IPC event (unused)
   * @param params - Search parameters: tags (array), page, limit (optional)
   * @returns Array of posts in Post format
   * @throws {Error} If API request fails
   */
  private async search(
    _event: IpcMainInvokeEvent,
    params: SearchPostsParams
  ): Promise<IpcPost[]> {
    const { tags, page, limit = 50 } = params;

    try {
      // Get provider (default to rule34)
      const provider = getProvider("rule34");

      // Get decrypted settings for authentication
      const settings = await this.getDecryptedSettings();
      const providerSettings = {
        userId: settings?.userId || "",
        apiKey: settings?.apiKey || "",
      };

      // Convert tags array to space-separated string (provider expects string)
      const tagsString = tags.join(" ");

      log.info(
        `[SearchController] Searching for tags: "${tagsString}" (page ${page}, limit ${limit})`
      );

      // Fetch posts from external API
      const booruPosts = await provider.fetchPosts(
        tagsString,
        page,
        providerSettings
      );

      log.info(
        `[SearchController] Retrieved ${booruPosts.length} posts from external API`
      );

      // Convert BooruPost[] to Post[] format
      const posts = booruPosts.map((booruPost) =>
        this.mapBooruPostToPost(booruPost)
      );

      // Convert Date objects to numbers for Electron 39+ IPC serialization
      return toIpcSafe(posts) as IpcPost[];
    } catch (error) {
      log.error("[SearchController] Failed to search posts:", error);
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }
}


