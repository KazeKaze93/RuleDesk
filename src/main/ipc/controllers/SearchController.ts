import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID, posts, tagMetadata, TAG_TYPES, type TagType } from "../../db/schema";
import { eq, inArray, and } from "drizzle-orm";
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
import { isVideoUrl } from "@shared/utils/media";
import {
  sanitizeProviderTagQuery,
  sanitizeProviderTagToken,
} from "../../../shared/utils/provider-tag-sanitize";
import { getAllBlacklistedTags } from "../../db/queries/blacklist";
import { getDecryptedCredentialsFromRecord } from "../../utils/decrypted-credentials";
import { resolveTagMetadataWave } from "../../services/tag-resolve-coordinator";
import type { ProviderSettings } from "../../providers/types";
import {
  isProviderSearchError,
  ProviderSearchError,
  throwProviderSearchIpcError,
} from "../../providers/provider-search-errors";

type AppDatabase = BetterSQLite3Database<typeof schema>;

// Internal type alias
type SearchPostsParams = z.infer<typeof SearchPostsSchema>;

const SearchPostsArgsSchema = z.tuple([SearchPostsSchema]);
const ResolveTagsArgsSchema = z.tuple([z.array(z.string().min(1)).max(100)]);
const ResolveTagsByTypeArgsSchema = z.tuple([
  z.array(z.string().min(1)).max(100),
  z.number().int().refine((n): n is TagType => {
    return Object.values(TAG_TYPES).some((v) => v === n);
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

  private normalizeUniqueResolveTags(tags: string[]): string[] {
    return [
      ...new Set(
        tags
          .filter(Boolean)
          .map((t) => sanitizeProviderTagToken(t).toLowerCase().trim())
      ),
    ];
  }

  private loadCachedTagMap(
    db: AppDatabase,
    uniqueTags: string[]
  ): Map<string, number> {
    const cachedTags = db
      .select()
      .from(tagMetadata)
      .where(inArray(tagMetadata.name, uniqueTags))
      .all();

    return new Map(cachedTags.map((t) => [t.name, t.type]));
  }

  private toProviderSettings(
    settings: NonNullable<Awaited<ReturnType<SearchController["getDecryptedSettings"]>>>
  ): ProviderSettings {
    return {
      userId: settings.userId,
      apiKey: settings.apiKey,
    };
  }

  private async resolveTagsForType(
    tags: string[],
    tagType: number,
    context: string
  ): Promise<string[]> {
    try {
      if (!tags || tags.length === 0) {
        return [];
      }

      const uniqueTags = this.normalizeUniqueResolveTags(tags);
      if (uniqueTags.length === 0) {
        return [];
      }

      const db = this.getDb();
      const cachedMap = this.loadCachedTagMap(db, uniqueTags);

      const settings = await this.getDecryptedSettings();
      if (!settings) {
        log.warn(
          `[SearchController] Cannot resolve tags (${context}): no settings available`
        );
        return uniqueTags.filter((tag) => cachedMap.get(tag) === tagType);
      }

      await resolveTagMetadataWave(
        db,
        uniqueTags,
        cachedMap,
        this.toProviderSettings(settings),
        context
      );

      return uniqueTags.filter((tag) => cachedMap.get(tag) === tagType);
    } catch (error) {
      log.error(`[SearchController] Failed to resolve tags (${context}):`, error);
      return [];
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
        throwProviderSearchIpcError(
          new ProviderSearchError(
            "auth",
            "API credentials are missing or could not be decrypted. Open Settings → Account and sign in again."
          )
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
        } catch (autocompleteError) {
          if (isProviderSearchError(autocompleteError)) {
            throw autocompleteError;
          }
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
          } catch (userSearchError) {
            if (isProviderSearchError(userSearchError)) {
              throw userSearchError;
            }
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
          } catch (artistStripError) {
            if (isProviderSearchError(artistStripError)) {
              throw artistStripError;
            }
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
      if (isProviderSearchError(error)) {
        log.warn(
          `[SearchController] Provider search failed (${error.kind}):`,
          error.message
        );
        throwProviderSearchIpcError(error);
      }
      log.error("[SearchController] Failed to search posts:", error);
      throw error;
    }
  }

  /**
   * Resolve tags to identify artist tags (type=1) from Rule34 API.
   * Uses tag_metadata cache + shared TagResolve coordinator (dedup, throttle, 429 backoff).
   * DAPI: single-tag `name=` per request — NOT batched `names=` (see rule34-tag-metadata.ts).
   */
  private resolveTags(
    _event: IpcMainInvokeEvent,
    tags: string[]
  ): Promise<string[]> {
    return this.resolveTagsForType(tags, TAG_TYPES.ARTIST, "resolveTags");
  }

  /**
   * Resolve tags to identify character tags (type=4) from Rule34 API.
   */
  private resolveCharacterTags(
    _event: IpcMainInvokeEvent,
    tags: string[]
  ): Promise<string[]> {
    return this.resolveTagsForType(tags, TAG_TYPES.CHARACTER, "resolveCharacterTags");
  }

  /**
   * Resolve tags by type from Rule34 API.
   */
  private resolveTagsByType(
    _event: IpcMainInvokeEvent,
    tags: string[],
    tagType: number
  ): Promise<string[]> {
    return this.resolveTagsForType(tags, tagType, "resolveTagsByType");
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


