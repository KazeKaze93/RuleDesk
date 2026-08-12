import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import {
  eq,
  desc,
  count,
  and,
  sql,
  gte,
  not,
  notLike,
  or,
  type SQL,
} from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { posts, artists } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { toIpcSafe } from "../../utils/ipc-serialization";
import type { InferSelectModel } from "drizzle-orm";
import type { IpcSafe } from "../../../shared/types/ipc";
import {
  PostDataSchema,
  GetPostsSchema,
  GetPostsCountSchema,
  type PostData,
  type GetPostsRequest,
  type GetPostsCountRequest,
  type PostFilterRequest,
} from "../../../shared/schemas/post";
import {
  EXTERNAL_ARTIST_ID,
  EXTERNAL_ARTIST_TAG_PREFIX,
} from "../../../shared/constants";
import { getSqliteInstance } from "../../db/client";
import { isVideoUrl } from "@shared/utils/media";
import { getProvider, type ProviderId } from "../../providers";
import { settings, SETTINGS_ID } from "../../db/schema";
import { getDecryptedCredentialsFromRecord } from "../../utils/decrypted-credentials";
import { ShadowInsertRequestSchema } from "../../../shared/schemas/shadow-insert";
import { IdSchema } from "../../../shared/schemas/ipc";
import { getAllBlacklistedTags } from "../../db/queries/blacklist";
import { escapeLikePattern } from "../../db/utils";
import {
  parseTagFilterQuery,
  type ParsedSearchTerm,
} from "./posts-tag-query";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * IPC-safe Post type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 *
 * Uses Drizzle's InferSelectModel to automatically infer types from schema.
 * Then applies toIpcSafe transformation to convert Date fields to numbers.
 * This ensures type safety and eliminates manual field enumeration.
 */
/**
 * IPC-safe Post type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 *
 * Uses shared IpcSafe utility type for automatic Date -> number conversion.
 */
type IpcPost = IpcSafe<InferSelectModel<typeof posts>>;

// Internal types (not exported - use types from src/main/types/ipc.ts instead)
type GetPostsParams = GetPostsRequest;
const GetPostsArgsSchema = z.tuple([GetPostsSchema]);
const GetDownloadItemsArgsSchema = z.tuple([
  GetPostsSchema.extend({
    limit: z.number().int().min(1).max(500).default(500),
  }),
]);
const GetPostsCountArgsSchema = z.tuple([GetPostsCountSchema]);
const GetPostsCountWithFiltersArgsSchema = z.tuple([
  GetPostsSchema.pick({ artistId: true, filters: true }),
]);
const PostActionArgsSchema = z.tuple([
  z.number().int(),
  PostDataSchema.optional(),
]);
const MarkAllViewedArgsSchema = z.tuple([]);
const ResetPostCacheArgsSchema = z.tuple([IdSchema]);
const ShadowInsertPostArgsSchema = z.tuple([ShadowInsertRequestSchema]);

/**
 * Posts Controller
 *
 * Handles IPC operations for post management:
 * - Get posts with pagination and filters
 * - Get posts count for artist
 * - Mark post as viewed
 */
