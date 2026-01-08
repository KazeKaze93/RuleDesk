import { type IpcMainInvokeEvent } from "electron";
import { safeStorage } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID, posts, tagMetadata } from "../../db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
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

    this.handle(
      IPC_CHANNELS.API.RESOLVE_TAGS,
      z.tuple([z.array(z.string().min(1))]), // No limit - process all tags to find artists regardless of position
      this.resolveTags.bind(this) as (
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

  /**
   * Parse XML response from Rule34 DAPI tag endpoint
   * @param text - Raw XML response text
   * @param tagName - Requested tag name for filtering
   * @returns Array of parsed tag objects with name and type
   */
  private parseTagXmlResponse(
    text: string,
    tagName: string
  ): Array<{ name: string; type: number; id?: number }> {
    const items: Array<{ name: string; type: number; id?: number }> = [];
    
    // Parse XML: <tag id="123" name="aiyor" count="100" type="1"/>
    // Also handle: <tag id="123" name="aiyor" count="100" type="1"></tag>
    // Extract all <tag> elements (both self-closing and with closing tag)
    const tagRegex = /<tag\s+([^>]+)(?:\/>|>)/g;
    const matches = [...text.matchAll(tagRegex)];
    
    for (const match of matches) {
      const attrs = match[1];
      // Extract attributes: id="123" name="aiyor" type="1"
      // Handle both single and double quotes
      const idMatch = attrs.match(/id\s*=\s*["'](\d+)["']/);
      const nameMatch = attrs.match(/name\s*=\s*["']([^"']+)["']/);
      const typeMatch = attrs.match(/type\s*=\s*["'](\d+)["']/);
      
      if (nameMatch && typeMatch) {
        const parsedName = nameMatch[1];
        const parsedType = parseInt(typeMatch[1], 10);
        
        // Only add if name matches requested tag (case-insensitive)
        if (parsedName.toLowerCase() === tagName.toLowerCase()) {
          items.push({
            id: idMatch ? parseInt(idMatch[1], 10) : undefined,
            name: parsedName,
            type: parsedType,
          });
        }
      }
    }
    
    return items;
  }

  /**
   * Resolve tags to identify artist tags (type=1) from Rule34 API
   * 
   * Uses persistent SQLite cache to avoid redundant API calls.
   * Logic flow:
   * 1. Check local DB cache for requested tags
   * 2. Fetch only missing tags from API (batch requests of 10 to keep URL length safe)
   * 3. Save new tags to cache for future use
   * 4. Return only artist tags (type=1)
   * 
   * Uses decrypted credentials from settings for authentication.
   * 
   * Network optimization:
   * - Only queries API for tags not in local cache (missingTags)
   * - Batches requests in groups of 10 to keep URL length manageable
   * - URL parameters: page='dapi', s='tag', q='index', json='1', names=...
   * - Does NOT send 'limit' (default 100 is fine for batch of 10)
   * - Does NOT send 'tags' (that parameter is for posts endpoint, not tags endpoint)
   * 
   * Note: No limit on input tag count - all tags are processed to ensure artist tags
   * are found even if they appear beyond position 20 in the tag list.
   *
   * @param _event - IPC event (unused)
   * @param tags - Array of tag names to resolve (no limit, all processed)
   * @returns Array of tag names that are artists (type=1)
   */
  private async resolveTags(
    _event: IpcMainInvokeEvent,
    tags: string[]
  ): Promise<string[]> {
    try {
      if (!tags || tags.length === 0) {
        return [];
      }

      // Normalize tags (lowercase, unique) - process ALL tags, no arbitrary limits
      const uniqueTags = [...new Set(tags.filter(Boolean).map(t => t.toLowerCase().trim()))];
      if (uniqueTags.length === 0) {
        return [];
      }

      const db = this.getDb();

      // 1. Check local DB cache first - avoid unnecessary API calls
      const cachedTags = db
        .select()
        .from(tagMetadata)
        .where(inArray(tagMetadata.name, uniqueTags))
        .all();

      const cachedMap = new Map(cachedTags.map(t => [t.name, t.type]));
      // Only query API for tags we don't have in cache
      const missingTags = uniqueTags.filter(t => !cachedMap.has(t));

      // Early return if all tags are cached
      if (missingTags.length === 0) {
        const artistTags = uniqueTags.filter(tag => cachedMap.get(tag) === 1);
        log.debug(`[SearchController] All ${uniqueTags.length} tags found in cache, returning ${artistTags.length} artists`);
        return artistTags;
      }

      log.info(`[SearchController] Resolving ${missingTags.length} missing tags from API (${cachedTags.length} found in cache)`);

      // Get decrypted settings for authentication
      const settings = await this.getDecryptedSettings();
      if (!settings) {
        log.warn("[SearchController] Cannot resolve tags: no settings available");
        return uniqueTags.filter(tag => cachedMap.get(tag) === 1);
      }

      // 2. DAPI-based resolver with individual requests
      // CRITICAL: Uses Rule34 DAPI endpoint that returns tag types
      // Endpoint: https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index&json=1
      // Parameter: name=<tag_name> (single tag per request)
      // Response: JSON array of { "id": number, "name": "string", "type": number, ... }
      // type=1 is Artist, type=0 is General, etc.
      // Process tags one by one (API doesn't support batch by name)
      for (const tagName of missingTags) {
        try {
          // Strict URL construction: only required parameters for tags endpoint
          // CRITICAL: Use 'name' parameter (single tag name), NOT 'names'
          // Do NOT add extra parameters that are not in the official API docs
          const params = new URLSearchParams({
            page: 'dapi',
            s: 'tag',
            q: 'index',
            json: '1',
            name: tagName, // Single tag name per request
          });

          if (settings.apiKey) {
            params.append('api_key', settings.apiKey);
          }
          if (settings.userId) {
            params.append('user_id', String(settings.userId));
          }

          const url = `https://api.rule34.xxx/index.php?${params.toString()}`;

          const response = await fetch(url, {
            signal: AbortSignal.timeout(10000), // 10 second timeout
            headers: {
              'User-Agent': 'RuleDesk/1.0',
              'Accept-Encoding': 'identity',
            },
          });

          if (!response.ok) {
            log.warn(`[SearchController] API returned status ${response.status} for tag "${tagName}"`);
            continue;
          }

          const text = await response.text();
          let items: Array<{ name: string; type: string | number; id?: number }> = [];

          // Handle XML response (API sometimes returns XML even with json=1)
          if (text.trim().startsWith('<')) {
            items = this.parseTagXmlResponse(text, tagName);
          } else {
            // Handle JSON response
            let data;
            try {
              data = JSON.parse(text);
            } catch (parseErr) {
              log.warn(`[SearchController] Failed to parse JSON for tag "${tagName}":`, parseErr);
              continue;
            }

            // Normalize: API can return a single object or an array
            items = Array.isArray(data) ? data : (data ? [data] : []);
          }
          
          // If no items found, skip to next tag
          if (items.length === 0) {
            continue;
          }

          // Filter and map to valid entries with correct type from API
          // CRITICAL: DAPI returns { "id": number, "name": "string", "type": number, ... }
          // type=1 is Artist, type=0 is General, etc.
          // Only process entries that match the requested tag name (case-insensitive)
          const requestedTagLower = tagName.toLowerCase();
          const entries = items
            .filter((item: unknown) => {
              // Validate item structure
              if (!item || typeof item !== 'object' || item === null) {
                return false;
              }
              // Ensure name and type exist
              if (!('name' in item) || !('type' in item)) {
                return false;
              }
              // Validate name is a non-empty string
              const name = item.name;
              if (typeof name !== 'string' || !name.trim()) {
                return false;
              }
              // CRITICAL: Only accept tags that match the requested tag name (case-insensitive)
              if (name.toLowerCase() !== requestedTagLower) {
                return false;
              }
              // Validate type is a valid number (can be string "1" or number 1)
              const type = item.type;
              const typeNum = typeof type === 'string' ? parseInt(type, 10) : Number(type);
              if (isNaN(typeNum) || typeNum < 0) {
                return false;
              }
              return true;
            })
            .map((item: { name: string; type: string | number }) => {
              // CRITICAL: Parse type as number (API may return string "1" or number 1)
              const typeNum = typeof item.type === 'string' 
                ? parseInt(item.type, 10) 
                : Number(item.type);
              
              return {
                name: String(item.name).toLowerCase().trim(),
                type: typeNum, // Correct type from API (0=General, 1=Artist, etc)
              };
            });

          if (entries.length > 0) {
            // Save to database with correct types from DAPI
            // CRITICAL: Update tagMetadata with REAL type from API (not default type=0)
            // Use onConflictDoUpdate to update type if tag already exists
            for (const entry of entries) {
              try {
                db.insert(tagMetadata)
                  .values(entry)
                  .onConflictDoUpdate({
                    target: tagMetadata.name,
                    set: { type: sql`excluded.type` }, // Update with real type from API
                  })
                  .run();
              } catch (dbErr) {
                log.error(`[SearchController] Database error for tag "${entry.name}":`, dbErr);
              }
            }

            // Update cache with correct types
            entries.forEach(e => cachedMap.set(e.name, e.type));
          }
        } catch (err) {
          log.error(`[SearchController] Error processing tag "${tagName}":`, err);
        }
      }

      // CRITICAL: Return ONLY tags where type === 1 (Artist)
      // This ensures resolvedArtistTags in the frontend actually receives artists
      const artistTags = uniqueTags.filter(tag => {
        const tagType = cachedMap.get(tag);
        return tagType === 1; // type=1 is Artist
      });
      
      // Summary log after processing all tags
      log.info(
        `[SearchController] Resolved batch: found ${artistTags.length} artist(s) out of ${uniqueTags.length} tag(s) requested`
      );

      return artistTags;
    } catch (error) {
      log.error("[SearchController] Failed to resolve tags:", error);
      return [];
    }
  }
}


