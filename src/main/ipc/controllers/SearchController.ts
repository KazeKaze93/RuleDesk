import { type IpcMainInvokeEvent } from "electron";
import { safeStorage } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID, posts } from "../../db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getProvider } from "../../providers";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import type { BooruPost } from "../../providers/types";
import type { Post } from "../../db/schema";
import { SearchPostsSchema } from "../../../shared/schemas/search";
import { toIpcSafe } from "../../utils/ipc-serialization";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";

type AppDatabase = BetterSQLite3Database<typeof schema>;

// Internal type alias
type SearchPostsParams = z.infer<typeof SearchPostsSchema>;

// Use toIpcSafe return type instead of manual type definition
// This ensures type safety and automatic updates when Post schema changes
type IpcPost = ReturnType<typeof toIpcSafe<Post>>;

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
   * - id: Uses negative external postId to avoid conflicts with DB PRIMARY KEY (autoincrement starts from 1)
   *   This ensures no collision with local posts, as DB IDs are always positive.
   * - artistId: Uses EXTERNAL_ARTIST_ID sentinel value (indicates external post, not in database)
   *
   * @param booruPost - Post from external Booru API
   * @returns Post-compatible object
   */
  private mapBooruPostToPost(booruPost: BooruPost): Post {
    return {
      id: -booruPost.id, // CRITICAL: Use negative ID to avoid collision with DB PRIMARY KEY
      postId: booruPost.id,
      artistId: EXTERNAL_ARTIST_ID, // Sentinel value for external posts (not in database)
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
      // Empty array means show all posts (provider will omit tags parameter)
      const tagsString = tags.length > 0 ? tags.join(" ") : "";

      log.debug(
        `[SearchController] Searching for tags: "${tagsString || "all (no filter)"}" (page ${page}, limit ${limit})`
      );

      // Fetch posts from external API
      // Empty tagsString means show all posts (provider omits tags parameter)
      const booruPosts = await provider.fetchPosts(
        tagsString,
        page,
        providerSettings
      );

      log.debug(
        `[SearchController] Retrieved ${booruPosts.length} posts from external API`
      );

      // Extract postIds from API results for local DB lookup
      const postIds = booruPosts.map((booruPost) => booruPost.id);

      // Fetch local DB state (isFavorite, isViewed) for these posts
      // Search by postId and artistId = EXTERNAL_ARTIST_ID (external posts from Browse)
      const db = this.getDb();
      let localPostsState: Map<number, { isFavorited: boolean; isViewed: boolean }> = new Map();

      if (postIds.length > 0) {
        // Use synchronous select query (better-sqlite3 is synchronous)
        const localPosts = db
          .select({
            postId: posts.postId,
            isFavorited: posts.isFavorited,
            isViewed: posts.isViewed,
          })
          .from(posts)
          .where(
            and(
              inArray(posts.postId, postIds),
              eq(posts.artistId, EXTERNAL_ARTIST_ID) // External posts from Browse have EXTERNAL_ARTIST_ID
            )
          )
          .all();

        // Create Map for O(1) lookup
        localPostsState = new Map(
          localPosts.map((p) => [
            p.postId,
            {
              isFavorited: p.isFavorited ?? false,
              isViewed: p.isViewed ?? false,
            },
          ])
        );

        log.debug(
          `[SearchController] Found ${localPosts.length} posts in local DB out of ${postIds.length} from API`
        );
      }

      // Convert BooruPost[] to Post[] format and merge with local DB state
      const enrichedPosts = booruPosts.map((booruPost) => {
        const mappedPost = this.mapBooruPostToPost(booruPost);
        const localState = localPostsState.get(booruPost.id);

        // Merge local state if found, otherwise use defaults (false)
        return {
          ...mappedPost,
          isFavorited: localState?.isFavorited ?? false,
          isViewed: localState?.isViewed ?? false,
        };
      });

      // Sort posts by publishedAt descending (newest first) to match Rule34.xxx website order
      // API may return posts in different order, so we sort them explicitly
      // publishedAt is a Date object at this point (before toIpcSafe conversion)
      enrichedPosts.sort((a, b) => {
        const dateA = a.publishedAt instanceof Date ? a.publishedAt.getTime() : 0;
        const dateB = b.publishedAt instanceof Date ? b.publishedAt.getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

      // Convert Date objects to numbers for Electron 39+ IPC serialization
      // toIpcSafe correctly infers the return type, no cast needed
      return toIpcSafe(enrichedPosts);
    } catch (error) {
      log.error("[SearchController] Failed to search posts:", error);
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }
}


