import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, desc, and, inArray, sql, or, not, asc, type SQL } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { playlists, playlistEntries, posts } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { toIpcSafe } from "../../utils/ipc-serialization";
import type { InferSelectModel } from "drizzle-orm";
import type { IpcSafe } from "../../../shared/types/ipc";
import {
  CreatePlaylistSchema,
  UpdatePlaylistSchema,
  AddPostsToPlaylistSchema,
  RemovePostsFromPlaylistSchema,
  GetPlaylistPostsSchema,
  ResolvePlaylistPostsSchema,
  type CreatePlaylistRequest,
  type UpdatePlaylistRequest,
  type AddPostsToPlaylistRequest,
  type RemovePostsFromPlaylistRequest,
  type GetPlaylistPostsRequest,
  type ResolvePlaylistPostsRequest,
  type SmartPlaylistQuery,
} from "../../../shared/schemas/playlist";
import {
  CURRENT_SMART_QUERY_SCHEMA_VERSION,
  parseSmartQuery,
} from "../../../shared/schemas/smart-playlist-query";
import { isVideoUrl } from "@shared/utils/media";
import { EXTERNAL_ARTIST_ID, MAX_RANDOM_PAGES } from "../../../shared/constants";
import { getSqliteInstance } from "../../db/client";
import { getProvider } from "../../providers";
import { settings, SETTINGS_ID } from "../../db/schema";
import { safeStorage } from "electron";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * IPC-safe Playlist type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 * 
 * Uses shared IpcSafe utility type for automatic Date -> number conversion.
 */
type IpcPlaylist = IpcSafe<InferSelectModel<typeof playlists>>;

/**
 * IPC-safe Post type with Date fields converted to numbers (timestamps in milliseconds).
 * 
 * Uses shared IpcSafe utility type for automatic Date -> number conversion.
 */
type IpcPost = IpcSafe<InferSelectModel<typeof posts>>;

/**
 * Playlist Controller
 *
 * Handles IPC operations for playlist management:
 * - Create playlist
 * - Get all playlists
 * - Get playlist by ID
 * - Update playlist
 * - Delete playlist
 * - Add posts to playlist(s)
 * - Remove posts from playlist
 * - Get posts in playlist with filters
 */