// Query style: Drizzle Builder API only in this controller.
export class PostsController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  // Cache FTS table existence check (schema doesn't change at runtime)
  // Initialized once at setup() to avoid blocking synchronous calls
  private ftsTableExistsCache: boolean = false;
  // Cache optional view metadata columns presence for backward compatibility
  // Initialized once at setup() to avoid runtime SQL errors on old DBs
  private viewMetadataColumnsAvailable: boolean = false;
  
  // Cache EXTERNAL_ARTIST_ID existence check (avoids repeated DB queries)
  // Initialized once at first shadowInsertPost call
  private externalArtistExistsCache: boolean = false;
  
  // CRITICAL: In-flight request deduplication to prevent race conditions
  // Map<`${postId}-${provider}`, Promise<IpcPost>>
  // Reuses active Promise if same postId+provider is already being fetched
  // Prevents duplicate API calls when user clicks rapidly
  private static readonly inFlightShadowInserts = new Map<string, Promise<IpcPost>>();

  /**
   * Check if posts_fts table exists (cached, checked once at initialization)
   * @returns true if FTS5 table exists, false otherwise
   */
  private checkFtsTableExists(): boolean {
    return this.ftsTableExistsCache;
  }

  /**
   * Initialize FTS table existence check (called once at setup)
   * This avoids blocking synchronous SQLite calls during runtime
   */
  private initializeFtsTableCheck(): void {
    try {
      // Use official getSqliteInstance export (safe, no unsafe casts)
      // Query sqlite_master system table to check if posts_fts exists
      // Schema introspection: no Drizzle equivalent
      const sqlite = getSqliteInstance();
      const stmt = sqlite.prepare<[], { name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='posts_fts'"
      );
      const result = stmt.get();
      this.ftsTableExistsCache = !!result;
      log.info(
        `[PostsController] FTS table check initialized: ${this.ftsTableExistsCache}`
      );
    } catch (error) {
      log.warn(
        "[PostsController] Failed to check FTS table existence, using LIKE fallback:",
        error
      );
      this.ftsTableExistsCache = false;
    }
  }

  /**
   * Initialize posts view metadata columns existence check (called once at setup)
   * Keeps markViewed backward-compatible with databases that haven't applied migration yet.
   */
  private initializeViewMetadataColumnsCheck(): void {
    try {
      // PRAGMA: no Drizzle equivalent
      const sqlite = getSqliteInstance();
      const columns = sqlite
        .prepare<[], { name: string }>("PRAGMA table_info(posts)")
        .all();
      const columnNames = new Set(columns.map((column) => column.name));
      this.viewMetadataColumnsAvailable =
        columnNames.has("last_viewed_at") && columnNames.has("view_count");
      log.info(
        `[PostsController] View metadata columns available: ${this.viewMetadataColumnsAvailable}`
      );
    } catch (error) {
      log.warn(
        "[PostsController] Failed to check view metadata columns, using isViewed-only fallback:",
        error
      );
      this.viewMetadataColumnsAvailable = false;
    }
  }

  /**
   * Setup IPC handlers for post operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS,
      GetPostsArgsSchema,
      (event, ...args) => {
        const [params] = GetPostsArgsSchema.parse(args);
        return this.getPosts(event, params);
      }
    );
    this.handle(
      IPC_CHANNELS.DB.GET_DOWNLOAD_ITEMS,
      GetDownloadItemsArgsSchema,
      (event, ...args) => {
        const [params] = GetDownloadItemsArgsSchema.parse(args);
        return this.getDownloadItems(event, params);
      }
    );
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS_COUNT,
      GetPostsCountArgsSchema,
      (event, ...args) => {
        const [params] = GetPostsCountArgsSchema.parse(args);
        return this.getPostsCount(event, params);
      }
    );
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS_COUNT_WITH_FILTERS,
      GetPostsCountWithFiltersArgsSchema,
      (event, ...args) => {
        const [params] = GetPostsCountWithFiltersArgsSchema.parse(args);
        return this.getPostsCountWithFilters(event, params);
      },
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.DB.MARK_VIEWED,
      PostActionArgsSchema, // Allow negative IDs for external posts from Browse
      (event, ...args) => {
        const [postId, postData] = PostActionArgsSchema.parse(args);
        return this.markViewed(event, postId, postData);
      }
    );
    this.handle(
      IPC_CHANNELS.DB.MARK_ALL_VIEWED,
      MarkAllViewedArgsSchema,
      (event, ...args) => {
        MarkAllViewedArgsSchema.parse(args);
        return this.markAllViewed(event);
      }
    );
    this.handle(
      IPC_CHANNELS.DB.RESET_POST_CACHE,
      ResetPostCacheArgsSchema,
      (event, ...args) => {
        const [postId] = ResetPostCacheArgsSchema.parse(args);
        return this.resetPostCache(event, postId);
      }
    );
    this.handle(
      IPC_CHANNELS.DB.TOGGLE_FAVORITE,
      PostActionArgsSchema, // Allow negative IDs for external posts from Browse
      (event, ...args) => {
        const [postId, postData] = PostActionArgsSchema.parse(args);
        return this.toggleFavorite(event, postId, postData);
      }
    );
    this.handle(
      IPC_CHANNELS.DB.SHADOW_INSERT_POST,
      ShadowInsertPostArgsSchema,
      (event, ...args) => {
        const [request] = ShadowInsertPostArgsSchema.parse(args);
        return this.shadowInsertPost(event, request);
      }
    );

    // Initialize FTS table check once at setup (avoids blocking synchronous calls at runtime)
    this.initializeFtsTableCheck();
    this.initializeViewMetadataColumnsCheck();

    log.info("[PostsController] All handlers registered");
  }

  /**
   * Find existing post by database ID or by postId + EXTERNAL_ARTIST_ID
   *
   * This is a shared helper method used by markViewed and toggleFavorite
   * to avoid code duplication.
   *
   * @param tx - Drizzle transaction object
   * @param postId - Database post ID (for existing posts)
   * @param postData - Optional post data for external posts (contains postId for lookup)
   * @returns Found post or undefined
   */
  private findPostInTransaction(
    tx: Parameters<Parameters<AppDatabase["transaction"]>[0]>[0],
    postId: number,
    postData?: PostData
  ): InferSelectModel<typeof posts> | undefined {
    // CRITICAL: Negative IDs indicate external posts (from Browse) that haven't been saved to DB yet
    // For negative IDs, skip DB lookup by id and go straight to postId lookup
    // For positive IDs, try to find by database ID first (existing posts from DB)
    let existingPost: InferSelectModel<typeof posts> | undefined;

    if (postId > 0) {
      // Positive ID - try to find by database ID (existing posts from DB)
      existingPost = tx
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1)
        .get();
    }

    // If not found (or negative ID for external post) and postData is provided,
    // try to find by postId and EXTERNAL_ARTIST_ID
    // SECURITY: Always use EXTERNAL_ARTIST_ID, never trust artistId from Renderer
    // This handles external posts from Browse (artistId = EXTERNAL_ARTIST_ID)
    if (!existingPost && postData) {
      existingPost = tx
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.postId, postData.postId),
            eq(posts.artistId, EXTERNAL_ARTIST_ID)
          )
        )
        .limit(1)
        .get();
    }

    return existingPost;
  }

  /**
   * Build FTS5 OR query from array of tags
   * SECURITY: Validates and sanitizes each tag before constructing query
   * This is safer than manual string concatenation with join(" OR ")
   * 
   * @param tags - Array of tags to search for (must be validated)
   * @returns FTS5 query string with OR operators
   * @throws {Error} If any tag is invalid
   */
  private buildFts5OrQuery(tags: string[]): string {
    if (tags.length === 0) {
      throw new Error("Cannot build FTS5 OR query from empty tag array");
    }
    
    // Validate and sanitize each tag
    const sanitizedTags = tags.map((tag) => {
      // Validate tag format: only alphanumeric, hyphens, underscores allowed
      // This prevents injection if tags list is ever extended to user input
      if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
        throw new Error(
          `Invalid tag format: "${tag}". Only alphanumeric, hyphens, and underscores allowed.`
        );
      }
      // Escape quotes for FTS5 (double quotes for literal)
      const escaped = tag.replace(/"/g, '""');
      // Wrap in quotes to make FTS5 treat it as literal
      return `"${escaped}"`;
    });
    
    // Join with OR operator
    // SECURITY: All tags are validated and escaped above, so this is safe
    return sanitizedTags.join(" OR ");
  }

  /**
   * Create FTS5 JOIN condition for tag filtering
   * Uses parameterized query to prevent SQL injection
   * Sanitizes FTS5 query to prevent syntax errors from special characters
   *
   * Uses EXISTS with JOIN pattern for better performance than IN (SELECT ...):
   * - SQLite optimizer can use FTS5 index as leading index
   * - More efficient than IN with virtual tables
   * - Allows better query planning
   *
   * Falls back to LIKE search if FTS5 table doesn't exist
   *
   * @param tagFilter - Tag search string (user input from Renderer)
   * @returns Drizzle SQL condition for tag filtering using FTS5 or LIKE
   */
  private createTagFilterCondition(tagFilter: string): SQL {
    const parsedTokens = parseTagFilterQuery(tagFilter);
    if (parsedTokens.length === 0) {
      return sql`1 = 1`;
    }

    const tokenConditions: SQL[] = [];
    for (const token of parsedTokens) {
      const termConditions = token.terms
        .map((term) => this.createSearchTermCondition(term))
        .filter((condition): condition is SQL => Boolean(condition));

      if (termConditions.length === 0) {
        continue;
      }

      const tokenCondition =
        termConditions.length === 1
          ? termConditions[0]
          : (or(...termConditions) ?? termConditions[0]);

      tokenConditions.push(token.exclude ? not(tokenCondition) : tokenCondition);
    }

    if (tokenConditions.length === 0) {
      return sql`1 = 1`;
    }

    if (tokenConditions.length === 1) {
      return tokenConditions[0];
    }
    return and(...tokenConditions) ?? tokenConditions[0];
  }

  private createSearchTermCondition(term: ParsedSearchTerm): SQL | null {
    const normalizedValue = term.value.trim();
    if (normalizedValue.length === 0) {
      return null;
    }

    if (term.mode === "exact") {
      return sql`instr(' ' || lower(${posts.tags}) || ' ', ' ' || ${normalizedValue} || ' ') > 0`;
    }

    if (term.mode === "wildcard") {
      const likePattern = `%${escapeLikePattern(normalizedValue).replace(
        /\*/g,
        "%"
      )}%`;
      return sql`lower(${posts.tags}) LIKE ${likePattern} ESCAPE '\\'`;
    }

    const fuzzyPattern = `%${escapeLikePattern(normalizedValue)}%`;
    return sql`lower(${posts.tags}) LIKE ${fuzzyPattern} ESCAPE '\\'`;
  }

  /**
   * Build WHERE conditions array for post filtering
   * Centralized logic to avoid code duplication (DRY principle)
   *
   * @param artistId - Optional artist ID filter
   * @param filters - Optional post filters (tags, isViewed, isFavorited)
   * @returns Array of Drizzle SQL conditions for use with and()
   */
  private buildPostFilterConditions(
    artistId: number | undefined,
    filters: PostFilterRequest | undefined
  ): SQL[] {
    const conditions: SQL[] = [];

    if (artistId) {
      conditions.push(eq(posts.artistId, artistId));
    }

    // Use FTS5 subquery for tag filtering (parameterized, no memory bloat)
    // Validate that tag filter is not empty to prevent FTS5 syntax errors
    // Empty string "" would become '""' and cause SQLITE_ERROR: fts5: syntax error
    if (filters?.tags && filters.tags.trim().length > 0) {
      conditions.push(this.createTagFilterCondition(filters.tags));
    }

    if (filters?.isFavorited !== undefined) {
      conditions.push(eq(posts.isFavorited, filters.isFavorited));
    }

    if (filters?.isViewed !== undefined) {
      conditions.push(eq(posts.isViewed, filters.isViewed));
    }

    // AI filter: filter by AI-generated tags using FTS5 for performance
    // CRITICAL: LIKE "%...%" causes Full Table Scan. Use FTS5 instead.
    if (filters?.aiFilter === "hide" || filters?.aiFilter === "only") {
      const ftsTableExists = this.checkFtsTableExists();

      if (ftsTableExists) {
        // Use FTS5 for indexed search (much faster than LIKE)
        // AI tags to search for
        const aiTags = [
          "ai_generated",
          "ai-generated",
          "ai_generation",
          "ai-generated_content",
        ];

        // Build FTS5 query using safe array-based construction
        // SECURITY: Validate and sanitize each tag, then construct query safely
        // Even though tags are hardcoded, we validate them to prevent future bugs if list changes
        // Use helper function to build FTS5 OR query from array of tags
        const ftsQuery = this.buildFts5OrQuery(aiTags);

        // CRITICAL: Ensure ftsQuery is not empty to prevent SQLite syntax error
        // If sanitizedTagQueries is empty (shouldn't happen with hardcoded tags), skip filter
        if (!ftsQuery || ftsQuery.trim().length === 0) {
          log.warn(
            "[PostsController] Empty FTS5 query for AI filter, skipping filter condition"
          );
          // Skip adding filter condition if query is empty
        } else {
          // SECURITY: ftsQuery is constructed from hardcoded, validated AI tags
          // Each tag is validated with /^[a-zA-Z0-9_-]+$/ and escaped (quotes doubled)
          // Drizzle's sql template will attempt to parameterize ${ftsQuery}, but SQLite FTS5 MATCH
          // may require the query string in SQL text rather than as a parameter.
          // This is safe because:
          // 1. All AI tags are hardcoded (not user input)
          // 2. Each tag validated with strict regex before escaping
          // 3. Quotes are properly escaped (doubled) for FTS5
          // 4. Query is validated to be non-empty before use
          // For user input (tagFilter), use createTagFilterCondition which handles parameterization correctly
          if (filters.aiFilter === "hide") {
            // Exclude AI posts: NOT (FTS5 match)
            conditions.push(
              not(
                sql`EXISTS (
                  SELECT 1 FROM posts_fts 
                  WHERE posts_fts.rowid = ${posts.id} 
                    AND posts_fts MATCH ${ftsQuery}
                )`
              )
            );
          } else {
            // Only AI posts: FTS5 match
            conditions.push(
              sql`EXISTS (
                SELECT 1 FROM posts_fts 
                WHERE posts_fts.rowid = ${posts.id} 
                  AND posts_fts MATCH ${ftsQuery}
              )`
            );
          }
        }
      } else {
        // Fallback to LIKE only if FTS5 table doesn't exist (should not happen in production)
        // NOTE: This is inefficient for large datasets - FTS5 should be available
        log.warn(
          "[PostsController] FTS5 table not found, using slow LIKE fallback for AI filter"
        );
        const aiTagPatterns = [
          "%ai_generated%",
          "%ai-generated%",
          "%ai_generation%",
          "%ai-generated_content%",
        ];
        const aiConditions = aiTagPatterns.map(
          (pattern) => sql`${posts.tags} LIKE ${pattern} ESCAPE '\\'`
        );
        if (aiConditions.length > 0) {
          const aiOrCondition = or(...aiConditions);
          if (aiOrCondition) {
            if (filters.aiFilter === "hide") {
              conditions.push(not(aiOrCondition));
            } else {
              conditions.push(aiOrCondition);
            }
          }
        }
      }
    }

    // Media type filter: use indexed media_type column for efficient filtering
    // Replaces slow LIKE "%...%" queries that cause Full Table Scan
    // CRITICAL: During backfill, some posts may have NULL media_type
    // Treat NULL as "image" (default) to avoid hiding existing posts
    if (filters?.mediaType === "videos") {
      // Only videos (exclude NULL and images)
      conditions.push(eq(posts.mediaType, "video"));
    } else if (filters?.mediaType === "images") {
      // Images OR NULL (NULL treated as image during backfill)
      const imageOrNull = or(eq(posts.mediaType, "image"), sql`${posts.mediaType} IS NULL`);
      if (imageOrNull) conditions.push(imageOrNull);
    }

    const blacklistedTags = getAllBlacklistedTags();
    if (blacklistedTags.length > 0) {
      conditions.push(
        sql`NOT EXISTS (
          SELECT 1
          FROM tag_blacklist bl
          WHERE instr(' ' || lower(${posts.tags}) || ' ', ' ' || lower(bl.tag) || ' ') > 0
        )`
      );
    }

    return conditions;
  }

  /**
   * Get download items for batch download (all posts matching filters, up to 500)
   * Returns { items } for use with Download All. Total for display comes from getArtistPostsCount.
   */
  private async getDownloadItems(
    _event: IpcMainInvokeEvent,
    params: GetPostsParams & { limit?: number }
  ): Promise<{ items: Array<{ url: string; filename: string }> }> {
    const posts = await this.getPosts(_event, {
      ...params,
      page: 1,
      limit: Math.min(params.limit ?? 500, 500),
    });
    const items = posts
      .filter((p) => p.fileUrl?.trim())
      .map((p) => {
        const pathMatch = (p.fileUrl || "").match(/^[^?#]+/);
        const pathname = pathMatch ? pathMatch[0] : p.fileUrl || "";
        const ext = pathname.split(".").pop()?.toLowerCase() || "jpg";
        return {
          url: p.fileUrl!,
          filename: `${p.artistId}_${p.postId}.${ext}`,
        };
      });
    return { items };
  }

  /**
   * Get posts for an artist (or globally) with pagination and filters
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters: artistId (optional), page, filters, limit
   * @returns Array of posts
   * @throws {Error} If database operation fails
   */
  private async getPosts(
    _event: IpcMainInvokeEvent,
    params: GetPostsParams
  ): Promise<IpcPost[]> {
    const { artistId, page, filters, limit, isRandom, sortOrder } = params;
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

      // If sinceTracking filter is enabled, we need to use join
      if (filters?.sinceTracking === true) {
        // Build where conditions array (excluding the date filter, which goes in join)
        // Note: artistId is optional - if not provided, returns posts from all tracked artists
        // This is the expected behavior for global feeds like Updates
        const baseConditions = this.buildPostFilterConditions(
          artistId,
          filters
        );

        // Combine all conditions using and()
        // Note: whereClause can be undefined if no additional filters are provided.
        // This is safe because the join condition already filters by date (sinceTracking),
        // so the join itself acts as the primary filter. Additional filters in whereClause
        // are optional refinements.
        const whereClause =
          baseConditions.length > 0 ? and(...baseConditions) : undefined;

        // Use select with innerJoin for sinceTracking filter
        // The date filter is part of the join condition for efficiency
        // This ensures filtering happens at the join level, not after
        // The join condition (gte(posts.publishedAt, artists.createdAt)) ensures
        // we only get posts published after the artist was tracked, even if whereClause is undefined
        // Also exclude EXTERNAL_ARTIST_ID and placeholder artists to ensure only real tracked artists
        const joinConditions = and(
          eq(posts.artistId, artists.id),
          gte(posts.publishedAt, artists.createdAt),
          not(eq(posts.artistId, EXTERNAL_ARTIST_ID)), // Exclude external posts
          notLike(artists.tag, `${EXTERNAL_ARTIST_TAG_PREFIX}%`) // Exclude placeholder artists
        );

        const finalWhereClause = whereClause
          ? and(whereClause, not(eq(posts.artistId, EXTERNAL_ARTIST_ID)))
          : not(eq(posts.artistId, EXTERNAL_ARTIST_ID));

        const queryBuilder = db
          .select({
            id: posts.id,
            postId: posts.postId,
            artistId: posts.artistId,
            fileUrl: posts.fileUrl,
            previewUrl: posts.previewUrl,
            sampleUrl: posts.sampleUrl,
            title: posts.title,
            rating: posts.rating,
            tags: posts.tags,
            mediaType: posts.mediaType,
            publishedAt: posts.publishedAt,
            createdAt: posts.createdAt,
            isViewed: posts.isViewed,
            isFavorited: posts.isFavorited,
            lastViewedAt: posts.lastViewedAt,
            viewCount: posts.viewCount,
          })
          .from(posts)
          .innerJoin(artists, joinConditions)
          .where(finalWhereClause);

        const result = isRandom
          ? queryBuilder.orderBy(sql`RANDOM()`).limit(limit).offset(offset).all()
          : queryBuilder
              .orderBy(
                sortOrder === "asc" ? posts.publishedAt : desc(posts.publishedAt)
              )
              .limit(limit)
              .offset(offset)
              .all();

        log.info(
          `[PostsController] Retrieved ${result.length} posts ${
            artistId ? `for artist ${artistId}` : "globally"
          } (page ${page}, sinceTracking: true)`
        );

        // Convert Date objects to numbers for Electron 39+ IPC serialization
        return toIpcSafe(result);
      }

      // Standard query path (no sinceTracking filter)
      // Build where conditions array using centralized method
      const baseConditions = this.buildPostFilterConditions(artistId, filters);

      // Combine all conditions using and()
      const whereClause =
        baseConditions.length > 0 ? and(...baseConditions) : undefined;

      // CRITICAL: Explicitly select all fields including rating
      // This ensures rating is included in the response for Safe Mode filtering
      const queryBuilder = db
        .select({
          id: posts.id,
          postId: posts.postId,
          artistId: posts.artistId,
          fileUrl: posts.fileUrl,
          previewUrl: posts.previewUrl,
          sampleUrl: posts.sampleUrl,
          title: posts.title,
          rating: posts.rating,
          tags: posts.tags,
          mediaType: posts.mediaType,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          isViewed: posts.isViewed,
          isFavorited: posts.isFavorited,
          lastViewedAt: posts.lastViewedAt,
          viewCount: posts.viewCount,
        })
        .from(posts)
        .where(whereClause);

      const result = isRandom
        ? queryBuilder.orderBy(sql`RANDOM()`).limit(limit).offset(offset).all()
        : queryBuilder
            .orderBy(
              sortOrder === "asc" ? posts.publishedAt : desc(posts.publishedAt)
            )
            .limit(limit)
            .offset(offset)
            .all();

      log.info(
        `[PostsController] Retrieved ${result.length} posts ${
          artistId ? `for artist ${artistId}` : "globally"
        } (page ${page})`
      );

      // Convert Date objects to numbers for Electron 39+ IPC serialization
      // Uses universal toIpcSafe utility to avoid code duplication
      return toIpcSafe(result);
    } catch (error) {
      log.error("[PostsController] Failed to get posts:", error);
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }

  /**
   * Get posts count for an artist (or all posts if artistId is not provided)
   *
   * @param _event - IPC event (unused)
   * @param artistId - Artist ID (optional)
   * @returns Number of posts
   */
  private async getPostsCount(
    _event: IpcMainInvokeEvent,
    params: GetPostsCountRequest
  ): Promise<number> {
    try {
      const db = this.getDb();
      const { artistId, filters } = params;
      const baseConditions = this.buildPostFilterConditions(artistId, filters);
      const whereClause =
        baseConditions.length > 0 ? and(...baseConditions) : undefined;

      const result = await db
        .select({ value: count() })
        .from(posts)
        .where(whereClause);

      const total = result[0]?.value ?? 0;

      log.info(
        `[PostsController] Posts count: ${total} ${
          artistId ? `for artist ${artistId}` : "(all artists)"
        }`
      );
      return total;
    } catch (error) {
      log.error("[PostsController] Failed to get posts count:", error);
      return 0;
    }
  }

  /**
   * Get posts count with filters (for Updates, Favorites - matches getPosts logic)
   */
  private async getPostsCountWithFilters(
    _event: IpcMainInvokeEvent,
    params: Pick<GetPostsRequest, "artistId" | "filters">
  ): Promise<number> {
    try {
      const db = this.getDb();
      const { artistId, filters } = params;

      if (filters?.sinceTracking === true) {
        const baseConditions = this.buildPostFilterConditions(artistId, filters);
        const whereClause =
          baseConditions.length > 0 ? and(...baseConditions) : undefined;
        const joinConditions = and(
          eq(posts.artistId, artists.id),
          gte(posts.publishedAt, artists.createdAt),
          not(eq(posts.artistId, EXTERNAL_ARTIST_ID)),
          notLike(artists.tag, `${EXTERNAL_ARTIST_TAG_PREFIX}%`)
        );
        const finalWhereClause = whereClause
          ? and(whereClause, not(eq(posts.artistId, EXTERNAL_ARTIST_ID)))
          : not(eq(posts.artistId, EXTERNAL_ARTIST_ID));

        const result = await db
          .select({ value: count() })
          .from(posts)
          .innerJoin(artists, joinConditions)
          .where(finalWhereClause);

        const total = result[0]?.value ?? 0;
        log.debug(`[PostsController] Posts count with filters: ${total}`);
        return total;
      }

      const baseConditions = this.buildPostFilterConditions(artistId, filters);
      const whereClause =
        baseConditions.length > 0 ? and(...baseConditions) : undefined;

      const result = await db
        .select({ value: count() })
        .from(posts)
        .where(whereClause);

      const total = result[0]?.value ?? 0;
      log.debug(`[PostsController] Posts count with filters: ${total}`);
      return total;
    } catch (error) {
      log.error("[PostsController] Failed to get posts count with filters:", error);
      return 0;
    }
  }

  /**
   * Mark post as viewed
   *
   * For posts from Browse (external posts), if post is not found in DB,
   * it will be created with the provided data.
   *
   * @param _event - IPC event (unused)
   * @param postId - Post ID (database ID for existing posts, or external postId for new posts)
   * @param postData - Optional post data for creating external posts from Browse
   * @returns true if update succeeded
   * @throws {Error} If update fails
   */
  private async markViewed(
    _event: IpcMainInvokeEvent,
    postId: number,
    postData?: PostData
  ): Promise<boolean> {
    try {
      const db = this.getDb();

      // CRITICAL: For external posts (negative ID), we need postData to create/update
      // For existing posts (positive ID), we can use onConflictDoUpdate with postId lookup
      if (!postData && postId <= 0) {
        log.warn(
          `[PostsController] Cannot mark external post as viewed without postData. postId: ${postId}`
        );
        return false;
      }

      // If postData is provided, handle external post by (artistId, postId).
      // Decrement artist counter only when state transitions false -> true.
      if (postData) {
        db.transaction((tx) => {
          // Ensure external placeholder artist exists for FK constraint.
          // Browse viewed flow may insert external posts before any favorite action.
          const now = new Date();
          tx.insert(artists)
            .values({
              id: EXTERNAL_ARTIST_ID,
              name: `Artist ${EXTERNAL_ARTIST_ID}`,
              tag: `${EXTERNAL_ARTIST_TAG_PREFIX}${EXTERNAL_ARTIST_ID}`,
              provider: "rule34",
              type: "tag",
              apiEndpoint: "",
              lastPostId: 0,
              newPostsCount: 0,
              createdAt: now,
            })
            .onConflictDoNothing()
            .run();

          const existingPost = tx
            .select({
              id: posts.id,
              isViewed: posts.isViewed,
              artistId: posts.artistId,
            })
            .from(posts)
            .where(
              and(
                eq(posts.artistId, EXTERNAL_ARTIST_ID),
                eq(posts.postId, postData.postId)
              )
            )
            .limit(1)
            .get();

          if (existingPost) {
            if (this.viewMetadataColumnsAvailable) {
              tx.update(posts)
                .set({
                  isViewed: true,
                  lastViewedAt: new Date(),
                  viewCount: sql`${posts.viewCount} + 1`,
                })
                .where(eq(posts.id, existingPost.id))
                .run();
            } else {
              tx.update(posts)
                .set({ isViewed: true })
                .where(eq(posts.id, existingPost.id))
                .run();
            }

            if (existingPost.isViewed) {
              return;
            }

            tx.update(artists)
              .set({
                newPostsCount: sql`MAX(0, ${artists.newPostsCount} - 1)`,
              })
              .where(eq(artists.id, existingPost.artistId))
              .run();
            return;
          }

          const insertNow = new Date();
          const publishedAt = postData.publishedAt
            ? new Date(postData.publishedAt)
            : insertNow;

          tx.insert(posts)
            .values({
              postId: postData.postId,
              artistId: EXTERNAL_ARTIST_ID, // SECURITY: Always use EXTERNAL_ARTIST_ID for external posts
              fileUrl: postData.fileUrl,
              previewUrl: postData.previewUrl,
              sampleUrl: postData.sampleUrl ?? "",
              title: "",
              rating: postData.rating ?? "",
              tags: postData.tags ?? "",
              mediaType: isVideoUrl(postData.fileUrl) ? "video" : "image",
              publishedAt: publishedAt,
              createdAt: insertNow,
              isViewed: true, // Set to true since we're marking as viewed
              ...(this.viewMetadataColumnsAvailable
                ? {
                    lastViewedAt: insertNow,
                    viewCount: 1,
                  }
                : {}),
              isFavorited: false,
            })
            .run();
        });

        log.debug(
          `[PostsController] Post (postId: ${postData.postId}) marked as viewed in transaction`
        );
        return true;
      }

      // For existing posts (positive ID), atomically update post and artist counter.
      if (postId > 0) {
        const markViewedResult = db.transaction((tx) => {
          const post = tx
            .select({
              id: posts.id,
              isViewed: posts.isViewed,
              artistId: posts.artistId,
            })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .get();

          if (!post) {
            return false;
          }

          if (this.viewMetadataColumnsAvailable) {
            tx.update(posts)
              .set({
                isViewed: true,
                lastViewedAt: new Date(),
                viewCount: sql`${posts.viewCount} + 1`,
              })
              .where(eq(posts.id, postId))
              .run();
          } else {
            tx.update(posts)
              .set({ isViewed: true })
              .where(eq(posts.id, postId))
              .run();
          }

          if (post.isViewed) {
            return true;
          }

          tx.update(artists)
            .set({
              newPostsCount: sql`MAX(0, ${artists.newPostsCount} - 1)`,
            })
            .where(eq(artists.id, post.artistId))
            .run();

          return true;
        });

        if (markViewedResult) {
          log.debug(`[PostsController] Post ${postId} marked as viewed in transaction`);
          return true;
        }
      }

      // If post doesn't exist and no postData provided, return false (don't throw error for viewed status)
      log.warn(
        `[PostsController] Post with id ${postId} not found. For external posts from Browse, postData must be provided.`
      );
      return false;
    } catch (error) {
      log.error("[PostsController] Failed to mark post as viewed:", error);
      return false;
    }
  }

  /**
   * Mark all posts as viewed in one batch operation.
   * Uses synchronous better-sqlite3 statement to avoid async transaction overhead.
   */
  private async markAllViewed(
    _event: IpcMainInvokeEvent
  ): Promise<{ updatedCount: number }> {
    try {
      const db = this.getDb();
      const result = db.transaction((tx) => {
        const updatedPosts = tx
          .update(posts)
          .set({ isViewed: true })
          .where(or(eq(posts.isViewed, false), sql`${posts.isViewed} IS NULL`))
          .run();

        // Keep creators counters consistent with feed-wide "mark all read".
        tx.update(artists).set({ newPostsCount: 0 }).run();
        return updatedPosts;
      });

      const updatedCount = result.changes;
      log.info(`[PostsController] Mark all viewed completed. Updated: ${updatedCount}`);
      return { updatedCount };
    } catch (error) {
      log.error("[PostsController] Failed to mark all posts as viewed:", error);
      return { updatedCount: 0 };
    }
  }

  /**
   * Reset post cache (mark post as not viewed)
   *
   * @param _event - IPC event (unused)
   * @param postId - Post ID
   * @returns true if update succeeded
   * @throws {Error} If update fails
   */
  private async resetPostCache(
    _event: IpcMainInvokeEvent,
    postId: number
  ): Promise<boolean> {
    try {
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      db.transaction((tx) => {
        tx.update(posts)
          .set({ isViewed: false })
          .where(eq(posts.id, postId))
          .run();
      });

      log.info(
        `[PostsController] Post ${postId} cache reset (marked as not viewed)`
      );
      return true;
    } catch (error) {
      log.error("[PostsController] Failed to reset post cache:", error);
      return false;
    }
  }

  /**
   * Toggle favorite status for a post
   *
   * For posts from Browse (external posts), if post is not found in DB,
   * it will be created with the provided data.
   *
   * @param _event - IPC event (unused)
   * @param postId - Post ID (database ID for existing posts, or external postId for new posts)
   * @param postData - Optional post data for creating external posts from Browse
   * @returns New favorite state (true if favorited, false otherwise)
   * @throws {Error} If database operation fails
   */
  private async toggleFavorite(
    _event: IpcMainInvokeEvent,
    postId: number,
    postData?: PostData
  ): Promise<boolean> {
    try {
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      // All queries must be inside transaction for atomicity and efficiency
      type ToggleFavoriteResult =
        | {
            existingPostId: number;
            existingPostPostId: number;
            newFavoriteState: boolean;
          }
        | {
            newPostPostId: number;
            newFavoriteState: boolean;
          };

      const result = db.transaction((tx): ToggleFavoriteResult => {
        // Use shared helper method to find post
        const existingPost = this.findPostInTransaction(tx, postId, postData);

        // If post exists, toggle favorite status
        if (existingPost) {
          // Get current state before toggle
          const currentState = existingPost.isFavorited;
          const newState = !currentState;

          tx.update(posts)
            .set({ isFavorited: sql`NOT ${posts.isFavorited}` })
            .where(eq(posts.id, existingPost.id))
            .run();

          log.debug(
            `[PostsController] Post ${existingPost.id} (postId: ${existingPost.postId}) favorite toggled in transaction`
          );

          return {
            existingPostId: existingPost.id,
            existingPostPostId: existingPost.postId,
            newFavoriteState: newState,
          };
        }

        // Post doesn't exist - can only add to favorites (not remove)
        // Validate that postData is provided for network posts (Browse tab)
        if (!postData) {
          throw new Error(
            `Post with id ${postId} not found. For external posts from Browse, postData must be provided when adding to favorites.`
          );
        }

        // Validate required fields for NOT NULL constraints
        // Schema requires: fileUrl (NOT NULL), previewUrl (NOT NULL), tags (NOT NULL)
        if (!postData.fileUrl || postData.fileUrl.trim() === "") {
          throw new Error(
            `Post data validation failed: fileUrl is required and cannot be empty (NOT NULL constraint)`
          );
        }
        if (!postData.previewUrl || postData.previewUrl.trim() === "") {
          throw new Error(
            `Post data validation failed: previewUrl is required and cannot be empty (NOT NULL constraint)`
          );
        }

        // CRITICAL: Check if artist exists before inserting post (FOREIGN KEY constraint)
        // SECURITY: For external posts from Browse, always use EXTERNAL_ARTIST_ID
        // Never trust artistId from Renderer - it could be hijacked to target existing artists
        const targetArtistId = EXTERNAL_ARTIST_ID;

        // Use synchronous select query inside transaction
        // Drizzle with better-sqlite3 executes queries synchronously inside transactions
        const existingArtist = tx
          .select()
          .from(artists)
          .where(eq(artists.id, targetArtistId))
          .limit(1)
          .get();

        if (!existingArtist) {
          // Artist doesn't exist - create placeholder artist to satisfy FOREIGN KEY constraint
          const now = new Date();
          tx.insert(artists)
            .values({
              id: targetArtistId, // Explicit ID for placeholder artist
              name: `Artist ${targetArtistId}`,
              tag: `${EXTERNAL_ARTIST_TAG_PREFIX}${targetArtistId}`, // Unique tag for placeholder
              provider: "rule34", // Default provider
              type: "tag", // Default type
              apiEndpoint: "", // Safe default (required field)
              lastPostId: 0,
              newPostsCount: 0,
              createdAt: now,
            })
            .run();

          log.debug(
            `[PostsController] Created placeholder artist ${targetArtistId} for external post in transaction`
          );
        }

        // Create post with isFavorited = true (since we're adding to favorites via toggle)
        const now = new Date();
        const publishedAt = postData.publishedAt
          ? new Date(postData.publishedAt)
          : now;

        tx.insert(posts)
          .values({
            postId: postData.postId,
            artistId: EXTERNAL_ARTIST_ID, // SECURITY: Always use EXTERNAL_ARTIST_ID for external posts
            fileUrl: postData.fileUrl,
            previewUrl: postData.previewUrl,
            sampleUrl: postData.sampleUrl ?? "",
            title: "",
            rating: postData.rating ?? "",
            tags: postData.tags ?? "", // NOT NULL constraint - empty string is valid
            mediaType: isVideoUrl(postData.fileUrl) ? "video" : "image",
            publishedAt: publishedAt,
            createdAt: now,
            isViewed: false,
            isFavorited: true, // Set to true since we're adding to favorites
          })
          .run();

        log.debug(
          `[PostsController] Created new post (postId: ${postData.postId}) and set as favorited in transaction`
        );

        return {
          newPostPostId: postData.postId,
          newFavoriteState: true, // New posts are always favorited when created via toggle
        };
      });

      if ("existingPostId" in result) {
        log.info(
          `[PostsController] Post ${result.existingPostId} (postId: ${result.existingPostPostId}) favorite toggled to ${result.newFavoriteState}`
        );
        return result.newFavoriteState;
      }

      log.info(
        `[PostsController] Post new (postId: ${result.newPostPostId}) favorite toggled to ${result.newFavoriteState}`
      );
      return result.newFavoriteState;
    } catch (error) {
      log.error("[PostsController] Failed to toggle favorite:", error);
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }

  /**
   * Validates URL protocol to prevent RCE attacks
   * Only allows https: protocol or safe custom schemes
   * Blocks javascript:, data:, file:, and other dangerous protocols
   * 
   * @param urlString - URL string to validate
   * @returns true if URL is safe, false otherwise
   */
  /**
   * Validate URL protocol for security
   * 
   * SECURITY: Blocks dangerous protocols that could execute code or access local files.
   * Only allows https: and http: protocols for remote resources.
   * 
   * CRITICAL: Checks parsedUrl.protocol directly, not startsWith on raw string.
   * This prevents bypass attempts with spaces or special characters (e.g., " javascript:").
   * 
   * @param urlString - URL string to validate
   * @returns true if URL protocol is safe, false otherwise
   */
  private validateUrlProtocol(urlString: string): boolean {
    if (!urlString || typeof urlString !== "string") {
      return false;
    }

    try {
      const parsedUrl = new URL(urlString);
      // SECURITY: Only allow https: and http: protocols
      // Check protocol directly from parsed URL - this is the authoritative source
      // URL parser handles edge cases like spaces, special characters, etc.
      const protocol = parsedUrl.protocol.toLowerCase();
      if (protocol !== "https:" && protocol !== "http:") {
        return false;
      }
      
      return true;
    } catch {
      // Invalid URL format
      return false;
    }
  }

  /**
   * Get decrypted settings for API authentication
   *
   * @returns Decrypted settings or null if not available
   */
  private async getDecryptedSettings(): Promise<{
    userId: string;
    apiKey: string;
  } | null> {
    try {
      const db = this.getDb();
      const settingsRecord = await db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all();

      if (!settingsRecord || settingsRecord.length === 0) {
        return null;
      }

      const record = settingsRecord[0];
      if (!record.userId || !record.encryptedApiKey) {
        return null;
      }

      const credentials = getDecryptedCredentialsFromRecord(record);
      if (!credentials) {
        log.warn("[PostsController] Failed to decrypt API key");
        return null;
      }

      return credentials;
    } catch (error) {
      log.error("[PostsController] Failed to get decrypted settings:", error);
      return null;
    }
  }

  /**
   * Shadow Insert: Silently insert a remote post into the local database
   * 
   * CRITICAL SECURITY: Renderer only passes postId and provider.
   * Main process fetches post data from API to ensure data integrity.
   * This prevents Renderer from injecting malicious URLs or data.
   * 
   * @param _event - IPC event (unused)
   * @param request - Shadow insert request (postId + provider)
   * @returns Inserted post object (IPC-safe format with Date -> number conversion)
   */
  private async shadowInsertPost(
    _event: IpcMainInvokeEvent,
    request: { postId: number; provider: ProviderId }
  ): Promise<IpcPost> {
    // CRITICAL: Generate deduplication key for in-flight request tracking
    const dedupeKey = `${request.postId}-${request.provider}`;
    
    // Check if same request is already in-flight
    const existingPromise = PostsController.inFlightShadowInserts.get(dedupeKey);
    if (existingPromise) {
      log.debug(`[PostsController] Reusing in-flight shadow insert for ${dedupeKey}`);
      return existingPromise;
    }
    
    // Create new Promise for this request
    const insertPromise = this.performShadowInsert(request);
    
    // Store Promise for deduplication
    PostsController.inFlightShadowInserts.set(dedupeKey, insertPromise);
    
    // Clean up after Promise resolves/rejects (prevent memory leak)
    insertPromise
      .finally(() => {
        PostsController.inFlightShadowInserts.delete(dedupeKey);
      })
      .catch(() => {
        // Error already logged in performShadowInsert, just clean up
      });
    
    return insertPromise;
  }
  
  /**
   * Internal method that performs the actual shadow insert operation
   * Separated from public method to enable Promise reuse for deduplication
   */
  private async performShadowInsert(
    request: { postId: number; provider: ProviderId }
  ): Promise<IpcPost> {
    log.info(`[PostsController] Shadow insert attempt: postId=${request.postId}, provider=${request.provider}`);
    
    try {
      const db = this.getDb();

      // Step 1: Check if post already exists in DB
      const existingPost = db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.postId, request.postId),
            eq(posts.artistId, EXTERNAL_ARTIST_ID)
          )
        )
        .limit(1)
        .get();

      if (existingPost) {
        log.debug(`[PostsController] Shadow insert: Post already exists (id: ${existingPost.id}, postId: ${request.postId})`);
        return toIpcSafe(existingPost);
      }

      // Step 2: Fetch post data from API (Main process controls data source)
      const provider = getProvider(request.provider);
      const apiSettings = await this.getDecryptedSettings();
      
      if (!apiSettings) {
        throw new Error("API credentials not configured. Cannot fetch post data from provider.");
      }

      // Fetch post by ID using provider API
      // Most Booru APIs support id:postId query format
      const tagsQuery = `id:${request.postId}`;
      const booruPosts = await provider.fetchPosts(
        tagsQuery,
        0, // Page 0 for single post lookup
        {
          userId: apiSettings.userId,
          apiKey: apiSettings.apiKey,
        },
        false,
        50 // Preserve prior Rule34 default; single-id lookup does not need a full sync page
      );

      if (!booruPosts || booruPosts.length === 0) {
        throw new Error(`Post ${request.postId} not found in ${request.provider} API`);
      }

      const booruPost = booruPosts.find(p => p.id === request.postId);
      if (!booruPost) {
        throw new Error(`Post ${request.postId} not found in API response`);
      }

      // Step 3: Validate URLs from API response
      if (!booruPost.fileUrl || booruPost.fileUrl.trim() === "") {
        throw new Error("API returned post with empty fileUrl");
      }
      if (!booruPost.previewUrl || booruPost.previewUrl.trim() === "") {
        throw new Error("API returned post with empty previewUrl");
      }

      // CRITICAL SECURITY: Validate URL protocols to prevent RCE attacks
      // Only allow https: protocol - blocks javascript:, data:, file:, etc.
      if (!this.validateUrlProtocol(booruPost.fileUrl)) {
        throw new Error(`Invalid fileUrl protocol from API. Only HTTPS URLs are allowed.`);
      }
      if (!this.validateUrlProtocol(booruPost.previewUrl)) {
        throw new Error(`Invalid previewUrl protocol from API. Only HTTPS URLs are allowed.`);
      }
      if (booruPost.sampleUrl && booruPost.sampleUrl.trim() !== "" && !this.validateUrlProtocol(booruPost.sampleUrl)) {
        throw new Error(`Invalid sampleUrl protocol from API. Only HTTPS URLs are allowed.`);
      }

      // Step 4: Ensure EXTERNAL_ARTIST_ID exists (cached check)
      if (!this.externalArtistExistsCache) {
        db.transaction((tx) => {
          const now = new Date();
          tx.insert(artists)
            .values({
              id: EXTERNAL_ARTIST_ID,
              name: `Artist ${EXTERNAL_ARTIST_ID}`,
              tag: `${EXTERNAL_ARTIST_TAG_PREFIX}${EXTERNAL_ARTIST_ID}`,
              provider: request.provider,
              type: "tag",
              apiEndpoint: "",
              lastPostId: 0,
              newPostsCount: 0,
              createdAt: now,
            })
            .onConflictDoNothing()
            .run();
        });
        this.externalArtistExistsCache = true;
      }

      // Step 5: Insert post into database
      let insertedPost: InferSelectModel<typeof posts> | null = null;

      db.transaction((tx) => {
        const now = new Date();
        const publishedAt = booruPost.createdAt instanceof Date 
          ? booruPost.createdAt 
          : new Date(booruPost.createdAt || now);

        // Normalize tags: BooruPost.tags is string[], convert to space-separated string
        const tagsString = Array.isArray(booruPost.tags) 
          ? booruPost.tags.join(" ") 
          : booruPost.tags || "";

        // Normalize rating
        const rating = booruPost.rating || "";

        const result = tx
          .insert(posts)
          .values({
            postId: request.postId,
            artistId: EXTERNAL_ARTIST_ID,
            fileUrl: booruPost.fileUrl,
            previewUrl: booruPost.previewUrl,
            sampleUrl: booruPost.sampleUrl || "",
            title: "",
            rating: rating,
            tags: tagsString,
            mediaType: isVideoUrl(booruPost.fileUrl) ? "video" : "image",
            publishedAt: publishedAt,
            createdAt: now,
            isViewed: false,
            isFavorited: false,
          })
          .onConflictDoUpdate({
            target: [posts.artistId, posts.postId],
            set: {
              // Update URLs if they changed
              fileUrl: sql`excluded.file_url`,
              previewUrl: sql`excluded.preview_url`,
              sampleUrl: sql`excluded.sample_url`,
            },
          })
          .returning()
          .get();

        if (!result) {
          throw new Error(`Failed to insert post (postId: ${request.postId})`);
        }

        insertedPost = result;
        log.info(
          `[PostsController] Shadow insert: Post ${insertedPost.id} (postId: ${request.postId}) - ${insertedPost.createdAt.getTime() === now.getTime() ? "created" : "updated"}`
        );
      });

      if (!insertedPost) {
        throw new Error(`Failed to shadow insert post (postId: ${request.postId})`);
      }

      // Step 6: Return IPC-safe Post object
      return toIpcSafe(insertedPost);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`[PostsController] Failed to shadow insert post (postId: ${request.postId}):`, {
        error: errorMessage,
        postId: request.postId,
        provider: request.provider,
      });
      throw new Error(`Failed to cache post: ${errorMessage}`);
    }
  }
}
