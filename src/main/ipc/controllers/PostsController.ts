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
import { posts, artists, type Post } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { toIpcSafe } from "../../utils/ipc-serialization";
import {
  PostDataSchema,
  GetPostsSchema,
  type PostData,
  type GetPostsRequest,
  type PostFilterRequest,
} from "../../../shared/schemas/post";
import {
  EXTERNAL_ARTIST_ID,
  EXTERNAL_ARTIST_TAG_PREFIX,
} from "../../../shared/constants";
import { getSqliteInstance } from "../../db/client";
import { isVideoUrl } from "../../lib/media-utils";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * IPC-safe Post type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 *
 * Uses TypeScript utility types to automatically map Date fields to numbers.
 * This ensures type safety and eliminates manual field enumeration.
 */
type IpcPost = {
  [K in keyof Post]: Post[K] extends Date
    ? number
    : Post[K] extends Date | null
    ? number | null
    : Post[K];
};

// Internal types (not exported - use types from src/main/types/ipc.ts instead)
type GetPostsParams = GetPostsRequest;

/**
 * Posts Controller
 *
 * Handles IPC operations for post management:
 * - Get posts with pagination and filters
 * - Get posts count for artist
 * - Mark post as viewed
 */
export class PostsController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  // Cache FTS table existence check (schema doesn't change at runtime)
  // Initialized once at setup() to avoid blocking synchronous calls
  private ftsTableExistsCache: boolean = false;

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
   * Setup IPC handlers for post operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS,
      z.tuple([GetPostsSchema]),
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.getPosts.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS_COUNT,
      z.tuple([z.number().int().positive().optional()]),
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.getPostsCount.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.MARK_VIEWED,
      z.tuple([
        z.number().int(), // Allow negative IDs for external posts from Browse
        PostDataSchema.optional(),
      ]),
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.markViewed.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.RESET_POST_CACHE,
      z.tuple([z.number().int().positive()]),
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.resetPostCache.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.TOGGLE_FAVORITE,
      z.tuple([
        z.number().int(), // Allow negative IDs for external posts from Browse
        PostDataSchema.optional(),
      ]),
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.toggleFavorite.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    // Initialize FTS table check once at setup (avoids blocking synchronous calls at runtime)
    this.initializeFtsTableCheck();

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
  ): Post | undefined {
    // CRITICAL: Negative IDs indicate external posts (from Browse) that haven't been saved to DB yet
    // For negative IDs, skip DB lookup by id and go straight to postId lookup
    // For positive IDs, try to find by database ID first (existing posts from DB)
    let existingPost: Post | undefined;

    if (postId > 0) {
      // Positive ID - try to find by database ID (existing posts from DB)
      existingPost = tx
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1)
        .all()[0];
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
        .all()[0];
    }

    return existingPost;
  }

  /**
   * Sanitize FTS5 search query to prevent SQL injection and syntax errors
   *
   * SECURITY: Strict whitelist approach - only allow alphanumeric characters,
   * spaces, hyphens, underscores, and * at end of words for prefix search.
   * All FTS5 operators (:, NEAR, AND, OR, NOT, etc.) are completely blocked.
   *
   * @param query - FTS5 query string (user input from Renderer)
   * @returns Sanitized query string safe for FTS5 MATCH
   * @throws {Error} If query contains invalid characters or becomes empty after sanitization
   */
  private sanitizeFts5Query(query: string): string {
    // SECURITY: Strict whitelist validation - reject any input not matching pattern
    // Only allow: alphanumeric, spaces, hyphens, underscores, and * at end of words
    // Pattern: ^[a-zA-Z0-9_* ]+$ with additional validation for * placement
    // This prevents FTS5 injection via Unicode tricks or operator sequences

    // Trim and validate non-empty
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      throw new Error(
        "FTS5 query is empty. Please provide valid search terms."
      );
    }

    // CRITICAL: Strict whitelist regex - reject anything not matching
    // Allow: a-z, A-Z, 0-9, _, -, space, and * (but validate * placement)
    const strictWhitelistRegex = /^[a-zA-Z0-9_* -]+$/;
    if (!strictWhitelistRegex.test(trimmed)) {
      throw new Error(
        `Invalid FTS5 query: "${query}". Only alphanumeric characters, spaces, hyphens, underscores, and trailing asterisks are allowed.`
      );
    }

    // Split by spaces to handle multiple tags
    const words = trimmed.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      throw new Error(
        "FTS5 query is empty. Please provide valid search terms."
      );
    }

    // Validate and sanitize each word
    // CRITICAL: * can only appear at the end of a word (prefix search)
    // Reject * in middle or beginning, or multiple * characters
    const sanitizedWords = words.map((word) => {
      // Check if * appears anywhere except at the end
      const starIndex = word.indexOf("*");
      if (starIndex !== -1 && starIndex !== word.length - 1) {
        throw new Error(
          `Invalid search term: "${word}". Asterisk (*) can only appear at the end of a word for prefix search.`
        );
      }

      // Check for multiple asterisks
      const starCount = (word.match(/\*/g) || []).length;
      if (starCount > 1) {
        throw new Error(
          `Invalid search term: "${word}". Only one asterisk (*) allowed at the end of a word.`
        );
      }

      // Remove * for base validation, then add back if it was trailing
      const hasTrailingStar = word.endsWith("*");
      const baseWord = hasTrailingStar ? word.slice(0, -1) : word;

      if (baseWord.trim().length === 0) {
        throw new Error(
          `Invalid search term: "${word}". Search term cannot be empty or only asterisk.`
        );
      }

      return hasTrailingStar ? `${baseWord.trim()}*` : baseWord.trim();
    });

    // Join words with spaces and wrap in quotes for FTS5 literal phrase search
    const sanitized = sanitizedWords.join(" ");

    // Escape double quotes by doubling them (FTS5 escaping rule)
    const escaped = sanitized.replace(/"/g, '""');

    // Wrap in double quotes to make FTS5 treat it as a literal phrase
    // This prevents FTS5 from interpreting any remaining characters as operators
    return `"${escaped}"`;
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
    const ftsTableExists = this.checkFtsTableExists();

    if (ftsTableExists) {
      // Use FTS5 for fast full-text search
      // Sanitize FTS5 query to prevent syntax errors from special characters
      // Wrap in quotes and escape internal quotes so FTS5 treats input as literal
      const sanitized = this.sanitizeFts5Query(tagFilter);

      // Use EXISTS with FTS5 JOIN pattern for better performance than IN (SELECT ...)
      // This allows SQLite optimizer to use FTS5 index efficiently
      // CRITICAL: Never use sql.raw() with user input - this prevents SQL injection
      // Drizzle's sql template automatically parameterizes the value
      return sql`EXISTS (
        SELECT 1 FROM posts_fts 
        WHERE posts_fts.rowid = ${posts.id} 
          AND posts_fts MATCH ${sanitized}
      )`;
    } else {
      // CRITICAL: Do NOT use LIKE %...% fallback - it causes Main Process freeze on large databases
      // LIKE %...% with leading wildcard disables indexes and causes Full Table Scan
      // On 100k+ records, this will freeze the entire Electron app
      // If FTS5 table doesn't exist, throw error instead of killing the app
      log.error(
        `[PostsController] FTS5 table does not exist for tag filtering. ` +
        `LIKE %...% fallback would freeze Main Process on large databases. ` +
        `Please ensure FTS5 migration (0006_add_fts5_search.sql) completed successfully.`
      );
      // Return condition that matches nothing (empty result) instead of freezing
      // This is safer than LIKE %...% which would freeze the app
      return sql`1 = 0`;
    }
  }

  /**
   * Build WHERE conditions array for post filtering
   * Centralized logic to avoid code duplication (DRY principle)
   *
   * @param artistId - Optional artist ID filter
   * @param filters - Optional post filters (tags, rating, isViewed, isFavorited)
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

    if (filters?.rating !== undefined) {
      conditions.push(eq(posts.rating, filters.rating));
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

        // Build FTS5 query: "ai_generated OR ai-generated OR ..."
        // SECURITY: Validate and sanitize each tag, then construct query safely
        // Even though tags are hardcoded, we validate them to prevent future bugs if list changes
        // Use sanitizeFts5Query for each tag, then join with OR (which is safe for hardcoded tags)
        const sanitizedTagQueries = aiTags.map((tag) => {
          // Validate tag format: only alphanumeric, hyphens, underscores allowed
          // This prevents injection if aiTags list is ever extended to user input
          if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
            throw new Error(
              `Invalid AI tag format: "${tag}". Only alphanumeric, hyphens, and underscores allowed.`
            );
          }
          // Escape quotes for FTS5 (double quotes for literal)
          return `"${tag.replace(/"/g, '""')}"`;
        });

        // Join with OR - safe because all tags are validated above
        // FTS5 OR operator is safe when all operands are validated literals
        const ftsQuery = sanitizedTagQueries.join(" OR ");

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
              ) as SQL
            );
          } else {
            // Only AI posts: FTS5 match
            conditions.push(
              sql`EXISTS (
                SELECT 1 FROM posts_fts 
                WHERE posts_fts.rowid = ${posts.id} 
                  AND posts_fts MATCH ${ftsQuery}
              )` as SQL
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
          const aiOrCondition = or(...aiConditions) as SQL;
          if (filters.aiFilter === "hide") {
            conditions.push(not(aiOrCondition));
          } else {
            conditions.push(aiOrCondition);
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
      conditions.push(
        or(
          eq(posts.mediaType, "image"),
          sql`${posts.mediaType} IS NULL`
        ) as SQL
      );
    }

    return conditions;
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
    const { artistId, page, filters, limit } = params;
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

        const result = await db
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
            publishedAt: posts.publishedAt,
            createdAt: posts.createdAt,
            isViewed: posts.isViewed,
            isFavorited: posts.isFavorited,
          })
          .from(posts)
          .innerJoin(artists, joinConditions)
          .where(finalWhereClause)
          .orderBy(desc(posts.publishedAt))
          .limit(limit)
          .offset(offset);

        log.info(
          `[PostsController] Retrieved ${result.length} posts ${
            artistId ? `for artist ${artistId}` : "globally"
          } (page ${page}, sinceTracking: true)`
        );

        // Convert Date objects to numbers for Electron 39+ IPC serialization
        return toIpcSafe(result) as IpcPost[];
      }

      // Standard query path (no sinceTracking filter)
      // Build where conditions array using centralized method
      const baseConditions = this.buildPostFilterConditions(artistId, filters);

      // Combine all conditions using and()
      const whereClause =
        baseConditions.length > 0 ? and(...baseConditions) : undefined;

      // CRITICAL: Explicitly select all fields including rating
      // This ensures rating is included in the response for Safe Mode filtering
      const result = await db
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
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          isViewed: posts.isViewed,
          isFavorited: posts.isFavorited,
        })
        .from(posts)
        .where(whereClause)
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset(offset);

      log.info(
        `[PostsController] Retrieved ${result.length} posts ${
          artistId ? `for artist ${artistId}` : "globally"
        } (page ${page})`
      );

      // Convert Date objects to numbers for Electron 39+ IPC serialization
      // Uses universal toIpcSafe utility to avoid code duplication
      return toIpcSafe(result) as IpcPost[];
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
    artistId: number | undefined
  ): Promise<number> {
    try {
      const db = this.getDb();
      const whereClause = artistId ? eq(posts.artistId, artistId) : undefined;

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

      // If postData is provided, use onConflictDoUpdate for atomic insert/update
      // This eliminates the need for separate select + insert/update queries
      if (postData) {
        const now = new Date();
        const publishedAt = postData.publishedAt
          ? new Date(postData.publishedAt)
          : now;

        // Use onConflictDoUpdate to atomically insert or update post
        // Target: unique constraint on (artistId, postId)
        // SECURITY: Always use EXTERNAL_ARTIST_ID for external posts
        db.insert(posts)
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
            createdAt: now,
            isViewed: true, // Set to true since we're marking as viewed
            isFavorited: false,
          })
          .onConflictDoUpdate({
            target: [posts.artistId, posts.postId],
            set: {
              isViewed: sql`1`, // SQLite boolean: 1 = true
            },
          })
          .run();

        log.debug(
          `[PostsController] Post (postId: ${postData.postId}) marked as viewed using onConflictDoUpdate`
        );
        return true;
      }

      // For existing posts (positive ID), update directly
      if (postId > 0) {
        const updated = db
          .update(posts)
          .set({ isViewed: true })
          .where(eq(posts.id, postId))
          .run();

        if (updated.changes > 0) {
          log.debug(`[PostsController] Post ${postId} marked as viewed`);
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
      let result: ToggleFavoriteResult | null = null;

      db.transaction((tx) => {
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

          result = {
            existingPostId: existingPost.id,
            existingPostPostId: existingPost.postId,
            newFavoriteState: newState,
          };
        } else {
          // Post doesn't exist - can only add to favorites (not remove)
          // For toggle operation, if post doesn't exist, we're adding it to favorites (isFavorite = true)
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
            .all()[0]; // Get first result or undefined

          if (!existingArtist) {
            // Artist doesn't exist - create placeholder artist to satisfy FOREIGN KEY constraint
            // Use explicit id (SQLite allows this even with autoIncrement by using INSERT with explicit id)
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

          result = {
            newPostPostId: postData.postId,
            newFavoriteState: true, // New posts are always favorited when created via toggle
          };
        }
      });

      if (!result) {
        throw new Error(
          `Post with id ${postId} not found or not updated. For external posts from Browse, postData must be provided.`
        );
      }

      if ("existingPostId" in result) {
        const r = result as {
          existingPostId: number;
          existingPostPostId: number;
          newFavoriteState: boolean;
        };
        log.info(
          `[PostsController] Post ${r.existingPostId} (postId: ${r.existingPostPostId}) favorite toggled to ${r.newFavoriteState}`
        );
        return r.newFavoriteState;
      } else {
        const r = result as {
          newPostPostId: number;
          newFavoriteState: boolean;
        };
        log.info(
          `[PostsController] Post new (postId: ${r.newPostPostId}) favorite toggled to ${r.newFavoriteState}`
        );
        return r.newFavoriteState;
      }
    } catch (error) {
      log.error("[PostsController] Failed to toggle favorite:", error);
      // Re-throw original error to preserve stack trace and context
      throw error;
    }
  }
}