export class PlaylistController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  // Cache FTS5 table count to avoid blocking Main Process with COUNT(*) queries
  // Initialized lazily on first use and invalidated when posts_fts changes
  private fts5CountCache: number | null = null;
  private fts5CountCacheInitialized: boolean = false;
  private fts5CountCacheTimestamp: number | null = null; // Timestamp when cache was last updated
  
  // Cache FTS5 table existence check (schema doesn't change at runtime)
  // Initialized once at setup() to avoid blocking synchronous calls
  private ftsTableExistsCache: boolean = false;

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

      // Decrypt API key using Electron's safeStorage
      let apiKey = record.encryptedApiKey;
      if (apiKey && safeStorage.isEncryptionAvailable()) {
        try {
          const buff = Buffer.from(apiKey, "base64");
          apiKey = safeStorage.decryptString(buff);
        } catch (e) {
          log.warn("[PlaylistController] Failed to decrypt API Key.", e);
          apiKey = record.encryptedApiKey;
        }
      }

      return {
        userId: record.userId,
        apiKey: apiKey,
      };
    } catch (error) {
      log.error("[PlaylistController] Failed to get decrypted settings:", error);
      return null;
    }
  }

  /**
   * Build booru query string from smart playlist tags
   * 
   * Format: include tags joined with spaces (AND logic), exclude tags prefixed with minus (NOT logic)
   * Example: "bioshock blowjob -futa -loli"
   * 
   * @param query - Smart playlist query with tags
   * @returns Booru query string
   */
  private buildBooruQueryString(query: SmartPlaylistQuery): string {
    const includeTags = query.tags
      .filter((t) => t.type === "include")
      .map((t) => t.tag.trim().toLowerCase())
      .filter(Boolean);
    
    const excludeTags = query.tags
      .filter((t) => t.type === "exclude")
      .map((t) => `-${t.tag.trim().toLowerCase()}`)
      .filter(Boolean);
    
    const allTags = [...includeTags, ...excludeTags];
    return allTags.join(" ");
  }

  /**
   * Setup IPC handlers for playlist operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.CREATE_PLAYLIST,
      z.tuple([CreatePlaylistSchema]),
      this.createPlaylist.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLISTS,
      z.tuple([]),
      this.getPlaylists.bind(this),
      { isIdempotent: true } // Mark as idempotent for better rate limiting and request collapsing
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLIST,
      z.tuple([z.number().int().positive()]),
      this.getPlaylist.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.DB.UPDATE_PLAYLIST,
      z.tuple([z.number().int().positive(), UpdatePlaylistSchema]),
      this.updatePlaylist.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.DB.DELETE_PLAYLIST,
      z.tuple([z.number().int().positive()]),
      this.deletePlaylist.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.DB.ADD_POSTS_TO_PLAYLIST,
      z.tuple([AddPostsToPlaylistSchema]),
      this.addPostsToPlaylist.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.DB.REMOVE_POSTS_FROM_PLAYLIST,
      z.tuple([RemovePostsFromPlaylistSchema]),
      this.removePostsFromPlaylist.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLIST_POSTS,
      z.tuple([GetPlaylistPostsSchema]),
      this.getPlaylistPosts.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.DB.RESOLVE_PLAYLIST_POSTS,
      z.tuple([ResolvePlaylistPostsSchema]),
      this.resolvePlaylistPosts.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLISTS_CONTAINING_POST,
      z.tuple([z.number().int(), z.number().int().positive().optional()]),
      this.getPlaylistsContainingPost.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    log.info("[PlaylistController] All handlers registered");
    
    // CRITICAL: Initialize FTS5 table existence check once at setup
    // This avoids blocking Main Process with synchronous SQLite calls during runtime
    this.initializeFtsTableCheck();
    
    // CRITICAL: Do NOT initialize FTS5 count cache synchronously in setup()
    // This would block Main Process during app startup if database is large.
    // Instead, initialize lazily on first use in buildSmartPlaylistTagConditions.
    // This ensures app starts quickly and FTS5 count is only checked when needed.
  }

  /**
   * Initialize FTS5 table existence check (called once at setup)
   * This avoids blocking synchronous SQLite calls during runtime
   */
  private initializeFtsTableCheck(): void {
    try {
      const sqlite = getSqliteInstance();
      const stmt = sqlite.prepare<[], { name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='posts_fts'"
      );
      const result = stmt.get();
      this.ftsTableExistsCache = !!result;
      log.info(
        `[PlaylistController] FTS5 table check initialized: ${this.ftsTableExistsCache}`
      );
    } catch (error) {
      log.warn(
        "[PlaylistController] Failed to check FTS5 table existence, assuming it doesn't exist:",
        error
      );
      this.ftsTableExistsCache = false;
    }
  }

  /**
   * Initialize FTS5 count cache lazily (called on first use, not at startup)
   * This avoids blocking Main Process during app startup
   * 
   * PERFORMANCE: Uses O(1) lookup from fts5_count_meta table instead of O(n) COUNT(*)
   * The count is maintained by SQLite triggers, ensuring accuracy without blocking Main Process
   * 
   * CACHE INVALIDATION: Checks fts5_cache_invalidation table to ensure cache is still valid.
   * If posts were added/updated/deleted through other controllers, cache is automatically invalidated.
   * 
   * GRACEFUL DEGRADATION: If fts5_count_meta table doesn't exist (migration not applied),
   * falls back to COUNT(*) with a warning. This ensures app works even if migration hasn't been applied yet.
   */
  private initializeFts5CountCache(): void {
    // Check if cache needs invalidation by comparing timestamps
    const sqlite = getSqliteInstance();
    
    try {
      // Get current invalidation timestamp from database
      // If table doesn't exist, this will throw and we'll fall back to simple caching
      const invalidationStmt = sqlite.prepare<[], { invalidated_at: number }>(
        "SELECT invalidated_at FROM fts5_cache_invalidation WHERE id = 1"
      );
      const invalidation = invalidationStmt.get();
      
      if (invalidation) {
        // If cache exists but timestamp changed, invalidate it
        if (this.fts5CountCacheInitialized && 
            this.fts5CountCacheTimestamp !== null &&
            this.fts5CountCacheTimestamp < invalidation.invalidated_at) {
          log.debug(
            `[PlaylistController] FTS5 cache invalidated (timestamp changed: ${this.fts5CountCacheTimestamp} -> ${invalidation.invalidated_at})`
          );
          this.fts5CountCache = null;
          this.fts5CountCacheInitialized = false;
        }
        
        // Only initialize if not already initialized or if cache was invalidated
        if (!this.fts5CountCacheInitialized) {
          // PERFORMANCE: Use O(1) lookup from fts5_count_meta table instead of O(n) COUNT(*)
          // This prevents Main Process blocking on large databases (100k+ records)
          try {
            const countStmt = sqlite.prepare<[], { count: number }>(
              "SELECT count FROM fts5_count_meta WHERE id = 1"
            );
            const countResult = countStmt.get();
            
            if (countResult) {
              this.fts5CountCache = countResult.count;
              this.fts5CountCacheTimestamp = invalidation.invalidated_at;
              this.fts5CountCacheInitialized = true;
              log.info(
                `[PlaylistController] FTS5 count cache initialized from meta table: ${this.fts5CountCache} entries (timestamp: ${this.fts5CountCacheTimestamp})`
              );
            } else {
              // Meta table exists but no row (should not happen, but handle gracefully)
              log.warn("[PlaylistController] fts5_count_meta table exists but has no row, falling back to COUNT(*)");
              this.fallbackToCountQuery(sqlite, invalidation.invalidated_at);
            }
          } catch (metaError) {
            // Meta table doesn't exist (migration 0011 not applied), fall back to COUNT(*)
            const errorMessage = metaError instanceof Error ? metaError.message : String(metaError);
            if (errorMessage.includes("no such table: fts5_count_meta")) {
              log.warn(
                "[PlaylistController] fts5_count_meta table not found (migration 0011 not applied), " +
                "falling back to COUNT(*) which may block Main Process on large databases. " +
                "Apply migration 0011_add_fts5_count_meta.sql for O(1) performance."
              );
              this.fallbackToCountQuery(sqlite, invalidation.invalidated_at);
            } else {
              throw metaError;
            }
          }
        }
      } else {
        // Table exists but no row (should not happen, but handle gracefully)
        log.warn("[PlaylistController] fts5_cache_invalidation table exists but has no row, initializing cache without invalidation tracking");
        this.fallbackToCountQuery(sqlite, Date.now());
      }
    } catch (error) {
      // GRACEFUL DEGRADATION: If table doesn't exist (migration not applied), fall back to simple caching
      // This ensures app works even if migration 0010_add_fts5_cache_invalidation.sql hasn't been applied yet
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("no such table: fts5_cache_invalidation")) {
        log.debug(
          "[PlaylistController] fts5_cache_invalidation table not found (migration 0010 not applied), " +
          "using simple caching without invalidation tracking. Cache will be initialized once and not invalidated."
        );
        // Fall back to simple caching without invalidation tracking
        if (!this.fts5CountCacheInitialized) {
          this.fallbackToCountQuery(sqlite, Date.now());
        }
      } else {
        // Other errors (not "table not found") are logged as warnings
        log.warn("[PlaylistController] Failed to initialize FTS5 count cache:", error);
        this.fts5CountCache = null;
        this.fts5CountCacheInitialized = false;
        this.fts5CountCacheTimestamp = null;
      }
    }
  }

  /**
   * Fallback to COUNT(*) query when meta table is not available
   * 
   * PERFORMANCE WARNING: This is O(n) and may block Main Process on large databases (100k+ records)
   * Should only be used when migration 0011_add_fts5_count_meta.sql hasn't been applied
   * 
   * @param sqlite - SQLite instance
   * @param timestamp - Cache timestamp
   */
  private fallbackToCountQuery(sqlite: ReturnType<typeof getSqliteInstance>, timestamp: number): void {
    try {
      const countStmt = sqlite.prepare<[], { count: number }>(
        "SELECT COUNT(*) as count FROM posts_fts"
      );
      const ftsCount = countStmt.get();
      this.fts5CountCache = ftsCount?.count ?? 0;
      this.fts5CountCacheTimestamp = timestamp;
      this.fts5CountCacheInitialized = true;
      log.info(
        `[PlaylistController] FTS5 count cache initialized (fallback mode): ${this.fts5CountCache} entries. ` +
        `Note: Using COUNT(*) which may block Main Process on large databases. Apply migration 0011_add_fts5_count_meta.sql for O(1) performance.`
      );
    } catch (countError) {
      log.warn("[PlaylistController] Failed to initialize FTS5 count cache (fallback):", countError);
      this.fts5CountCache = null;
      this.fts5CountCacheInitialized = false;
      this.fts5CountCacheTimestamp = null;
    }
  }

  /**
   * Get FTS5 count (cached, checked once at initialization)
   * @returns FTS5 count or null if not initialized
   */
  private getFts5Count(): number | null {
    return this.fts5CountCache;
  }

  /**
   * Check if FTS5 table exists (cached check)
   * @returns true if FTS5 table exists, false otherwise
   */
  private checkFtsTableExists(): boolean {
    return this.ftsTableExistsCache;
  }

  /**
   * Build SQL conditions from smart playlist tag query
   *
   * Include tags are combined with AND logic.
   * Exclude tags are combined with OR logic (standard booru search).
   * Uses FTS5 for optimal performance.
   *
   * For include tags: Use a single FTS5 query with AND operator inside FTS5
   * For exclude tags: Use OR operator inside FTS5, then wrap in NOT
   *
   * @param query - Smart playlist query object (tag-centric)
   * @returns Object with includeConditions and excludeConditions arrays
   */
  private buildSmartPlaylistTagConditions(query: SmartPlaylistQuery): {
    includeConditions: SQL[];
    excludeConditions: SQL[];
  } {
    const includeConditions: SQL[] = [];
    const excludeConditions: SQL[] = [];
    const ftsTableExists = this.checkFtsTableExists();

    if (!ftsTableExists) {
      log.error(
        "[PlaylistController] FTS5 table does not exist for tag filtering in smart playlist"
      );
      return { includeConditions: [sql`1 = 0`], excludeConditions: [] };
    }

    // Check if FTS5 table has any data (use cached count to avoid blocking Main Process)
    // CRITICAL: Do NOT populate FTS5 table here - this blocks Main Process
    // FTS5 population should happen:
    // 1. During migration (0006_add_fts5_search.sql) - one-time operation
    // 2. Via triggers (automatic on INSERT/UPDATE)
    // 3. In background maintenance task (if needed)
    // 
    // If FTS5 table is empty, it means:
    // - Migration didn't run (should not happen in production)
    // - Triggers are not working (schema issue)
    // - Database is new (triggers will populate automatically)
    //
    // In any case, blocking IPC handler with COUNT(*) is unacceptable.
    // Return empty result instead of blocking UI.
    // Initialize cache lazily on first use (not at startup)
    // CACHE INVALIDATION: Cache is automatically invalidated by SQLite triggers
    // when posts_fts changes (INSERT/UPDATE/DELETE), ensuring accuracy even if
    // posts are added through other controllers or direct database operations
    // 
    // GRACEFUL DEGRADATION: If fts5_cache_invalidation table doesn't exist,
    // falls back to simple caching without invalidation checks
    if (!this.fts5CountCacheInitialized) {
      this.initializeFts5CountCache();
    } else {
      // Check if cache needs invalidation (posts may have been added through other controllers)
      // This is a lightweight check (single SELECT) compared to COUNT(*)
      // Only perform if cache invalidation table exists (migration applied)
      try {
        const sqlite = getSqliteInstance();
        const invalidationStmt = sqlite.prepare<[], { invalidated_at: number }>(
          "SELECT invalidated_at FROM fts5_cache_invalidation WHERE id = 1"
        );
        const invalidation = invalidationStmt.get();
        
        if (invalidation && 
            this.fts5CountCacheTimestamp !== null &&
            this.fts5CountCacheTimestamp < invalidation.invalidated_at) {
          // Cache is stale, reinitialize
          log.debug("[PlaylistController] FTS5 cache is stale, reinitializing...");
          this.fts5CountCache = null;
          this.fts5CountCacheInitialized = false;
          this.fts5CountCacheTimestamp = null;
          this.initializeFts5CountCache();
        }
      } catch (error) {
        // If invalidation check fails (table doesn't exist), continue with existing cache
        // This is graceful degradation - app works without migration, just without cache invalidation
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("no such table: fts5_cache_invalidation")) {
          // Only log non-"table not found" errors as debug (not warnings)
          log.debug("[PlaylistController] Failed to check FTS5 cache invalidation:", error);
        }
      }
    }
    
    const count = this.getFts5Count();
    
    if (count === null || count === 0) {
      if (count === 0) {
        log.warn(
          "[PlaylistController] FTS5 table exists but is empty (cached). " +
          "This may indicate that posts table has no data or FTS5 triggers are not working. " +
          "Returning empty result to avoid blocking Main Process. " +
          "FTS5 should be populated by migration 0006_add_fts5_search.sql or triggers."
        );
      }
      // Return empty conditions to avoid blocking - FTS5 will be populated by triggers
      // or background maintenance task, not during user request
      return { includeConditions: [sql`1 = 0`], excludeConditions: [] };
    }

    // Build include tags query: combine all include tags with AND inside FTS5
    const includeTags = query.tags.filter((t) => t.type === "include").map((t) => t.tag);
    if (includeTags.length > 0) {
      try {
        // Sanitize each tag individually (validate format and normalize)
        const sanitizedTags = includeTags.map((tag) => {
          log.debug(`[PlaylistController] Processing include tag: ${tag}`);
          
          // Validate tag format and normalize (trim, lowercase for consistency with unicode61 tokenizer)
          const trimmed = tag.trim().toLowerCase();
          if (trimmed.length === 0) {
            throw new Error("Tag cannot be empty");
          }
          
          // SECURITY: Block single asterisk (*) - it can cause unpredictable FTS5 parser behavior
          // FTS5 wildcard (*) must be at the end of a tag, not standalone
          if (trimmed === "*") {
            throw new Error(`Invalid tag: "*". Wildcard (*) can only appear at the end of tags, not as a standalone tag.`);
          }
          
          const strictWhitelistRegex = /^[a-zA-Z0-9_* -]+$/;
          if (!strictWhitelistRegex.test(trimmed)) {
            throw new Error(`Invalid tag: "${tag}". Only alphanumeric characters, spaces, hyphens, underscores, and trailing asterisks are allowed.`);
          }
          
          // For FTS5, tags should be used without quotes unless they contain spaces
          // Since we validate that tags don't contain special characters, we can use them directly
          // SECURITY: Escape double quotes in tags to prevent FTS5 query injection
          // FTS5 uses double quotes for phrase matching, so we need to escape them
          // Replace " with "" (FTS5 escape sequence) to safely include quotes in tags
          const escapedTag = trimmed.replace(/"/g, '""');
          return escapedTag;
        });
        
        // Combine with AND operator (uppercase as required by FTS5 syntax)
        // FTS5 syntax: tag1 AND tag2 (no quotes around individual tags)
        const combinedQuery = sanitizedTags.join(" AND ");
        
        // DEFENSE IN DEPTH: Additional validation for FTS5 query safety
        // Check for dangerous FTS5 operators that could break query parsing
        // FTS5 special characters: : (colon for column specifier), * (wildcard only at end), " (quotes)
        // Block queries that start with * (invalid), contain : (column specifier), or have unbalanced quotes
        if (combinedQuery.includes(":")) {
          throw new Error(`Invalid FTS5 query: colon (:) is not allowed in tag queries`);
        }
        if (combinedQuery.includes("*") && !/^[a-zA-Z0-9_ -]+\*(\s+AND\s+[a-zA-Z0-9_ -]+\*?)*$/i.test(combinedQuery)) {
          // Allow trailing * for prefix search, but block * at start or middle
          throw new Error(`Invalid FTS5 query: wildcard (*) can only appear at the end of tags`);
        }
        if ((combinedQuery.match(/"/g) || []).length % 2 !== 0) {
          throw new Error(`Invalid FTS5 query: unbalanced quotes`);
        }
        
        log.debug(`[PlaylistController] Combined FTS5 include query: ${combinedQuery}`);
        
        // CRITICAL SECURITY: Use Drizzle sql template with parameterization instead of sql.raw()
        // Drizzle will properly escape the FTS5 query string, preventing SQL injection
        // Even though tags are validated, we use parameterization as defense in depth
        // FTS5 MATCH accepts string literals, and Drizzle handles the escaping correctly
        const includeCondition = sql`EXISTS (
          SELECT 1 FROM posts_fts 
          WHERE posts_fts.rowid = ${posts.id}
            AND posts_fts MATCH ${combinedQuery}
        )`;
        
        includeConditions.push(includeCondition);
      } catch (error) {
        log.error(
          `[PlaylistController] Failed to build include tags condition:`,
          error
        );
      }
    }

    // Build exclude tags query: combine all exclude tags with OR inside FTS5
    const excludeTags = query.tags.filter((t) => t.type === "exclude").map((t) => t.tag);
    if (excludeTags.length > 0) {
      try {
        // Sanitize each tag individually (validate format and normalize)
        const sanitizedTags = excludeTags.map((tag) => {
          log.debug(`[PlaylistController] Processing exclude tag: ${tag}`);
          
          // Validate tag format and normalize (trim, lowercase for consistency with unicode61 tokenizer)
          const trimmed = tag.trim().toLowerCase();
          if (trimmed.length === 0) {
            throw new Error("Tag cannot be empty");
          }
          
          // SECURITY: Block single asterisk (*) - it can cause unpredictable FTS5 parser behavior
          // FTS5 wildcard (*) must be at the end of a tag, not standalone
          if (trimmed === "*") {
            throw new Error(`Invalid tag: "*". Wildcard (*) can only appear at the end of tags, not as a standalone tag.`);
          }
          
          const strictWhitelistRegex = /^[a-zA-Z0-9_* -]+$/;
          if (!strictWhitelistRegex.test(trimmed)) {
            throw new Error(`Invalid tag: "${tag}". Only alphanumeric characters, spaces, hyphens, underscores, and trailing asterisks are allowed.`);
          }
          
          // For FTS5, tags should be used without quotes unless they contain spaces
          // SECURITY: Escape double quotes in tags to prevent FTS5 query injection
          // FTS5 uses double quotes for phrase matching, so we need to escape them
          // Replace " with "" (FTS5 escape sequence) to safely include quotes in tags
          const escapedTag = trimmed.replace(/"/g, '""');
          return escapedTag;
        });
        
        // Combine with OR operator (uppercase as required by FTS5 syntax)
        // FTS5 OR syntax: tag1 OR tag2 (no quotes around individual tags)
        const combinedQuery = sanitizedTags.join(" OR ");
        
        log.debug(`[PlaylistController] Combined FTS5 exclude query: ${combinedQuery}`);
        
        // CRITICAL SECURITY: Use Drizzle sql template with parameterization instead of sql.raw()
        // Drizzle will properly escape the FTS5 query string, preventing SQL injection
        // Even though tags are validated, we use parameterization as defense in depth
        // FTS5 MATCH accepts string literals, and Drizzle handles the escaping correctly
        const excludeCondition = sql`EXISTS (
          SELECT 1 FROM posts_fts 
          WHERE posts_fts.rowid = ${posts.id}
            AND posts_fts MATCH ${combinedQuery}
        )`;
        
        excludeConditions.push(excludeCondition);
      } catch (error) {
        log.error(
          `[PlaylistController] Failed to build exclude tags condition:`,
          error
        );
      }
    }

    return { includeConditions, excludeConditions };
  }

  /**
   * Create a new playlist
   *
   * @param _event - IPC event (unused)
   * @param data - Playlist data (name, isSmart, queryJson, iconName)
   * @returns Created playlist
   */
  private async createPlaylist(
    _event: IpcMainInvokeEvent,
    data: CreatePlaylistRequest
  ): Promise<IpcPlaylist> {
    try {
      const db = this.getDb();

      const result = db
        .insert(playlists)
        .values({
          name: data.name,
          isSmart: data.isSmart ?? true, // Default to Smart Collection
          queryJson: data.queryJson ?? "",
          querySchemaVersion: CURRENT_SMART_QUERY_SCHEMA_VERSION,
          iconName: data.iconName ?? "",
        })
        .returning()
        .get();

      if (!result) {
        throw new Error("Failed to create playlist");
      }

      const playlist = result;
      log.info(
        `[PlaylistController] Created playlist: ${playlist.id} (${playlist.name}, smart: ${playlist.isSmart})`
      );
      
      // Log queryJson for smart playlists to help debug empty collections
      // SECURITY: Never trust JSON.parse without try-catch, even for logging
      // Use Zod schema validation to ensure data integrity
      if (playlist.isSmart && playlist.queryJson) {
        try {
          const parsedQuery = parseSmartQuery(
            playlist.queryJson,
            playlist.querySchemaVersion
          );
          if (parsedQuery) {
            // SECURITY: Wrap JSON.stringify in try-catch to prevent crashes from circular references or invalid data
            try {
              log.info(
                `[PlaylistController] Smart playlist ${playlist.id} query_json:`,
                JSON.stringify(parsedQuery, null, 2)
              );
            } catch (stringifyError) {
              // If JSON.stringify fails (circular reference, etc.), log a safe message
              log.warn(
                `[PlaylistController] Failed to stringify query_json for playlist ${playlist.id}:`,
                stringifyError instanceof Error ? stringifyError.message : String(stringifyError)
              );
              // Log raw queryJson length as fallback
              log.info(
                `[PlaylistController] Smart playlist ${playlist.id} query_json length: ${playlist.queryJson.length} chars`
              );
            }
          } else {
            log.warn(
              `[PlaylistController] Invalid query_json schema for playlist ${playlist.id} (version ${playlist.querySchemaVersion})`
            );
          }
        } catch (parseError) {
          log.warn(
            `[PlaylistController] Failed to parse query_json for newly created playlist ${playlist.id}:`,
            parseError instanceof Error ? parseError.message : String(parseError)
          );
        }
      }

      return toIpcSafe(playlist) as IpcPlaylist;
    } catch (error) {
      log.error("[PlaylistController] Failed to create playlist:", error);
      throw error;
    }
  }

  /**
   * Get all playlists
   *
   * @param _event - IPC event (unused)
   * @returns Array of playlists
   */
  private async getPlaylists(_event: IpcMainInvokeEvent): Promise<IpcPlaylist[]> {
    try {
      const db = this.getDb();

      // Use Drizzle Query API for cleaner code and automatic type inference
      const result = await db.query.playlists.findMany({
        orderBy: (playlists, { desc }) => [desc(playlists.createdAt)],
      });

      log.info(`[PlaylistController] Retrieved ${result.length} playlists`);

      return toIpcSafe(result) as IpcPlaylist[];
    } catch (error) {
      log.error("[PlaylistController] Failed to get playlists:", error);
      throw error;
    }
  }

  /**
   * Get playlist by ID
   *
   * @param _event - IPC event (unused)
   * @param playlistId - Playlist ID
   * @returns Playlist or null if not found
   */
  private async getPlaylist(
    _event: IpcMainInvokeEvent,
    playlistId: number
  ): Promise<IpcPlaylist | null> {
    try {
      const db = this.getDb();

      // Use Drizzle Query API for cleaner code and automatic type inference
      const result = await db.query.playlists.findFirst({
        where: (playlists, { eq }) => eq(playlists.id, playlistId),
      });

      if (!result) {
        return null;
      }

      return toIpcSafe(result) as IpcPlaylist;
    } catch (error) {
      log.error(`[PlaylistController] Failed to get playlist ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Update playlist
   *
   * @param _event - IPC event (unused)
   * @param playlistId - Playlist ID
   * @param data - Update data (name, queryJson, iconName - all optional)
   * @returns Updated playlist
   */
  private async updatePlaylist(
    _event: IpcMainInvokeEvent,
    playlistId: number,
    data: UpdatePlaylistRequest
  ): Promise<IpcPlaylist> {
    try {
      const db = this.getDb();

      const updateData: Partial<typeof playlists.$inferInsert> = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.queryJson !== undefined) {
        updateData.queryJson = data.queryJson;
        updateData.querySchemaVersion = CURRENT_SMART_QUERY_SCHEMA_VERSION;
      }
      if (data.iconName !== undefined) {
        updateData.iconName = data.iconName;
      }

      if (Object.keys(updateData).length === 0) {
        // No changes, return existing playlist
        const existing = await this.getPlaylist(_event, playlistId);
        if (!existing) {
          throw new Error(`Playlist ${playlistId} not found`);
        }
        return existing;
      }

      const result = db
        .update(playlists)
        .set(updateData)
        .where(eq(playlists.id, playlistId))
        .returning()
        .all();

      if (!result || result.length === 0) {
        throw new Error(`Playlist ${playlistId} not found`);
      }

      log.info(`[PlaylistController] Updated playlist: ${playlistId}`);

      return toIpcSafe(result[0]) as IpcPlaylist;
    } catch (error) {
      log.error(`[PlaylistController] Failed to update playlist ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Delete playlist
   *
   * @param _event - IPC event (unused)
   * @param playlistId - Playlist ID
   * @returns true if deleted successfully
   */
  private async deletePlaylist(
    _event: IpcMainInvokeEvent,
    playlistId: number
  ): Promise<boolean> {
    try {
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      // Cascade delete will automatically remove playlist_entries due to foreign key constraint
      db.transaction((tx) => {
        tx.delete(playlists)
          .where(eq(playlists.id, playlistId))
          .run();
      });

      log.info(`[PlaylistController] Deleted playlist: ${playlistId}`);
      return true;
    } catch (error) {
      log.error(`[PlaylistController] Failed to delete playlist ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Add posts to one or more playlists
   *
   * Supports adding a single post to multiple playlists simultaneously.
   * Duplicate entries are automatically prevented by unique constraint.
   *
   * @param _event - IPC event (unused)
   * @param data - Request data (playlistIds array, postIds array)
   * @returns Number of entries created
   */
  private async addPostsToPlaylist(
    _event: IpcMainInvokeEvent,
    data: AddPostsToPlaylistRequest
  ): Promise<number> {
    try {
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      let entriesCreated = 0;

      db.transaction((tx) => {
        // Insert entries for each playlist-post combination
        // Use INSERT OR IGNORE to handle duplicates gracefully (unique constraint)
        for (const playlistId of data.playlistIds) {
          for (const postId of data.postIds) {
            try {
              tx.insert(playlistEntries)
                .values({
                  playlistId,
                  postId,
                })
                .run();
              entriesCreated++;
            } catch (error) {
              // Ignore duplicate entry errors (unique constraint violation)
              // This is expected when adding a post that's already in the playlist
              const errorMessage = error instanceof Error ? error.message : String(error);
              if (!errorMessage.includes("UNIQUE constraint")) {
                // Re-throw if it's not a duplicate entry error
                throw error;
              }
            }
          }
        }
      });

      log.info(
        `[PlaylistController] Added ${entriesCreated} post(s) to ${data.playlistIds.length} playlist(s)`
      );

      return entriesCreated;
    } catch (error) {
      log.error("[PlaylistController] Failed to add posts to playlist:", error);
      throw error;
    }
  }

  /**
   * Remove posts from a playlist
   *
   * @param _event - IPC event (unused)
   * @param data - Request data (playlistId, postIds array)
   * @returns Number of entries removed
   */
  private async removePostsFromPlaylist(
    _event: IpcMainInvokeEvent,
    data: RemovePostsFromPlaylistRequest
  ): Promise<number> {
    try {
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      let entriesRemoved = 0;

      db.transaction((tx) => {
        const result = tx
          .delete(playlistEntries)
          .where(
            and(
              eq(playlistEntries.playlistId, data.playlistId),
              inArray(playlistEntries.postId, data.postIds)
            )
          )
          .run();

        entriesRemoved = result.changes;
      });

      log.info(
        `[PlaylistController] Removed ${entriesRemoved} post(s) from playlist ${data.playlistId}`
      );

      return entriesRemoved;
    } catch (error) {
      log.error("[PlaylistController] Failed to remove posts from playlist:", error);
      throw error;
    }
  }

  /**
   * Get posts in a playlist with filters (rating, media type)
   *
   * Uses JOIN to efficiently retrieve posts with their playlist entries.
   * Supports filtering by rating and media type (same filters as regular post queries).
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters (playlistId, page, filters, limit)
   * @returns Array of posts
   */
  private async getPlaylistPosts(
    _event: IpcMainInvokeEvent,
    params: GetPlaylistPostsRequest
  ): Promise<IpcPost[]> {
    const { playlistId, page, filters, limit, isRandom } = params;
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

      // Build WHERE conditions array
      const conditions = [eq(playlistEntries.playlistId, playlistId)];

      // Add rating filter if provided
      if (filters?.rating) {
        conditions.push(eq(posts.rating, filters.rating));
      }

      // Add media type filter if provided
      if (filters?.mediaType === "videos") {
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

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Use JOIN to efficiently retrieve posts with their playlist entries
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
        })
        .from(playlistEntries)
        .innerJoin(posts, eq(playlistEntries.postId, posts.id))
        .where(whereClause);

      const result = isRandom
        ? queryBuilder.orderBy(sql`RANDOM()`).limit(limit).offset(offset).all()
        : queryBuilder.orderBy(desc(posts.publishedAt)).limit(limit).offset(offset).all();

      log.info(
        `[PlaylistController] Retrieved ${result.length} posts from playlist ${playlistId} (page ${page})`
      );

      return toIpcSafe(result) as IpcPost[];
    } catch (error) {
      log.error(`[PlaylistController] Failed to get playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Get all playlists that contain a specific post
   * 
   * Uses Drizzle Query API for cleaner code and automatic type inference.
   * This eliminates N+1 query problem when checking post membership across multiple playlists.
   * 
   * PERFORMANCE: Uses direct query on playlist_entries with WHERE clause.
   * No JOIN needed - we only need playlistId, which is already in playlist_entries table.
   * This is more efficient than JOIN because we don't need any data from playlists table.
   * 
   * @param _event - IPC event (unused)
   * @param postId - Post ID (database ID)
   * @returns Array of playlist IDs that contain this post
   */
  private async getPlaylistsContainingPost(
    _event: IpcMainInvokeEvent,
    postId: number,
    rule34PostId?: number
  ): Promise<number[]> {
    try {
      const db = this.getDb();

      let result: { playlistId: number }[];
      if (postId <= 0 && rule34PostId != null && rule34PostId > 0) {
        // External post from Browse: look up by posts.postId and artistId=EXTERNAL_ARTIST_ID
        const rows = db
          .select({ playlistId: playlistEntries.playlistId })
          .from(playlistEntries)
          .innerJoin(posts, eq(playlistEntries.postId, posts.id))
          .where(
            and(
              eq(posts.postId, rule34PostId),
              eq(posts.artistId, EXTERNAL_ARTIST_ID)
            )
          )
          .all();
        result = rows;
      } else {
        result = await db.query.playlistEntries.findMany({
          where: (entries, { eq }) => eq(entries.postId, postId),
          columns: { playlistId: true },
        });
      }

      const playlistIds = result.map((r) => r.playlistId);
      
      log.debug(
        `[PlaylistController] Post ${postId} is in ${playlistIds.length} playlist(s)`
      );

      return playlistIds;
    } catch (error) {
      log.error(`[PlaylistController] Failed to get playlists containing post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve posts for a playlist (static or smart)
   *
   * For static playlists: Uses JOIN with playlist_entries.
   * For smart playlists: Parses query_json and builds dynamic Drizzle query with tag filters.
   * Integrates with global filters (rating, mediaType) from GlobalTopBar.
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters (playlistId, page, limit, filters)
   * @returns Array of posts
   */
  private async resolvePlaylistPosts(
    _event: IpcMainInvokeEvent,
    params: ResolvePlaylistPostsRequest
  ): Promise<IpcPost[]> {
    const { playlistId, page, limit, filters, sortOrder = "desc", isRandom } = params;
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

      // Get playlist to check if it's smart
      // Use Drizzle Query API for cleaner code and automatic type inference
      const playlist = await db.query.playlists.findFirst({
        where: (playlists, { eq }) => eq(playlists.id, playlistId),
      });

      if (!playlist) {
        throw new Error(`Playlist ${playlistId} not found`);
      }

      // Build global filter conditions (from GlobalTopBar)
      const globalConditions: SQL[] = [];
      if (filters?.rating) {
        globalConditions.push(eq(posts.rating, filters.rating));
      }
      if (filters?.mediaType === "videos") {
        globalConditions.push(eq(posts.mediaType, "video"));
      } else if (filters?.mediaType === "images") {
        globalConditions.push(
          or(
            eq(posts.mediaType, "image"),
            sql`${posts.mediaType} IS NULL`
          ) as SQL
        );
      }

      // Static playlist: use JOIN with playlist_entries + global filters
      if (!playlist.isSmart) {
        const conditions = [eq(playlistEntries.playlistId, playlistId)];
        if (globalConditions.length > 0) {
          conditions.push(...globalConditions);
        }

        const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

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
          })
          .from(playlistEntries)
          .innerJoin(posts, eq(playlistEntries.postId, posts.id))
          .where(whereClause);

        const result = isRandom
          ? queryBuilder.orderBy(sql`RANDOM()`).limit(limit).offset(offset).all()
          : queryBuilder.orderBy(sortOrder === "asc" ? asc(playlistEntries.addedAt) : desc(playlistEntries.addedAt)).limit(limit).offset(offset).all();

        log.info(
          `[PlaylistController] Resolved ${result.length} posts from static playlist ${playlistId} (page ${page})`
        );

        return toIpcSafe(result) as IpcPost[];
      }

      // Smart playlist: parse query_json and build dynamic query
      if (!playlist.queryJson || playlist.queryJson.trim() === "") {
        log.warn(`[PlaylistController] Smart playlist ${playlistId} has no query_json, returning empty result`);
        return [];
      }

      // Parse and validate queryJson via versioned smart-query resolver
      let query: SmartPlaylistQuery;
      const parsedQuery = parseSmartQuery(
        playlist.queryJson,
        playlist.querySchemaVersion
      );
      if (!parsedQuery) {
        log.error(
          `[PlaylistController] Failed to parse query_json for smart playlist ${playlistId}:`,
          `version=${playlist.querySchemaVersion}`
        );
        throw new Error(
          `Invalid query_json for smart playlist ${playlistId} (version ${playlist.querySchemaVersion})`
        );
      }
      query = parsedQuery;
      log.info(
        `[PlaylistController] Parsed query_json for smart playlist ${playlistId}:`,
        JSON.stringify(query)
      );

      // Smart playlist: Hybrid Search - always query both local DB and remote API concurrently
      // Step 1: Query local DB using FTS5
      // Step 2: Concurrently fetch from remote API
      // Step 3: Merge and deduplicate results (prioritize local entries for isViewed/isFavorited status)
      // 
      // PERFORMANCE NOTE: resolveRemotePlaylistPosts fetches a full page (limit) of posts from API.
      // This is NOT an N+1 query - we fetch all posts for the page in a single API call.
      // The remote posts are then merged with local DB results and deduplicated.
      // If a remote post is not found in local cache, it will be shadow-inserted when opened in viewer,
      // but that's a separate operation and doesn't cause N+1 during playlist resolution.
      
      // Build tag conditions from smart playlist query
      const { includeConditions, excludeConditions } = this.buildSmartPlaylistTagConditions(query);
      
      log.info(
        `[PlaylistController] Built conditions for smart playlist ${playlistId}: ` +
        `${includeConditions.length} include, ${excludeConditions.length} exclude`
      );

      if (includeConditions.length === 0 && excludeConditions.length === 0) {
        log.warn(`[PlaylistController] Smart playlist ${playlistId} has no valid tags, returning empty result`);
        return [];
      }

      // Combine conditions for local DB query
      const allConditions: SQL[] = [];

      if (includeConditions.length > 0) {
        if (includeConditions.length === 1) {
          allConditions.push(includeConditions[0]);
        } else {
          allConditions.push(and(...includeConditions) as SQL);
        }
      }

      if (excludeConditions.length > 0) {
        if (excludeConditions.length === 1) {
          allConditions.push(not(excludeConditions[0]) as SQL);
        } else {
          const orCondition = or(...excludeConditions);
          if (orCondition) {
            allConditions.push(not(orCondition) as SQL);
          }
        }
      }

      // Add global filters
      if (globalConditions.length > 0) {
        allConditions.push(...globalConditions);
      }

      const whereClause = allConditions.length > 1 ? and(...allConditions) : allConditions[0] ?? sql`1 = 1`;

      // Execute local DB query and remote API query concurrently
      const [localPosts, remotePosts] = await Promise.all([
        // Local DB query
        (async () => {
          try {
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
              })
              .from(posts)
              .where(whereClause);

            const result = isRandom
              ? queryBuilder.orderBy(sql`RANDOM()`).limit(limit).offset(offset).all()
              : queryBuilder.orderBy(sortOrder === "asc" ? asc(posts.publishedAt) : desc(posts.publishedAt)).limit(limit).offset(offset).all();
            log.info(
              `[PlaylistController] Local DB query returned ${result.length} posts for smart playlist ${playlistId}`
            );
            return toIpcSafe(result) as IpcPost[];
          } catch (error) {
            log.error(`[PlaylistController] Local DB query failed for smart playlist ${playlistId}:`, error);
            return []; // Return empty array on error, continue with remote results
          }
        })(),
        // Remote API query
        (async () => {
          try {
            return await this.resolveRemotePlaylistPosts(playlistId, query, page, limit, filters, sortOrder, isRandom);
          } catch (error) {
            log.error(`[PlaylistController] Remote API query failed for smart playlist ${playlistId}:`, error);
            return []; // Return empty array on error, continue with local results
          }
        })(),
      ]);

      // Merge and deduplicate results
      // Create a Map keyed by postId to deduplicate
      // Prioritize local entries (they have isViewed/isFavorited status)
      const mergedMap = new Map<number, IpcPost>();
      
      // First, add all local posts (these have priority)
      for (const post of localPosts) {
        mergedMap.set(post.postId, post);
      }
      
      // Then, add remote posts that aren't already in the map
      for (const post of remotePosts) {
        if (!mergedMap.has(post.postId)) {
          mergedMap.set(post.postId, post);
        } else {
          log.debug(
            `[PlaylistController] Deduplicated remote post (postId: ${post.postId}) - local entry exists`
          );
        }
      }

      // Convert map back to array and sort/shuffle
      const mergedPosts = Array.from(mergedMap.values());
      
      if (isRandom) {
        // Shuffle merged results for true randomization
        for (let i = mergedPosts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mergedPosts[i], mergedPosts[j]] = [mergedPosts[j], mergedPosts[i]];
        }
      } else {
        // Sort by publishedAt
        mergedPosts.sort((a, b) => {
          if (sortOrder === "asc") {
            return a.publishedAt - b.publishedAt;
          } else {
            return b.publishedAt - a.publishedAt;
          }
        });
      }

      // Apply pagination (limit and offset)
      const paginatedPosts = mergedPosts.slice(offset, offset + limit);

      log.info(
        `[PlaylistController] Hybrid search resolved ${paginatedPosts.length} posts for smart playlist ${playlistId} ` +
        `(local: ${localPosts.length}, remote: ${remotePosts.length}, merged: ${mergedPosts.length}, page ${page})`
      );

      return paginatedPosts;
    } catch (error) {
      log.error(`[PlaylistController] Failed to resolve playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve smart playlist posts from remote API
   * 
   * Fetches posts from booru API using the tag query string.
   * Applies global filters (rating, media type) after fetching.
   * 
   * @param playlistId - Playlist ID
   * @param query - Smart playlist query
   * @param page - Page number (1-indexed)
   * @param limit - Number of posts per page
   * @param filters - Global filters (rating, media type)
   * @param sortOrder - Sort order (asc/desc)
   * @returns Array of posts from remote API
   */
  private async resolveRemotePlaylistPosts(
    playlistId: number,
    query: SmartPlaylistQuery,
    page: number,
    limit: number,
    filters?: ResolvePlaylistPostsRequest["filters"],
    sortOrder: "asc" | "desc" = "desc",
    isRandom: boolean = false
  ): Promise<IpcPost[]> {
    try {
      // Build booru query string from tags
      const booruQuery = this.buildBooruQueryString(query);
      log.info(`[PlaylistController] Fetching remote posts for playlist ${playlistId} with query: "${booruQuery}"`);

      // Get provider from query (defaults to rule34 if not specified)
      // CRITICAL: Provider must match the actual source of posts to prevent 404 or invalid data
      const providerId = query.provider ?? "rule34";
      const provider = getProvider(providerId);
      const apiSettings = await this.getDecryptedSettings();
      
      if (!apiSettings) {
        log.warn(`[PlaylistController] Cannot fetch remote posts: no API settings available`);
        return [];
      }

      const providerSettings = {
        userId: apiSettings.userId,
        apiKey: apiSettings.apiKey,
      };

      // Fetch posts from remote API (page is 0-indexed in API, but 1-indexed in our system)
      // Pseudo-random fallback: If isRandom is true, use a random page number (1-MAX_RANDOM_PAGES) and shuffle results
      // NOTE: This is a fallback approach. True randomization on large datasets in Booru APIs
      // should be done via API's native sort:random parameter if the provider supports it.
      // If the provider doesn't support native randomization, this pseudo-random approach
      // provides reasonable distribution across pages (1-MAX_RANDOM_PAGES) for better variety.
      const apiPage = isRandom ? Math.floor(Math.random() * MAX_RANDOM_PAGES) + 1 : page - 1;
      const booruPosts = await provider.fetchPosts(booruQuery, apiPage, providerSettings, isRandom);
      
      log.info(`[PlaylistController] Fetched ${booruPosts.length} posts from remote API for playlist ${playlistId}`);

      // Convert BooruPost to IpcPost format and apply filters
      const filteredPosts = booruPosts
        .filter((post) => {
          // Apply rating filter
          if (filters?.rating && post.rating !== filters.rating) {
            return false;
          }
          
          // Apply media type filter
          if (filters?.mediaType) {
            const isVideo = isVideoUrl(post.fileUrl);
            if (filters.mediaType === "videos" && !isVideo) {
              return false;
            }
            if (filters.mediaType === "images" && isVideo) {
              return false;
            }
          }
          
          return true;
        })
        .map((post) => {
          const isVideo = isVideoUrl(post.fileUrl);
          return {
            id: 0, // Remote posts don't have local DB ID
            postId: post.id,
            artistId: EXTERNAL_ARTIST_ID, // Use EXTERNAL_ARTIST_ID instead of null (schema requires notNull)
            fileUrl: post.fileUrl,
            previewUrl: post.previewUrl,
            sampleUrl: post.sampleUrl,
            title: "",
            rating: post.rating,
            tags: post.tags.join(" "),
            mediaType: isVideo ? "video" : "image",
            publishedAt: post.createdAt.getTime(),
            createdAt: post.createdAt.getTime(),
            isViewed: false, // Remote posts are never viewed locally
            isFavorited: false, // Remote posts are never favorited locally
          } as IpcPost;
        });

      // Sort or shuffle posts based on isRandom flag
      if (isRandom) {
        // Shuffle filtered posts for randomization
        for (let i = filteredPosts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filteredPosts[i], filteredPosts[j]] = [filteredPosts[j], filteredPosts[i]];
        }
      } else {
        // Sort posts (remote API usually returns sorted, but we ensure it)
        filteredPosts.sort((a, b) => {
          if (sortOrder === "asc") {
            return a.publishedAt - b.publishedAt;
          } else {
            return b.publishedAt - a.publishedAt;
          }
        });
      }

      // Apply pagination (limit)
      const paginatedPosts = filteredPosts.slice(0, limit);

      log.info(
        `[PlaylistController] Resolved ${paginatedPosts.length} posts from remote API for smart playlist ${playlistId} (page ${page}, filtered from ${booruPosts.length} total)`
      );

      return paginatedPosts;
    } catch (error) {
      log.error(`[PlaylistController] Failed to resolve remote playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }
}
