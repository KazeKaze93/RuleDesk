import { type IpcMainInvokeEvent } from "electron";
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
import {
  SearchPostsSchema,
  formatRule34BeforePostIdTag,
  type SearchBooruPageResult,
} from "../../../shared/schemas/search";
import { toIpcSafe } from "../../utils/ipc-serialization";
import { EXTERNAL_ARTIST_ID, MAX_RANDOM_PAGES } from "../../../shared/constants";
import type { ProviderId } from "../../providers";
import { XMLParser } from "fast-xml-parser";
import { isVideoUrl } from "@shared/utils/media";
import {
  sanitizeProviderTagQuery,
  sanitizeProviderTagToken,
} from "../../../shared/utils/provider-tag-sanitize";
import { getAllBlacklistedTags } from "../../db/queries/blacklist";
import { getDecryptedCredentialsFromRecord } from "../../utils/decrypted-credentials";

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

const SearchPostsArgsSchema = z.tuple([SearchPostsSchema]);
const ResolveTagsArgsSchema = z.tuple([z.array(z.string().min(1)).max(100)]);
const ResolveTagsByTypeArgsSchema = z.tuple([
  z.array(z.string().min(1)).max(100),
  z.number().int().refine((n): n is TagType => {
    const allowed = Object.values(TAG_TYPES) as number[];
    return allowed.includes(n);
  }, "Invalid tag type"),
]);

// Use toIpcSafe return type instead of manual type definition
// This ensures type safety and automatic updates when Post schema changes

/**
 * Search Controller
 *
 * Handles IPC operations for external Booru API search:
 * - Search posts by tags (bypasses local database, queries external API directly)
 */
