import { dialog, type BrowserWindow, type IpcMainInvokeEvent } from "electron";
import fs from "fs";
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
  ReorderPlaylistEntriesSchema,
  type CreatePlaylistRequest,
  type UpdatePlaylistRequest,
  type AddPostsToPlaylistRequest,
  type RemovePostsFromPlaylistRequest,
  type GetPlaylistPostsRequest,
  type ResolvePlaylistPostsRequest,
  type ReorderPlaylistEntriesRequest,
  type SmartPlaylistQuery,
  type PlaylistExport,
  GetManualPlaylistMembershipForPostsSchema,
  type GetManualPlaylistMembershipForPostsRequest,
  SyncManualPlaylistMembershipSchema,
  type SyncManualPlaylistMembershipRequest,
  ClearManualPlaylistSchema,
  type ClearManualPlaylistRequest,
  MovePostsBetweenManualPlaylistsSchema,
  type MovePostsBetweenManualPlaylistsRequest,
} from "../../../shared/schemas/playlist";
import {
  CURRENT_SMART_QUERY_SCHEMA_VERSION,
  parseSmartQuery,
} from "../../../shared/schemas/smart-playlist-query";
import { isVideoUrl } from "@shared/utils/media";
import { EXTERNAL_ARTIST_ID, MAX_RANDOM_PAGES } from "../../../shared/constants";
import { getSqliteInstance } from "../../db/client";
import { postsFtsTableExists } from "../../db/fts-table-check";
import { areRuntimeDroppableFtsTriggersPresent } from "../../db/fts-triggers";
import { escapeLikePattern } from "../../db/utils";
import { getProvider } from "../../providers";
import { getDecryptedApiSettings } from "../../services/credentials";
import { IdSchema, OptionalIdSchema } from "../../../shared/schemas/ipc";
import { sanitizeProviderTagToken } from "../../../shared/utils/provider-tag-sanitize";
import {
  getManualPlaylistsWithStats,
  getSmartPlaylists,
  getSmartPlaylistPostCount,
} from "../../db/queries/playlists";
import { getAllBlacklistedTags } from "../../db/queries/blacklist";

