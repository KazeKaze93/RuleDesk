import { type IpcMainInvokeEvent } from "electron";
import { safeStorage } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID, posts, tagMetadata, TAG_TYPES, type TagType } from "../../db/schema";
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
import { XMLParser } from "fast-xml-parser";

type AppDatabase = BetterSQLite3Database<typeof schema>;

// Zod schema for Rule34 DAPI tag response validation
const R34TagResponseSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  type: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
    if (isNaN(num) || num < 0) {
      throw new z.ZodError([{
        code: 'custom',
        path: ['type'],
        message: 'Invalid type value',
      }]);
    }
    return num;
  }),
}).passthrough(); // Allow additional fields from API

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
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.search.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.API.RESOLVE_TAGS,
      z.tuple([z.array(z.string().min(1)).max(100)]), // Limit to 100 tags to prevent DoS
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.resolveTags.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.API.RESOLVE_CHARACTER_TAGS,
      z.tuple([z.array(z.string().min(1)).max(100)]), // Limit to 100 tags to prevent DoS
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.resolveCharacterTags.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.API.RESOLVE_COPYRIGHT_TAGS,
      z.tuple([z.array(z.string().min(1)).max(100)]), // Limit to 100 tags to prevent DoS
      (event, ...args) => {
        // Validate args with Zod instead of unsafe casting
        const schema = z.tuple([z.array(z.string().min(1)).max(100)]);
        const result = schema.safeParse(args);
        if (!result.success) {
          log.error("[SearchController] Invalid args for RESOLVE_COPYRIGHT_TAGS:", result.error);
          return Promise.resolve([]);
        }
        const [tags] = result.data;
        return this.resolveTagsByType(event, tags, TAG_TYPES.COPYRIGHT);
      }
    );

    this.handle(
      IPC_CHANNELS.API.RESOLVE_TAGS_BY_TYPE,
      z.tuple([
        z.array(z.string().min(1)).max(100), // tags
        z.number().int().refine((val): val is TagType => {
          // Use TAG_TYPES constants instead of magic numbers
          // Type guard ensures val is TagType if validation passes
          const tagTypeValues = Object.values(TAG_TYPES) as number[];
          return tagTypeValues.includes(val);
        }, { message: "Invalid tag type. Must be one of TAG_TYPES values." }), // type
      ]),
      (event, ...args) => {
        // BaseController already validated args with Zod schema above
        // TypeScript doesn't know the validated type, so we extract with type assertion
        // This is safe because BaseController.parse() guarantees the shape matches the schema
        const [tags, tagType] = args as [string[], TagType];
        return this.resolveTagsByType(event, tags, tagType);
      }
    );

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
    const { tags, page } = params;

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
      // Use provider.formatTag() for consistent normalization (same as SyncService)
      // This ensures lowercase conversion and space-to-underscore replacement
      // Empty array means show all posts (provider will omit tags parameter)
      let tagsString = tags.length > 0 
        ? tags.map(tag => provider.formatTag(tag, "tag")).join(" ")
        : "";

      // Step 1: Primary Search - try original tags
      let booruPosts = await provider.fetchPosts(
        tagsString,
        page,
        providerSettings
      );

      // Step 2: Fallback Logic (only if Step 1 returned 0 AND input is a single word)
      if (booruPosts.length === 0 && tagsString && tags.length === 1) {
        const originalTag = tags[0].trim();
        
        // Attempt A: Autocomplete (Fix Aliases)
        // Use provider abstraction instead of direct URL access
        try {
          const autocompleteResults = await provider.searchTags(originalTag);
          
          if (autocompleteResults.length > 0) {
            const suggestion = autocompleteResults[0].value.trim();
            
            // If suggestion is different from original, retry with suggestion
            if (suggestion.toLowerCase() !== originalTag.toLowerCase()) {
              // Use provider.formatTag() for consistent normalization
              const suggestionString = provider.formatTag(suggestion, "tag");
              booruPosts = await provider.fetchPosts(
                suggestionString,
                page,
                providerSettings
              );
              
              if (booruPosts.length > 0) {
                tagsString = suggestionString; // Update for logging
              }
            }
          }
        } catch (_autocompleteError) {
          // Autocomplete check failed, continue with other fallback attempts
        }

        // Attempt B: User Account Search (if Attempt A failed or returned same tag)
        if (booruPosts.length === 0 && !originalTag.toLowerCase().startsWith('user:')) {
          // Use provider.formatTag() to ensure consistent formatting (same as SyncService)
          // This handles lowercase conversion and space-to-underscore replacement
          const formattedUserTag = provider.formatTag(originalTag, "uploader");
          
          try {
            booruPosts = await provider.fetchPosts(
              formattedUserTag,
              page,
              providerSettings
            );
            
            if (booruPosts.length > 0) {
              tagsString = formattedUserTag; // Update for logging
            }
          } catch (_userSearchError) {
            // Uploader retry failed, continue
          }
        }
      }
      

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
   * Parse XML response from Rule34 DAPI tag endpoint using fast-xml-parser
   * @param text - Raw XML response text
   * @param tagName - Requested tag name for filtering
   * @returns Array of parsed tag objects with name and type
   */
  private parseTagXmlResponse(
    text: string,
    tagName: string
  ): Array<{ name: string; type: number; id?: number }> {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
        trimValues: true,
      });
      
      const parsed = parser.parse(text);
      
      // Handle different XML structures: <tags><tag .../></tags> or <tag .../>
      const tags = parsed.tags?.tag || parsed.tag || [];
      const tagArray = Array.isArray(tags) ? tags : [tags];
      
      const items: Array<{ name: string; type: number; id?: number }> = [];
      const requestedTagLower = tagName.toLowerCase();
      
      for (const tag of tagArray) {
        if (!tag || typeof tag !== 'object') continue;
        
        const name = tag["@_name"] || tag.name;
        const type = tag["@_type"] || tag.type;
        const id = tag["@_id"] || tag.id;
        
        if (name && type !== undefined) {
          const parsedName = String(name).trim();
          const parsedType = typeof type === 'number' ? type : parseInt(String(type), 10);
          
          // Only add if name matches requested tag (case-insensitive)
          if (parsedName.toLowerCase() === requestedTagLower) {
            items.push({
              id: id !== undefined ? (typeof id === 'number' ? id : parseInt(String(id), 10)) : undefined,
              name: parsedName,
              type: parsedType,
            });
          }
        }
      }
      
      return items;
    } catch (error) {
      log.warn(`[SearchController] Failed to parse XML response for tag "${tagName}":`, error);
      return [];
    }
  }

  /**
   * Resolve tags to identify artist tags (type=1) from Rule34 API
   * 
   * Uses persistent SQLite cache to avoid redundant API calls.
   * Logic flow:
   * 1. Check local DB cache for requested tags
   * 2. Fetch only missing tags from API (batch requests with CONCURRENCY_LIMIT)
   * 3. Save new tags to cache for future use
   * 4. Return only artist tags (type=1)
   * 
   * Uses decrypted credentials from settings for authentication.
   * 
   * Network optimization:
   * - Only queries API for tags not in local cache (missingTags)
   * - Limits concurrency to CONCURRENCY_LIMIT (5) to avoid blocking Main process
   * - URL parameters: page='dapi', s='tag', q='index', json='1', name=<tag>
   * 
   * ⚠️ ARCHITECTURE NOTE: Network I/O in Main process is not ideal.
   * This should be moved to Utility Process in the future to prevent IPC channel blocking.
   * Current implementation uses CONCURRENCY_LIMIT as a mitigation, but heavy network
   * operations should not run in Main process event loop.
   *
   * @param _event - IPC event (unused)
   * @param tags - Array of tag names to resolve (max 100, validated via Zod)
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
        return artistTags;
      }


      // Get decrypted settings for authentication
      const settings = await this.getDecryptedSettings();
      if (!settings) {
        log.warn("[SearchController] Cannot resolve tags: no settings available");
        return uniqueTags.filter(tag => cachedMap.get(tag) === 1);
      }

      // 2. DAPI-based resolver with parallel requests (limited concurrency)
      // CRITICAL: Uses Rule34 DAPI endpoint that returns tag types
      // Endpoint: https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index&json=1
      // Parameter: name=<tag_name> (single tag per request)
      // Response: JSON array of { "id": number, "name": "string", "type": number, ... }
      // type=1 is Artist, type=0 is General, etc.
      // Process tags in parallel with concurrency limit to avoid blocking Main Process
      const CONCURRENCY_LIMIT = 5; // Process 5 tags simultaneously
      const allEntries: Array<{ name: string; type: number }> = [];

      // Process tags in batches with concurrency limit
      for (let i = 0; i < missingTags.length; i += CONCURRENCY_LIMIT) {
        const batch = missingTags.slice(i, i + CONCURRENCY_LIMIT);
        
        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(async (tagName) => {
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
                return [];
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
                  return [];
                }

                // Normalize: API can return a single object or an array
                items = Array.isArray(data) ? data : (data ? [data] : []);
              }
              
              // If no items found, return empty array
              if (items.length === 0) {
                return [];
              }

              // Validate and filter entries using Zod schema
              // CRITICAL: DAPI returns { "id": number, "name": "string", "type": number, ... }
              // type=1 is Artist, type=0 is General, etc.
              // Only process entries that match the requested tag name (case-insensitive)
              const requestedTagLower = tagName.toLowerCase();
              const entries: Array<{ name: string; type: number }> = [];
              
              for (const item of items) {
                try {
                  // Validate item structure with Zod
                  const validated = R34TagResponseSchema.parse(item);
                  
                  // CRITICAL: Only accept tags that match the requested tag name (case-insensitive)
                  if (validated.name.toLowerCase() !== requestedTagLower) {
                    continue;
                  }
                  
                  entries.push({
                    name: validated.name.toLowerCase().trim(),
                    type: validated.type, // Already validated and transformed by Zod
                  });
                } catch (validationError) {
                  // Skip invalid items (Zod validation failed)
                  if (!(validationError instanceof z.ZodError)) {
                    log.warn(`[SearchController] Unexpected error validating tag item:`, validationError);
                  }
                }
              }

              return entries;
            } catch (err) {
              log.error(`[SearchController] Error processing tag "${tagName}":`, err);
              return [];
            }
          })
        );

        // Collect all entries from batch
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            allEntries.push(...result.value);
          }
        }
      }

      // Bulk insert all entries at once (fixes N+1 problem)
      // Use transaction for atomicity (all or nothing)
      if (allEntries.length > 0) {
        try {
          db.transaction((tx) => {
            // Use bulk insert with onConflictDoUpdate for all entries
            tx.insert(tagMetadata)
              .values(allEntries)
              .onConflictDoUpdate({
                target: tagMetadata.name,
                set: { type: sql`excluded.type` }, // Update with real type from API
              })
              .run();
          });

          // Update cache with correct types (only after successful transaction)
          allEntries.forEach(e => cachedMap.set(e.name, e.type));
        } catch (dbErr) {
          log.error(`[SearchController] Database error during bulk insert:`, dbErr);
          // Fallback: try individual inserts for remaining entries
          for (const entry of allEntries) {
            try {
              db.insert(tagMetadata)
                .values(entry)
                .onConflictDoUpdate({
                  target: tagMetadata.name,
                  set: { type: sql`excluded.type` },
                })
                .run();
              cachedMap.set(entry.name, entry.type);
            } catch (individualErr) {
              log.error(`[SearchController] Database error for tag "${entry.name}":`, individualErr);
            }
          }
        }
      }

      // CRITICAL: Return ONLY tags where type === TAG_TYPES.ARTIST
      // This ensures resolvedArtistTags in the frontend actually receives artists
      const artistTags = uniqueTags.filter(tag => {
        const tagType = cachedMap.get(tag);
        return tagType === TAG_TYPES.ARTIST;
      });
      

      return artistTags;
    } catch (error) {
      log.error("[SearchController] Failed to resolve tags:", error);
      return [];
    }
  }

  /**
   * Resolve tags to identify character tags (type=4) from Rule34 API
   * 
   * Uses the same logic as resolveTags but returns character tags (type=4) instead of artist tags (type=1).
   * Reuses the same persistent SQLite cache and API endpoints.
   * 
   * @param _event - IPC event (unused)
   * @param tags - Array of tag names to resolve (max 100, validated via Zod)
   * @returns Array of tag names that are characters (type=4)
   */
  private async resolveCharacterTags(
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
        const characterTags = uniqueTags.filter(tag => cachedMap.get(tag) === 4);
        return characterTags;
      }


      // Get decrypted settings for authentication
      const settings = await this.getDecryptedSettings();
      if (!settings) {
        log.warn("[SearchController] Cannot resolve character tags: no settings available");
        return uniqueTags.filter(tag => cachedMap.get(tag) === 4);
      }

      // 2. DAPI-based resolver with parallel requests (limited concurrency)
      // Reuse the same API endpoint and logic as resolveTags
      const CONCURRENCY_LIMIT = 5; // Process 5 tags simultaneously
      const allEntries: Array<{ name: string; type: number }> = [];

      // Process tags in batches with concurrency limit
      for (let i = 0; i < missingTags.length; i += CONCURRENCY_LIMIT) {
        const batch = missingTags.slice(i, i + CONCURRENCY_LIMIT);
        
        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(async (tagName) => {
            try {
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
                return [];
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
                  return [];
                }

                // Normalize: API can return a single object or an array
                items = Array.isArray(data) ? data : (data ? [data] : []);
              }
              
              // If no items found, return empty array
              if (items.length === 0) {
                return [];
              }

              // Validate and filter entries using Zod schema
              const requestedTagLower = tagName.toLowerCase();
              const entries: Array<{ name: string; type: number }> = [];
              
              for (const item of items) {
                try {
                  // Validate item structure with Zod
                  const validated = R34TagResponseSchema.parse(item);
                  
                  // CRITICAL: Only accept tags that match the requested tag name (case-insensitive)
                  if (validated.name.toLowerCase() !== requestedTagLower) {
                    continue;
                  }
                  
                  entries.push({
                    name: validated.name.toLowerCase().trim(),
                    type: validated.type, // Already validated and transformed by Zod
                  });
                } catch (validationError) {
                  // Skip invalid items (Zod validation failed)
                  if (!(validationError instanceof z.ZodError)) {
                    log.warn(`[SearchController] Unexpected error validating tag item:`, validationError);
                  }
                }
              }

              return entries;
            } catch (err) {
              log.error(`[SearchController] Error processing tag "${tagName}":`, err);
              return [];
            }
          })
        );

        // Collect all entries from batch
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            allEntries.push(...result.value);
          }
        }
      }

      // Bulk insert all entries at once (fixes N+1 problem)
      // Use transaction for atomicity (all or nothing)
      if (allEntries.length > 0) {
        try {
          db.transaction((tx) => {
            // Use bulk insert with onConflictDoUpdate for all entries
            tx.insert(tagMetadata)
              .values(allEntries)
              .onConflictDoUpdate({
                target: tagMetadata.name,
                set: { type: sql`excluded.type` }, // Update with real type from API
              })
              .run();
          });

          // Update cache with correct types (only after successful transaction)
          allEntries.forEach(e => cachedMap.set(e.name, e.type));
        } catch (dbErr) {
          log.error(`[SearchController] Database error during bulk insert:`, dbErr);
          // Fallback: try individual inserts for remaining entries
          for (const entry of allEntries) {
            try {
              db.insert(tagMetadata)
                .values(entry)
                .onConflictDoUpdate({
                  target: tagMetadata.name,
                  set: { type: sql`excluded.type` },
                })
                .run();
              cachedMap.set(entry.name, entry.type);
            } catch (individualErr) {
              log.error(`[SearchController] Database error for tag "${entry.name}":`, individualErr);
            }
          }
        }
      }

      // CRITICAL: Return ONLY tags where type === TAG_TYPES.CHARACTER
      const characterTags = uniqueTags.filter(tag => {
        const tagType = cachedMap.get(tag);
        return tagType === TAG_TYPES.CHARACTER;
      });
      
      // Summary log after processing all tags
      log.info(
        `[SearchController] Resolved batch: found ${characterTags.length} character(s) out of ${uniqueTags.length} tag(s) requested`
      );

      return characterTags;
    } catch (error) {
      log.error("[SearchController] Failed to resolve character tags:", error);
      return [];
    }
  }

  /**
   * Resolve tags by type from Rule34 API
   * Universal method that can resolve tags of any type
   * 
   * @param _event - IPC event (unused)
   * @param tags - Array of tag names to resolve (max 100, validated via Zod)
   * @param tagType - Type of tags to return (use TAG_TYPES constants: GENERAL, ARTIST, COPYRIGHT, CHARACTER, META)
   * @returns Array of tag names that match the specified type
   */
  private async resolveTagsByType(
    _event: IpcMainInvokeEvent,
    tags: string[],
    tagType: number
  ): Promise<string[]> {
    try {
      if (!tags || tags.length === 0) {
        return [];
      }

      // Normalize tags (lowercase, unique)
      const uniqueTags = [...new Set(tags.filter(Boolean).map(t => t.toLowerCase().trim()))];
      if (uniqueTags.length === 0) {
        return [];
      }

      const db = this.getDb();

      // 1. Check local DB cache first
      const cachedTags = db
        .select()
        .from(tagMetadata)
        .where(inArray(tagMetadata.name, uniqueTags))
        .all();

      const cachedMap = new Map(cachedTags.map(t => [t.name, t.type]));
      const missingTags = uniqueTags.filter(t => !cachedMap.has(t));

      // Early return if all tags are cached
      if (missingTags.length === 0) {
        const filteredTags = uniqueTags.filter(tag => cachedMap.get(tag) === tagType);
        return filteredTags;
      }


      // Get decrypted settings for authentication
      const settings = await this.getDecryptedSettings();
      if (!settings) {
        log.warn(`[SearchController] Cannot resolve tags: no settings available`);
        return uniqueTags.filter(tag => cachedMap.get(tag) === tagType);
      }

      // 2. DAPI-based resolver with parallel requests
      const CONCURRENCY_LIMIT = 5;
      const allEntries: Array<{ name: string; type: number }> = [];

      // Process tags in batches with concurrency limit
      for (let i = 0; i < missingTags.length; i += CONCURRENCY_LIMIT) {
        const batch = missingTags.slice(i, i + CONCURRENCY_LIMIT);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (tagName) => {
            try {
              const params = new URLSearchParams({
                page: 'dapi',
                s: 'tag',
                q: 'index',
                json: '1',
                name: tagName,
              });

              if (settings.apiKey) {
                params.append('api_key', settings.apiKey);
              }
              if (settings.userId) {
                params.append('user_id', String(settings.userId));
              }

              const url = `https://api.rule34.xxx/index.php?${params.toString()}`;

              const response = await fetch(url, {
                signal: AbortSignal.timeout(10000),
                headers: {
                  'User-Agent': 'RuleDesk/1.0',
                  'Accept-Encoding': 'identity',
                },
              });

              if (!response.ok) {
                log.warn(`[SearchController] API returned status ${response.status} for tag "${tagName}"`);
                return [];
              }

              const text = await response.text();
              let items: Array<{ name: string; type: string | number; id?: number }> = [];

              if (text.trim().startsWith('<')) {
                items = this.parseTagXmlResponse(text, tagName);
              } else {
                let data;
                try {
                  data = JSON.parse(text);
                } catch (parseErr) {
                  log.warn(`[SearchController] Failed to parse JSON for tag "${tagName}":`, parseErr);
                  return [];
                }

                items = Array.isArray(data) ? data : (data ? [data] : []);
              }
              
              if (items.length === 0) {
                return [];
              }

              const requestedTagLower = tagName.toLowerCase();
              const entries: Array<{ name: string; type: number }> = [];
              
              for (const item of items) {
                try {
                  const validated = R34TagResponseSchema.parse(item);
                  
                  if (validated.name.toLowerCase() !== requestedTagLower) {
                    continue;
                  }
                  
                  entries.push({
                    name: validated.name.toLowerCase().trim(),
                    type: validated.type,
                  });
                } catch (validationError) {
                  // Skip invalid items (Zod validation failed)
                  if (!(validationError instanceof z.ZodError)) {
                    log.warn(`[SearchController] Unexpected error validating tag item:`, validationError);
                  }
                }
              }

              return entries;
            } catch (err) {
              log.error(`[SearchController] Error processing tag "${tagName}":`, err);
              return [];
            }
          })
        );

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            allEntries.push(...result.value);
          }
        }
      }

      // Bulk insert all entries
      if (allEntries.length > 0) {
        try {
          db.transaction((tx) => {
            tx.insert(tagMetadata)
              .values(allEntries)
              .onConflictDoUpdate({
                target: tagMetadata.name,
                set: { type: sql`excluded.type` },
              })
              .run();
          });

          allEntries.forEach(e => cachedMap.set(e.name, e.type));
        } catch (dbErr) {
          log.error(`[SearchController] Database error during bulk insert:`, dbErr);
          for (const entry of allEntries) {
            try {
              db.insert(tagMetadata)
                .values(entry)
                .onConflictDoUpdate({
                  target: tagMetadata.name,
                  set: { type: sql`excluded.type` },
                })
                .run();
              cachedMap.set(entry.name, entry.type);
            } catch (individualErr) {
              log.error(`[SearchController] Database error for tag "${entry.name}":`, individualErr);
            }
          }
        }
      }

      // Return only tags that match the specified type
      const filteredTags = uniqueTags.filter(tag => {
        const tagTypeInCache = cachedMap.get(tag);
        return tagTypeInCache === tagType;
      });
      

      return filteredTags;
    } catch (error) {
      log.error(`[SearchController] Failed to resolve tags by type ${tagType}:`, error);
      return [];
    }
  }
}