export class SearchController extends BaseController {
  // Query style: Drizzle Builder API only in this controller.
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  /**
   * Setup IPC handlers for search operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.API.SEARCH_POSTS,
      SearchPostsArgsSchema,
      (event, ...args) => {
        const [params] = SearchPostsArgsSchema.parse(args);
        return this.search(event, params);
      }
    );

    this.handle(
      IPC_CHANNELS.API.RESOLVE_TAGS,
      ResolveTagsArgsSchema, // Limit to 100 tags to prevent DoS
      (event, ...args) => {
        const [tags] = ResolveTagsArgsSchema.parse(args);
        return this.resolveTags(event, tags);
      }
    );

    this.handle(
      IPC_CHANNELS.API.RESOLVE_CHARACTER_TAGS,
      ResolveTagsArgsSchema, // Limit to 100 tags to prevent DoS
      (event, ...args) => {
        const [tags] = ResolveTagsArgsSchema.parse(args);
        return this.resolveCharacterTags(event, tags);
      }
    );

    this.handle(
      IPC_CHANNELS.API.RESOLVE_COPYRIGHT_TAGS,
      ResolveTagsArgsSchema, // Limit to 100 tags to prevent DoS
      (event, ...args) => {
        const [tags] = ResolveTagsArgsSchema.parse(args);
        return this.resolveCopyrightTags(event, tags);
      }
    );

    this.handle(
      IPC_CHANNELS.API.RESOLVE_TAGS_BY_TYPE,
      ResolveTagsByTypeArgsSchema,
      (event, ...args) => {
        const [tags, tagType] = ResolveTagsByTypeArgsSchema.parse(args);
        return this.resolveTagsByTypeHandler(event, tags, tagType);
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
    provider: ProviderId;
  } | null> {
    try {
      const db = this.getDb();
      const settingsRecord = db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];

      if (!settingsRecord) {
        log.warn("[SearchController] No settings found in database");
        return null;
      }

      const credentials = getDecryptedCredentialsFromRecord(settingsRecord);
      if (!credentials) {
        log.warn("[SearchController] Failed to decrypt API key");
        return null;
      }

      const providerValue = settingsRecord.provider;
      const provider: ProviderId =
        providerValue === "rule34" || providerValue === "gelbooru"
          ? providerValue
          : "rule34";

      return {
        userId: credentials.userId,
        apiKey: credentials.apiKey,
        provider,
      };
    } catch (error) {
      log.error("[SearchController] Error fetching settings:", error);
      return null;
    }
  }

  private upsertResolvedTagEntries(
    db: AppDatabase,
    entries: Array<{ name: string; type: number }>,
    cachedMap: Map<string, number>,
    context: string
  ): void {
    if (entries.length === 0) {
      return;
    }

    try {
      db.transaction((tx) => {
        tx.insert(tagMetadata)
          .values(entries)
          .onConflictDoUpdate({
            target: tagMetadata.name,
            set: { type: sql`excluded.type` },
          })
          .run();
      });
      for (const entry of entries) {
        cachedMap.set(entry.name, entry.type);
      }
    } catch (dbErr) {
      log.error(
        `[SearchController] Database error during bulk insert (${context}):`,
        dbErr
      );
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
      mediaType: isVideoUrl(booruPost.fileUrl) ? "video" : "image",
      publishedAt: booruPost.createdAt,
      createdAt: booruPost.createdAt,
      isViewed: false,
      lastViewedAt: null,
      viewCount: 0,
      isFavorited: false,
    };
  }

  /**
   * Search posts via external Booru API
   *
   * @param _event - IPC event (unused)
   * @param params - Search parameters: tags (array), page, limit (optional)
   * @returns Page of posts plus hasMore flag (based on raw API page size, before blacklist)
   * @throws {Error} If API request fails
   */
  private async search(
    _event: IpcMainInvokeEvent,
    params: SearchPostsParams
  ): Promise<SearchBooruPageResult> {
    const { tags, page, isRandom, limit = 50, beforePostId } = params;
    const safeInputTags = tags.map((t) => sanitizeProviderTagToken(t));

    try {
      // Get decrypted settings for authentication
      const settings = await this.getDecryptedSettings();
      if (!settings?.apiKey?.trim() || !settings.userId?.trim()) {
        throw new Error(
          "API credentials are missing or could not be decrypted. Open Settings and sign in again."
        );
      }
      const providerId = settings.provider ?? "rule34";
      const provider = getProvider(providerId);
      const providerSettings = {
        userId: settings.userId,
        apiKey: settings.apiKey,
      };
      log.debug("[SearchController] searchBooru provider settings loaded", {
        providerId,
        hasApiKey: true,
        hasUserId: true,
      });

      // Convert tags array to space-separated string (provider expects string).
      // Normal tags: formatTag() lowercases and replaces spaces with underscores.
      // OR-groups `( a ~ b )` need spaces and `~`; we format each operand with
      // formatTag, then reassemble with Rule34's required spacing.
      const formatSearchToken = (raw: string): string => {
        const trimmed = raw.trim();
        if (
          trimmed.length >= 2 &&
          trimmed.startsWith("(") &&
          trimmed.endsWith(")")
        ) {
          const inner = trimmed.slice(1, -1).trim();
          if (inner.length === 0) {
            return provider.formatTag(trimmed, "tag");
          }
          if (!inner.includes("~")) {
            return `( ${provider.formatTag(inner, "tag")} )`;
          }
          const parts = inner
            .split("~")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);
          if (parts.length === 0) {
            return trimmed;
          }
          const formatted = parts
            .map((p) => provider.formatTag(p, "tag"))
            .join(" ~ ");
          return `( ${formatted} )`;
        }
        return provider.formatTag(raw, "tag");
      };

      let tagsString =
        safeInputTags.length > 0
          ? safeInputTags.map((tag) => formatSearchToken(tag)).join(" ")
          : "";
      tagsString = sanitizeProviderTagQuery(tagsString);

      const useCursorPagination =
        beforePostId != null && providerId === "rule34" && !isRandom;

      if (useCursorPagination) {
        const cursorTag = formatRule34BeforePostIdTag(beforePostId);
        tagsString =
          tagsString.length > 0 ? `${tagsString} ${cursorTag}` : cursorTag;
      }

      // Step 1: Primary Search - try original tags
      // Pseudo-random fallback: If isRandom is true, use a random page number (1-MAX_RANDOM_PAGES) for better randomization
      // NOTE: This is a fallback approach. True randomization on large datasets in Booru APIs
      // should be done via API's native sort:random parameter if the provider supports it.
      // If the provider doesn't support native randomization, this pseudo-random approach
      // provides reasonable distribution across pages (1-MAX_RANDOM_PAGES) for better variety.
      const apiPage = useCursorPagination
        ? 1
        : isRandom
          ? Math.floor(Math.random() * MAX_RANDOM_PAGES) + 1
          : page;
      let booruPosts = await provider.fetchPosts(
        tagsString,
        apiPage,
        providerSettings,
        isRandom,
        limit
      );

      // Step 2: Fallback Logic (only if Step 1 returned 0 AND input is a single word)
      if (
        booruPosts.length === 0 &&
        tagsString &&
        safeInputTags.length === 1 &&
        !useCursorPagination
      ) {
        const originalTag = safeInputTags[0].trim();
        
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
                apiPage,
                providerSettings,
                isRandom,
                limit
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
              apiPage,
              providerSettings,
              isRandom,
              limit
            );
            
            if (booruPosts.length > 0) {
              tagsString = formattedUserTag; // Update for logging
            }
          } catch (_userSearchError) {
            // Uploader retry failed, continue
          }
        }

        // Attempt C: Rule34 artist meta tags (e.g. sodaglow vs sodaglow_artist)
        if (
          booruPosts.length === 0 &&
          originalTag.toLowerCase().endsWith("_artist") &&
          originalTag.length > "_artist".length
        ) {
          const strippedTag = originalTag.slice(0, -"_artist".length);
          try {
            const formatted = provider.formatTag(strippedTag, "tag");
            booruPosts = await provider.fetchPosts(
              formatted,
              apiPage,
              providerSettings,
              isRandom,
              limit
            );
            if (booruPosts.length > 0) {
              tagsString = formatted;
            }
          } catch (_artistStripError) {
            // Strip fallback failed, continue
          }
        }
      }
      
      const apiFetchedCount = booruPosts.length;
      const hasMore = apiFetchedCount >= limit;
      const nextBeforePostId =
        apiFetchedCount > 0
          ? booruPosts.reduce(
              (min, post) => (post.id < min ? post.id : min),
              booruPosts[0].id
            )
          : undefined;

      const blacklistedTagSet = new Set(
        getAllBlacklistedTags()
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0)
      );
      if (blacklistedTagSet.size > 0) {
        booruPosts = booruPosts.filter((post) =>
          !post.tags.some((tag) => blacklistedTagSet.has(tag.trim().toLowerCase()))
        );
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

      // Untagged page-1 with zero API rows: return empty page (do not throw — avoids
      // poisoning React Query and transient red error banners on throttle blips).
      if (page === 1 && safeInputTags.length === 0 && apiFetchedCount === 0) {
        log.warn(
          "[SearchController] Browse API returned no posts for untagged page 1"
        );
      }

      return {
        posts: toIpcSafe(enrichedPosts),
        hasMore,
        apiFetchedCount,
        nextBeforePostId,
      };
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
      const uniqueTags = [
        ...new Set(
          tags
            .filter(Boolean)
            .map((t) => sanitizeProviderTagToken(t).toLowerCase().trim())
        ),
      ];
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

      this.upsertResolvedTagEntries(db, allEntries, cachedMap, "resolveTags");

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
      const uniqueTags = [
        ...new Set(
          tags
            .filter(Boolean)
            .map((t) => sanitizeProviderTagToken(t).toLowerCase().trim())
        ),
      ];
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

      this.upsertResolvedTagEntries(
        db,
        allEntries,
        cachedMap,
        "resolveCharacterTags"
      );

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
      const uniqueTags = [
        ...new Set(
          tags
            .filter(Boolean)
            .map((t) => sanitizeProviderTagToken(t).toLowerCase().trim())
        ),
      ];
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

      this.upsertResolvedTagEntries(
        db,
        allEntries,
        cachedMap,
        "resolveTagsByType"
      );

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

  private resolveCopyrightTags(
    event: IpcMainInvokeEvent,
    tags: string[]
  ): Promise<string[]> {
    return this.resolveTagsByType(event, tags, TAG_TYPES.COPYRIGHT);
  }

  private resolveTagsByTypeHandler(
    event: IpcMainInvokeEvent,
    tags: string[],
    tagType: TagType
  ): Promise<string[]> {
    return this.resolveTagsByType(event, tags, tagType);
  }
}