type AppDatabase = BetterSQLite3Database<typeof schema>;
type UnknownRecord = Record<string, unknown>;
const CreatePlaylistArgsSchema = z.tuple([CreatePlaylistSchema]);
const IdArgsSchema = z.tuple([IdSchema]);
const UpdatePlaylistArgsSchema = z.tuple([IdSchema, UpdatePlaylistSchema]);
const AddPostsToPlaylistArgsSchema = z.tuple([AddPostsToPlaylistSchema]);
const RemovePostsFromPlaylistArgsSchema = z.tuple([RemovePostsFromPlaylistSchema]);
const GetPlaylistPostsArgsSchema = z.tuple([GetPlaylistPostsSchema]);
const ReorderPlaylistEntriesArgsSchema = z.tuple([ReorderPlaylistEntriesSchema]);
const ResolvePlaylistPostsArgsSchema = z.tuple([ResolvePlaylistPostsSchema]);
const GetPlaylistsContainingPostArgsSchema = z.tuple([z.number().int(), OptionalIdSchema]);
const ImportPlaylistArgsSchema = z.tuple([]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isPlaylistExport(value: unknown): value is PlaylistExport {
  if (!isRecord(value) || value.version !== 1 || typeof value.exportedAt !== "string") {
    return false;
  }

  const playlistValue = value.playlist;
  if (!isRecord(playlistValue)) {
    return false;
  }

  if (
    typeof playlistValue.name !== "string" ||
    typeof playlistValue.isSmart !== "boolean" ||
    typeof playlistValue.queryJson !== "string" ||
    typeof playlistValue.iconName !== "string"
  ) {
    return false;
  }

  const entriesValue = value.entries;
  if (!Array.isArray(entriesValue)) {
    return false;
  }

  return entriesValue.every((entry) => {
    if (!isRecord(entry)) {
      return false;
    }
    return typeof entry.postId === "number" && Number.isFinite(entry.postId) && Number.isInteger(entry.postId)
      && typeof entry.addedAt === "number" && Number.isFinite(entry.addedAt);
  });
}

/**
 * IPC-safe Playlist type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 * 
 * Uses shared IpcSafe utility type for automatic Date -> number conversion.
 */
type IpcPlaylist = IpcSafe<InferSelectModel<typeof playlists>>;
type IpcPlaylistWithStats = IpcPlaylist & {
  postCount: number;
};

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
  // Query style: Drizzle Builder API only in this controller.
  private mainWindow: BrowserWindow | null = null;

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  // Cache FTS5 table existence check (schema doesn't change at runtime)
  // Initialized once at setup() to avoid blocking synchronous calls
  private ftsTableExistsCache: boolean = false;

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
      .map((t) => sanitizeProviderTagToken(t.tag).trim().toLowerCase())
      .filter(Boolean);
    
    const excludeTags = query.tags
      .filter((t) => t.type === "exclude")
      .map((t) => `-${sanitizeProviderTagToken(t.tag).trim().toLowerCase()}`)
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
      CreatePlaylistArgsSchema,
      (event, ...args) => {
        const [data] = CreatePlaylistArgsSchema.parse(args);
        return this.createPlaylist(event, data);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLISTS,
      z.tuple([]),
      this.getPlaylists.bind(this),
      { isIdempotent: true } // Mark as idempotent for better rate limiting and request collapsing
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLIST,
      IdArgsSchema,
      (event, ...args) => {
        const [playlistId] = IdArgsSchema.parse(args);
        return this.getPlaylist(event, playlistId);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.UPDATE_PLAYLIST,
      UpdatePlaylistArgsSchema,
      (event, ...args) => {
        const [playlistId, data] = UpdatePlaylistArgsSchema.parse(args);
        return this.updatePlaylist(event, playlistId, data);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.DELETE_PLAYLIST,
      IdArgsSchema,
      (event, ...args) => {
        const [playlistId] = IdArgsSchema.parse(args);
        return this.deletePlaylist(event, playlistId);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.ADD_POSTS_TO_PLAYLIST,
      AddPostsToPlaylistArgsSchema,
      (event, ...args) => {
        const [data] = AddPostsToPlaylistArgsSchema.parse(args);
        return this.addPostsToPlaylist(event, data);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.REMOVE_POSTS_FROM_PLAYLIST,
      RemovePostsFromPlaylistArgsSchema,
      (event, ...args) => {
        const [data] = RemovePostsFromPlaylistArgsSchema.parse(args);
        return this.removePostsFromPlaylist(event, data);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLIST_POSTS,
      GetPlaylistPostsArgsSchema,
      (event, ...args) => {
        const [params] = GetPlaylistPostsArgsSchema.parse(args);
        return this.getPlaylistPosts(event, params);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.REORDER_PLAYLIST_ENTRIES,
      ReorderPlaylistEntriesArgsSchema,
      (event, ...args) => {
        const [params] = ReorderPlaylistEntriesArgsSchema.parse(args);
        return this.reorderPlaylistEntries(event, params);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.RESOLVE_PLAYLIST_POSTS,
      ResolvePlaylistPostsArgsSchema,
      (event, ...args) => {
        const [params] = ResolvePlaylistPostsArgsSchema.parse(args);
        return this.resolvePlaylistPosts(event, params);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLISTS_CONTAINING_POST,
      GetPlaylistsContainingPostArgsSchema,
      (event, ...args) => {
        const [postId, rule34PostId] = GetPlaylistsContainingPostArgsSchema.parse(args);
        return this.getPlaylistsContainingPost(event, postId, rule34PostId);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.GET_MANUAL_PLAYLIST_MEMBERSHIP_FOR_POSTS,
      GetManualPlaylistMembershipForPostsSchema,
      (event, data) =>
        this.getManualPlaylistMembershipForPosts(
          event,
          GetManualPlaylistMembershipForPostsSchema.parse(data)
        )
    );

    this.handle(
      IPC_CHANNELS.DB.SYNC_MANUAL_PLAYLIST_MEMBERSHIP,
      SyncManualPlaylistMembershipSchema,
      (event, data) =>
        this.syncManualPlaylistMembership(
          event,
          SyncManualPlaylistMembershipSchema.parse(data)
        )
    );

    this.handle(
      IPC_CHANNELS.DB.CLEAR_MANUAL_PLAYLIST,
      ClearManualPlaylistSchema,
      (event, data) =>
        this.clearManualPlaylist(event, ClearManualPlaylistSchema.parse(data))
    );

    this.handle(
      IPC_CHANNELS.DB.MOVE_POSTS_BETWEEN_MANUAL_PLAYLISTS,
      MovePostsBetweenManualPlaylistsSchema,
      (event, data) =>
        this.movePostsBetweenManualPlaylists(
          event,
          MovePostsBetweenManualPlaylistsSchema.parse(data)
        )
    );

    this.handle(
      IPC_CHANNELS.DB.EXPORT_PLAYLIST,
      IdArgsSchema,
      (event, ...args) => {
        const [playlistId] = IdArgsSchema.parse(args);
        return this.exportPlaylist(event, playlistId);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.IMPORT_PLAYLIST,
      ImportPlaylistArgsSchema,
      (event, ...args) => {
        ImportPlaylistArgsSchema.parse(args);
        return this.importPlaylist(event);
      }
    );

    log.info("[PlaylistController] All handlers registered");

    // Cache once at setup so runtime MATCH paths stay off the sqlite_master query.
    this.ftsTableExistsCache = postsFtsTableExists(getSqliteInstance());
  }

  /**
   * True when the posts content table has no rows (external-content FTS
   * SELECT without MATCH is a content passthrough).
   * Safe only while insert/update triggers are live — then content emptiness
   * equals index emptiness. Never use this as a bulk-sync-window probe.
   */
  private isFtsIndexEmpty(): boolean {
    const sqlite = getSqliteInstance();
    const row = sqlite.prepare("SELECT 1 FROM posts_fts LIMIT 1").get();
    return row === undefined;
  }

  /**
   * Exact-token or prefix match on posts.tags (content table).
   * Used when FTS MATCH is not trustworthy: bulk-sync window with
   * posts_fts_insert / posts_fts_update dropped.
   *
   * Trailing `*` (allowed by the FTS sanitizer as prefix search) becomes a
   * token-prefix LIKE on space-wrapped tags. Mid-tag `*` is rejected — same
   * rule as the FTS combined-query check. This is not the AI-filter sanitizer.
   */
  private createSmartPlaylistContentTagCondition(sanitizedTag: string): SQL {
    const starIndex = sanitizedTag.indexOf("*");
    if (starIndex !== -1 && starIndex !== sanitizedTag.length - 1) {
      throw new Error(
        `Invalid FTS5 query: wildcard (*) can only appear at the end of tags`
      );
    }

    if (starIndex !== -1) {
      const prefix = sanitizedTag.slice(0, -1);
      if (prefix.length === 0) {
        throw new Error(
          `Invalid tag: "*". Wildcard (*) can only appear at the end of tags, not as a standalone tag.`
        );
      }
      const likePattern = `% ${escapeLikePattern(prefix)}%`;
      return sql`(' ' || lower(${posts.tags}) || ' ') LIKE ${likePattern} ESCAPE '\\'`;
    }

    return sql`instr(' ' || lower(${posts.tags}) || ' ', ' ' || ${sanitizedTag} || ' ') > 0`;
  }

  private combineSmartPlaylistContentConditions(
    tags: string[],
    mode: "and" | "or"
  ): SQL | undefined {
    const parts = tags.map((tag) =>
      this.createSmartPlaylistContentTagCondition(tag)
    );
    if (parts.length === 0) {
      return undefined;
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return mode === "and" ? and(...parts) : or(...parts);
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

    // MATCH only while insert/update triggers exist (index is live).
    // Same sqlite_master probe as PostsController AI filter — not a content SELECT.
    const useFtsMatch = areRuntimeDroppableFtsTriggersPresent(
      getSqliteInstance()
    );

    if (!useFtsMatch) {
      log.debug(
        "[PlaylistController] FTS bulk-insert triggers absent; using posts.tags for smart playlist"
      );
    } else if (this.isFtsIndexEmpty()) {
      // Live triggers ⇒ content emptiness equals index emptiness.
      log.warn(
        "[PlaylistController] FTS5 table exists but is empty. " +
          "Returning empty smart-playlist result until posts_fts has rows."
      );
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

        if (useFtsMatch) {
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
          includeConditions.push(sql`EXISTS (
            SELECT 1 FROM posts_fts
            WHERE posts_fts.rowid = ${posts.id}
              AND posts_fts MATCH ${combinedQuery}
          )`);
        } else {
          const includeCondition = this.combineSmartPlaylistContentConditions(
            sanitizedTags,
            "and"
          );
          if (includeCondition) {
            includeConditions.push(includeCondition);
          }
        }
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

        if (useFtsMatch) {
          // Combine with OR operator (uppercase as required by FTS5 syntax)
          // FTS5 OR syntax: tag1 OR tag2 (no quotes around individual tags)
          const combinedQuery = sanitizedTags.join(" OR ");

          log.debug(`[PlaylistController] Combined FTS5 exclude query: ${combinedQuery}`);

          // CRITICAL SECURITY: Use Drizzle sql template with parameterization instead of sql.raw()
          // Drizzle will properly escape the FTS5 query string, preventing SQL injection
          // Even though tags are validated, we use parameterization as defense in depth
          // FTS5 MATCH accepts string literals, and Drizzle handles the escaping correctly
          excludeConditions.push(sql`EXISTS (
            SELECT 1 FROM posts_fts
            WHERE posts_fts.rowid = ${posts.id}
              AND posts_fts MATCH ${combinedQuery}
          )`);
        } else {
          const excludeCondition = this.combineSmartPlaylistContentConditions(
            sanitizedTags,
            "or"
          );
          if (excludeCondition) {
            excludeConditions.push(excludeCondition);
          }
        }
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
          updatedAt: new Date(),
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

      return toIpcSafe(playlist);
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
  private async getPlaylists(_event: IpcMainInvokeEvent): Promise<IpcPlaylistWithStats[]> {
    try {
      const db = this.getDb();
      const manualPlaylists = getManualPlaylistsWithStats(db);
      const smartPlaylists = getSmartPlaylists(db);

      const smartPlaylistsWithStats = smartPlaylists.map((playlist) => {
        if (!playlist.queryJson || playlist.queryJson.trim() === "") {
          return { ...playlist, postCount: 0 };
        }

        const parsedQuery = parseSmartQuery(
          playlist.queryJson,
          playlist.querySchemaVersion
        );
        if (!parsedQuery) {
          return { ...playlist, postCount: 0 };
        }

        const { includeConditions, excludeConditions } =
          this.buildSmartPlaylistTagConditions(parsedQuery);

        const allConditions: SQL[] = [];

        if (includeConditions.length > 0) {
          if (includeConditions.length === 1) {
            allConditions.push(includeConditions[0]);
          } else {
            const combined = and(...includeConditions);
            if (combined) allConditions.push(combined);
          }
        }

        if (excludeConditions.length > 0) {
          const excludeOr = or(...excludeConditions);
          if (excludeOr) {
            allConditions.push(not(excludeOr));
          }
        }

        const blacklistedTags = getAllBlacklistedTags();
        if (blacklistedTags.length > 0) {
          allConditions.push(
            sql`NOT EXISTS (
              SELECT 1
              FROM tag_blacklist bl
              WHERE instr(' ' || lower(${posts.tags}) || ' ', ' ' || lower(bl.tag) || ' ') > 0
            )`
          );
        }

        const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined;
        const postCount = getSmartPlaylistPostCount(db, whereClause);

        return {
          ...playlist,
          postCount,
        };
      });

      const result = [...manualPlaylists, ...smartPlaylistsWithStats].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      log.info(`[PlaylistController] Retrieved ${result.length} playlists with stats`);

      return toIpcSafe(result);
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

      const result = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all()[0];

      if (!result) {
        return null;
      }

      return toIpcSafe(result);
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
      updateData.updatedAt = new Date();

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

      return toIpcSafe(result[0]);
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

      const entriesToInsert = data.playlistIds.flatMap((playlistId) =>
        data.postIds.map((postId) => ({ playlistId, postId }))
      );
      let entriesCreated = 0;

      db.transaction((tx) => {
        const result = tx
          .insert(playlistEntries)
          .values(entriesToInsert)
          .onConflictDoNothing({
            target: [playlistEntries.playlistId, playlistEntries.postId],
          })
          .run();
        entriesCreated = result.changes;
        tx.update(playlists)
          .set({ updatedAt: new Date() })
          .where(inArray(playlists.id, data.playlistIds))
          .run();
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
        tx.update(playlists)
          .set({ updatedAt: new Date() })
          .where(eq(playlists.id, data.playlistId))
          .run();
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
   * Returns per–manual-playlist counts of how many of the given posts appear in each playlist.
   */
  private async getManualPlaylistMembershipForPosts(
    _event: IpcMainInvokeEvent,
    data: GetManualPlaylistMembershipForPostsRequest
  ): Promise<{ playlistId: number; matchCount: number }[]> {
    try {
      const db = this.getDb();
      const rows = db
        .select({
          playlistId: playlistEntries.playlistId,
          matchCount: sql<number>`count(*)`.mapWith(Number),
        })
        .from(playlistEntries)
        .innerJoin(playlists, eq(playlistEntries.playlistId, playlists.id))
        .where(
          and(eq(playlists.isSmart, false), inArray(playlistEntries.postId, data.postIds))
        )
        .groupBy(playlistEntries.playlistId)
        .all();

      return rows.map((r) => ({
        playlistId: r.playlistId,
        matchCount: r.matchCount,
      }));
    } catch (error) {
      log.error("[PlaylistController] getManualPlaylistMembershipForPosts failed:", error);
      throw error;
    }
  }

  /**
   * Set manual playlist membership for one or more posts: each post appears in exactly the
   * chosen manual playlists and in no other manual playlist.
   */
  private async syncManualPlaylistMembership(
    _event: IpcMainInvokeEvent,
    data: SyncManualPlaylistMembershipRequest
  ): Promise<void> {
    const db = this.getDb();
    const desired = new Set(data.manualPlaylistIds);
    if (desired.size !== data.manualPlaylistIds.length) {
      throw new Error("Duplicate playlist ids in manualPlaylistIds");
    }

    const allManualRows = db
      .select({ id: playlists.id })
      .from(playlists)
      .where(eq(playlists.isSmart, false))
      .all();
    const allManualIds = allManualRows.map((r) => r.id);
    const allManualSet = new Set(allManualIds);

    for (const pid of data.manualPlaylistIds) {
      if (!allManualSet.has(pid)) {
        throw new Error(`Not a manual playlist: ${pid}`);
      }
    }

    const postIdList = [...new Set(data.postIds)];
    if (postIdList.length !== data.postIds.length) {
      throw new Error("Duplicate post ids");
    }

    if (allManualIds.length === 0) {
      return;
    }

    const toAdd: { playlistId: number; postId: number }[] = [];
    const toRemovePlaylistIds: number[] = [];

    for (const playlistId of allManualIds) {
      if (desired.has(playlistId)) {
        for (const postId of postIdList) {
          toAdd.push({ playlistId, postId });
        }
      } else {
        toRemovePlaylistIds.push(playlistId);
      }
    }

    db.transaction((tx) => {
      if (toAdd.length > 0) {
        tx.insert(playlistEntries)
          .values(
            toAdd.map((row) => ({
              playlistId: row.playlistId,
              postId: row.postId,
            }))
          )
          .onConflictDoNothing({
            target: [playlistEntries.playlistId, playlistEntries.postId],
          })
          .run();
      }

      if (toRemovePlaylistIds.length > 0) {
        tx.delete(playlistEntries)
          .where(
            and(
              inArray(playlistEntries.playlistId, toRemovePlaylistIds),
              inArray(playlistEntries.postId, postIdList)
            )
          )
          .run();
      }

      const now = new Date();
      tx.update(playlists)
        .set({ updatedAt: now })
        .where(inArray(playlists.id, allManualIds))
        .run();
    });

    log.info(
      `[PlaylistController] syncManualPlaylistMembership: ${postIdList.length} post(s), ${desired.size} desired playlist(s)`
    );
  }

  /**
   * Remove all post entries from a manual playlist (does not delete the playlist row).
   */
  private async clearManualPlaylist(
    _event: IpcMainInvokeEvent,
    data: ClearManualPlaylistRequest
  ): Promise<void> {
    const db = this.getDb();
    const [row] = db
      .select({ id: playlists.id, isSmart: playlists.isSmart })
      .from(playlists)
      .where(eq(playlists.id, data.playlistId))
      .limit(1)
      .all();

    if (!row) {
      throw new Error("Playlist not found");
    }
    if (row.isSmart) {
      throw new Error("Clear is only supported for manual playlists");
    }

    db.transaction((tx) => {
      tx.delete(playlistEntries)
        .where(eq(playlistEntries.playlistId, data.playlistId))
        .run();
      tx.update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, data.playlistId))
        .run();
    });

    log.info(`[PlaylistController] Cleared all posts from manual playlist ${data.playlistId}`);
  }

  /**
   * Move posts from one manual playlist to another in one transaction.
   */
  private async movePostsBetweenManualPlaylists(
    _event: IpcMainInvokeEvent,
    data: MovePostsBetweenManualPlaylistsRequest
  ): Promise<void> {
    if (data.fromPlaylistId === data.toPlaylistId) {
      throw new Error("Source and target playlist must differ");
    }

    const db = this.getDb();
    const pair = db
      .select({ id: playlists.id, isSmart: playlists.isSmart })
      .from(playlists)
      .where(inArray(playlists.id, [data.fromPlaylistId, data.toPlaylistId]))
      .all();

    if (pair.length !== 2) {
      throw new Error("One or both playlists were not found");
    }
    for (const p of pair) {
      if (p.isSmart) {
        throw new Error("Move is only supported between manual playlists");
      }
    }

    const postIds = [...new Set(data.postIds)];
    if (postIds.length !== data.postIds.length) {
      throw new Error("Duplicate post ids");
    }

    const now = new Date();

    db.transaction((tx) => {
      const rows = postIds.map((postId) => ({
        playlistId: data.toPlaylistId,
        postId,
      }));
      tx.insert(playlistEntries)
        .values(rows)
        .onConflictDoNothing({
          target: [playlistEntries.playlistId, playlistEntries.postId],
        })
        .run();

      tx.delete(playlistEntries)
        .where(
          and(
            eq(playlistEntries.playlistId, data.fromPlaylistId),
            inArray(playlistEntries.postId, postIds)
          )
        )
        .run();

      tx.update(playlists)
        .set({ updatedAt: now })
        .where(inArray(playlists.id, [data.fromPlaylistId, data.toPlaylistId]))
        .run();
    });

    log.info(
      `[PlaylistController] Moved ${postIds.length} post(s) from ${data.fromPlaylistId} to ${data.toPlaylistId}`
    );
  }

  /**
   * Get posts in a playlist with filters (media type)
   *
   * Uses JOIN to efficiently retrieve posts with their playlist entries.
   * Supports playlist-scoped filtering by media type.
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters (playlistId, page, filters, limit)
   * @returns Array of posts
   */
  private async getPlaylistPosts(
    _event: IpcMainInvokeEvent,
    params: GetPlaylistPostsRequest
  ): Promise<IpcPost[]> {
    const { playlistId, page, filters, limit, sortOrder = "desc", isRandom } = params;
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

      // Build WHERE conditions array
      const conditions = [eq(playlistEntries.playlistId, playlistId)];

      // Add media type filter if provided
      if (filters?.mediaType === "videos") {
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
          lastViewedAt: posts.lastViewedAt,
          viewCount: posts.viewCount,
        })
        .from(playlistEntries)
        .innerJoin(posts, eq(playlistEntries.postId, posts.id))
        .where(whereClause);

      const result = isRandom
        ? queryBuilder.orderBy(sql`RANDOM()`).limit(limit).offset(offset).all()
        : queryBuilder
            .orderBy(
              sortOrder === "position"
                ? asc(playlistEntries.position)
                : sortOrder === "asc"
                  ? asc(posts.publishedAt)
                  : desc(posts.publishedAt)
            )
            .limit(limit)
            .offset(offset)
            .all();

      log.info(
        `[PlaylistController] Retrieved ${result.length} posts from playlist ${playlistId} (page ${page})`
      );

      return toIpcSafe(result);
    } catch (error) {
      log.error(`[PlaylistController] Failed to get playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }

  private async reorderPlaylistEntries(
    _event: IpcMainInvokeEvent,
    params: ReorderPlaylistEntriesRequest
  ): Promise<void> {
    const { playlistId, orderedPostIds } = params;
    const db = this.getDb();

    const reorderedEntries = orderedPostIds.map((postId, index) => ({
      playlistId,
      postId,
      position: index,
    }));

    db.transaction((tx) => {
      tx.insert(playlistEntries)
        .values(reorderedEntries)
        .onConflictDoUpdate({
          target: [playlistEntries.playlistId, playlistEntries.postId],
          set: {
            position: sql`excluded.position`,
          },
        })
        .run();
      tx.update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, playlistId))
        .run();
    });
    log.info(
      `[PlaylistController] Reordered ${orderedPostIds.length} entries in playlist ${playlistId}`
    );
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
        result = db
          .select({ playlistId: playlistEntries.playlistId })
          .from(playlistEntries)
          .where(eq(playlistEntries.postId, postId))
          .all();
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

  private async exportPlaylist(
    _event: IpcMainInvokeEvent,
    playlistId: number
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const db = this.getDb();
      const playlist = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all()[0];

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      const entries = db
        .select({
          addedAt: playlistEntries.addedAt,
          postId: posts.postId,
        })
        .from(playlistEntries)
        .innerJoin(posts, eq(posts.id, playlistEntries.postId))
        .where(eq(playlistEntries.playlistId, playlistId))
        .orderBy(asc(playlistEntries.position), asc(playlistEntries.addedAt))
        .all();

      const exportData: PlaylistExport = {
        version: 1,
        exportedAt: new Date().toISOString(),
        playlist: {
          name: playlist.name,
          isSmart: playlist.isSmart,
          queryJson: playlist.queryJson ?? "",
          iconName: playlist.iconName ?? "",
        },
        entries: entries.map((entry) => ({
          postId: entry.postId,
          addedAt: entry.addedAt.getTime(),
        })),
      };

      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        throw new Error("No window reference");
      }

      const defaultFileName = `${playlist.name.replace(/[^a-z0-9]/gi, "_")}.ruledesk-playlist.json`;
      const { canceled, filePath } = await dialog.showSaveDialog(this.mainWindow, {
        title: "Export Playlist",
        defaultPath: defaultFileName,
        filters: [{ name: "RuleDesk Playlist", extensions: ["json"] }],
      });

      if (canceled || !filePath) {
        return { success: false, error: "Cancelled" };
      }

      await fs.promises.writeFile(filePath, JSON.stringify(exportData, null, 2), "utf-8");
      log.info(`[PlaylistController] Exported playlist ${playlistId} to ${filePath}`);
      return { success: true, path: filePath };
    } catch (error) {
      log.error("[PlaylistController] Export failed:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async importPlaylist(
    _event: IpcMainInvokeEvent
  ): Promise<{ success: boolean; playlistId?: number; error?: string }> {
    try {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        throw new Error("No window reference");
      }

      const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
        title: "Import Playlist",
        filters: [{ name: "RuleDesk Playlist", extensions: ["json"] }],
        properties: ["openFile"],
      });

      const selectedFilePath = filePaths[0];
      if (canceled || !selectedFilePath) {
        return { success: false, error: "Cancelled" };
      }

      const raw = await fs.promises.readFile(selectedFilePath, "utf-8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { success: false, error: "Invalid playlist file format" };
      }

      if (!isPlaylistExport(parsed)) {
        return { success: false, error: "Invalid playlist file format" };
      }

      const exportData = parsed;
      const db = this.getDb();
      const newPlaylist = db
        .insert(playlists)
        .values({
          name: exportData.playlist.name,
          isSmart: exportData.playlist.isSmart,
          queryJson: exportData.playlist.queryJson,
          querySchemaVersion: CURRENT_SMART_QUERY_SCHEMA_VERSION,
          iconName: exportData.playlist.iconName,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .get();

      if (!newPlaylist) {
        throw new Error("Failed to create playlist");
      }

      if (!exportData.playlist.isSmart && exportData.entries.length > 0) {
        const importedPostIds = exportData.entries.map((entry) => entry.postId);
        const localPosts = db
          .select({ id: posts.id, postId: posts.postId })
          .from(posts)
          .where(inArray(posts.postId, importedPostIds))
          .all();
        const localPostIdMap = new Map(localPosts.map((p) => [p.postId, p.id]));

        const entriesToInsert = exportData.entries
          .map((entry, index) => {
            const localPostId = localPostIdMap.get(entry.postId);
            if (localPostId === undefined) {
              return null;
            }
            return {
              playlistId: newPlaylist.id,
              postId: localPostId,
              addedAt: new Date(entry.addedAt),
              position: index,
            };
          })
          .filter(
            (
              entry
            ): entry is {
              playlistId: number;
              postId: number;
              addedAt: Date;
              position: number;
            } => entry !== null
          );

        if (entriesToInsert.length > 0) {
          db.insert(playlistEntries)
            .values(entriesToInsert)
            .onConflictDoNothing({
              target: [playlistEntries.playlistId, playlistEntries.postId],
            })
            .run();
        }
      }

      log.info(`[PlaylistController] Imported playlist as id=${newPlaylist.id}`);
      return { success: true, playlistId: newPlaylist.id };
    } catch (error) {
      log.error("[PlaylistController] Import failed:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Resolve posts for a playlist (static or smart)
   *
   * For static playlists: Uses JOIN with playlist_entries.
   * For smart playlists: Parses query_json and builds dynamic Drizzle query with tag filters.
   * Integrates with global filters (mediaType) from GlobalTopBar.
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
      const playlist = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all()[0];

      if (!playlist) {
        throw new Error(`Playlist ${playlistId} not found`);
      }

      // Build global filter conditions (from GlobalTopBar)
      const globalConditions: SQL[] = [];
      if (filters?.mediaType === "videos") {
        globalConditions.push(eq(posts.mediaType, "video"));
      } else if (filters?.mediaType === "images") {
        const imageOrNull = or(eq(posts.mediaType, "image"), sql`${posts.mediaType} IS NULL`);
        if (imageOrNull) globalConditions.push(imageOrNull);
      }

      const blacklistedTags = getAllBlacklistedTags();
      if (blacklistedTags.length > 0) {
        globalConditions.push(
          sql`NOT EXISTS (
            SELECT 1
            FROM tag_blacklist bl
            WHERE instr(' ' || lower(${posts.tags}) || ' ', ' ' || lower(bl.tag) || ' ') > 0
          )`
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
            lastViewedAt: posts.lastViewedAt,
            viewCount: posts.viewCount,
          })
          .from(playlistEntries)
          .innerJoin(posts, eq(playlistEntries.postId, posts.id))
          .where(whereClause);

        const result = isRandom
          ? queryBuilder.orderBy(sql`RANDOM()`).limit(limit).offset(offset).all()
          : queryBuilder
              .orderBy(
                sortOrder === "position"
                  ? asc(playlistEntries.position)
                  : sortOrder === "asc"
                    ? asc(playlistEntries.addedAt)
                    : desc(playlistEntries.addedAt)
              )
              .limit(limit)
              .offset(offset)
              .all();

        log.info(
          `[PlaylistController] Resolved ${result.length} posts from static playlist ${playlistId} (page ${page})`
        );

        return toIpcSafe(result);
      }

      // Smart playlist: parse query_json and build dynamic query
      if (!playlist.queryJson || playlist.queryJson.trim() === "") {
        log.warn(`[PlaylistController] Smart playlist ${playlistId} has no query_json, returning empty result`);
        return [];
      }
      const smartSortOrder = sortOrder === "position" ? "desc" : sortOrder;

      // Parse and validate queryJson via versioned smart-query resolver
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
      const query: SmartPlaylistQuery = parsedQuery;
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
          const combined = and(...includeConditions);
          if (combined) allConditions.push(combined);
        }
      }

      if (excludeConditions.length > 0) {
        if (excludeConditions.length === 1) {
          allConditions.push(not(excludeConditions[0]));
        } else {
          const orCondition = or(...excludeConditions);
          if (orCondition) {
            allConditions.push(not(orCondition));
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
                lastViewedAt: posts.lastViewedAt,
                viewCount: posts.viewCount,
              })
              .from(posts)
              .where(whereClause);

            const result = isRandom
              ? queryBuilder.orderBy(sql`RANDOM()`).limit(limit).offset(offset).all()
              : queryBuilder
                  .orderBy(
                    smartSortOrder === "asc" ? asc(posts.publishedAt) : desc(posts.publishedAt)
                  )
                  .limit(limit)
                  .offset(offset)
                  .all();
            log.info(
              `[PlaylistController] Local DB query returned ${result.length} posts for smart playlist ${playlistId}`
            );
            return toIpcSafe(result);
          } catch (error) {
            log.error(`[PlaylistController] Local DB query failed for smart playlist ${playlistId}:`, error);
            return []; // Return empty array on error, continue with remote results
          }
        })(),
        // Remote API query
        (async () => {
          try {
            return await this.resolveRemotePlaylistPosts(
              playlistId,
              query,
              page,
              limit,
              filters,
              smartSortOrder,
              isRandom
            );
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
          if (smartSortOrder === "asc") {
            return a.publishedAt - b.publishedAt;
          } else {
            return b.publishedAt - a.publishedAt;
          }
        });
      }

      // Local and remote queries are already paginated for the requested page.
      // Applying offset again here drops valid results on page > 1.
      const paginatedPosts = mergedPosts.slice(0, limit);

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
   * Applies global filters (media type) after fetching.
   * 
   * @param playlistId - Playlist ID
   * @param query - Smart playlist query
   * @param page - Page number (1-indexed)
   * @param limit - Number of posts per page
   * @param filters - Global filters (media type)
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
      const apiSettings = await getDecryptedApiSettings(this.getDb());
      
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
      const booruPosts = await provider.fetchPosts(
        booruQuery,
        apiPage,
        providerSettings,
        isRandom,
        limit
      );
      const blacklistedTagSet = new Set(
        getAllBlacklistedTags().map((tag) => tag.trim().toLowerCase()).filter(Boolean)
      );
      
      log.info(`[PlaylistController] Fetched ${booruPosts.length} posts from remote API for playlist ${playlistId}`);

      // Convert BooruPost to IpcPost format and apply filters
      const filteredPosts = booruPosts
        .filter((post) => {
          if (blacklistedTagSet.size > 0) {
            const hasBlacklistedTag = post.tags.some((tag) =>
              blacklistedTagSet.has(tag.trim().toLowerCase())
            );
            if (hasBlacklistedTag) {
              return false;
            }
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
        .map((post): IpcPost => {
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
            lastViewedAt: null,
            viewCount: 0,
          };
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
