import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, desc, and, inArray, sql, or, not, type SQL } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { playlists, playlistEntries, posts, type Post } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { toIpcSafe } from "../../utils/ipc-serialization";
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
import { PostFilterSchema } from "../../../shared/schemas/post";
import { isVideoUrl } from "@shared/utils/media";
import { getSqliteInstance } from "../../db/client";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * IPC-safe Playlist type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 */
type IpcPlaylist = {
  [K in keyof typeof playlists.$inferSelect]: typeof playlists.$inferSelect[K] extends Date
    ? number
    : typeof playlists.$inferSelect[K] extends Date | null
    ? number | null
    : typeof playlists.$inferSelect[K];
};

/**
 * IPC-safe Post type with Date fields converted to numbers (timestamps in milliseconds).
 */
type IpcPost = {
  [K in keyof Post]: Post[K] extends Date
    ? number
    : Post[K] extends Date | null
    ? number | null
    : Post[K];
};

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
      this.getPlaylists.bind(this)
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

    log.info("[PlaylistController] All handlers registered");
  }

  /**
   * Check if FTS5 table exists (cached check)
   * @returns true if FTS5 table exists, false otherwise
   */
  private checkFtsTableExists(): boolean {
    try {
      const sqlite = getSqliteInstance();
      const stmt = sqlite.prepare<[], { name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='posts_fts'"
      );
      const result = stmt.get();
      return !!result;
    } catch (error) {
      log.warn("[PlaylistController] Failed to check FTS table existence:", error);
      return false;
    }
  }

  /**
   * Sanitize FTS5 query to prevent SQL injection
   * Reuses logic from PostsController
   */
  private sanitizeFts5Query(query: string): string {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      throw new Error("FTS5 query is empty");
    }

    const strictWhitelistRegex = /^[a-zA-Z0-9_* -]+$/;
    if (!strictWhitelistRegex.test(trimmed)) {
      throw new Error(
        `Invalid FTS5 query: "${query}". Only alphanumeric characters, spaces, hyphens, underscores, and trailing asterisks are allowed.`
      );
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      throw new Error("FTS5 query is empty");
    }

    const sanitizedWords = words.map((word) => {
      const starIndex = word.indexOf("*");
      if (starIndex !== -1 && starIndex !== word.length - 1) {
        throw new Error(
          `Invalid search term: "${word}". Asterisk (*) can only appear at the end of a word.`
        );
      }

      const starCount = (word.match(/\*/g) || []).length;
      if (starCount > 1) {
        throw new Error(
          `Invalid search term: "${word}". Only one asterisk (*) allowed at the end of a word.`
        );
      }

      const hasTrailingStar = word.endsWith("*");
      const baseWord = hasTrailingStar ? word.slice(0, -1) : word;

      if (baseWord.trim().length === 0) {
        throw new Error(`Invalid search term: "${word}". Search term cannot be empty.`);
      }

      return hasTrailingStar ? `${baseWord.trim()}*` : baseWord.trim();
    });

    const sanitized = sanitizedWords.join(" ");
    const escaped = sanitized.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  /**
   * Build SQL conditions from smart playlist query filters
   *
   * @param query - Smart playlist query object
   * @returns Array of SQL conditions
   */
  private buildSmartPlaylistConditions(query: SmartPlaylistQuery): SQL[] {
    const conditions: SQL[] = [];
    const ftsTableExists = this.checkFtsTableExists();

    for (const filter of query.filters) {
      switch (filter.type) {
        case "tags": {
          if (typeof filter.value !== "string") {
            log.warn("[PlaylistController] Invalid tag filter value, skipping");
            continue;
          }

          if (filter.operator === "include" || filter.operator === "exclude") {
            if (!ftsTableExists) {
              log.error(
                "[PlaylistController] FTS5 table does not exist for tag filtering in smart playlist"
              );
              // Return condition that matches nothing
              conditions.push(sql`1 = 0`);
              continue;
            }

            try {
              const sanitized = this.sanitizeFts5Query(filter.value);
              const tagCondition = sql`EXISTS (
                SELECT 1 FROM posts_fts 
                WHERE posts_fts.rowid = ${posts.id} 
                  AND posts_fts MATCH ${sanitized}
              )`;

              if (filter.operator === "exclude") {
                conditions.push(not(tagCondition));
              } else {
                conditions.push(tagCondition);
              }
            } catch (error) {
              log.error(
                `[PlaylistController] Failed to sanitize tag filter "${filter.value}":`,
                error
              );
              // Skip invalid filter
            }
          }
          break;
        }

        case "rating": {
          if (!Array.isArray(filter.value)) {
            log.warn("[PlaylistController] Invalid rating filter value, skipping");
            continue;
          }

          if (filter.operator === "equals") {
            if (filter.value.length === 1) {
              conditions.push(eq(posts.rating, filter.value[0]));
            } else if (filter.value.length > 1) {
              conditions.push(inArray(posts.rating, filter.value));
            }
          } else if (filter.operator === "not_equals") {
            if (filter.value.length === 1) {
              conditions.push(not(eq(posts.rating, filter.value[0])));
            } else {
              // For multiple ratings, use NOT IN
              conditions.push(not(inArray(posts.rating, filter.value)));
            }
          }
          break;
        }

        case "media_type": {
          if (typeof filter.value !== "string") {
            log.warn("[PlaylistController] Invalid media_type filter value, skipping");
            continue;
          }

          if (filter.operator === "equals") {
            conditions.push(eq(posts.mediaType, filter.value));
          } else if (filter.operator === "not_equals") {
            conditions.push(not(eq(posts.mediaType, filter.value)));
          }
          break;
        }

        case "viewed": {
          if (typeof filter.value !== "boolean") {
            log.warn("[PlaylistController] Invalid viewed filter value, skipping");
            continue;
          }

          if (filter.operator === "equals") {
            conditions.push(eq(posts.isViewed, filter.value));
          } else if (filter.operator === "not_equals") {
            conditions.push(not(eq(posts.isViewed, filter.value)));
          }
          break;
        }

        default:
          log.warn(`[PlaylistController] Unknown filter type: ${(filter as { type: string }).type}`);
      }
    }

    return conditions;
  }

  /**
   * Create a new playlist
   *
   * @param _event - IPC event (unused)
   * @param data - Playlist data (name, description, isSmart, queryJson, iconName)
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
          description: data.description ?? "",
          isSmart: data.isSmart ?? false,
          queryJson: data.queryJson ?? "",
          iconName: data.iconName ?? "",
        })
        .returning()
        .all();

      if (!result || result.length === 0) {
        throw new Error("Failed to create playlist");
      }

      const playlist = result[0];
      log.info(
        `[PlaylistController] Created playlist: ${playlist.id} (${playlist.name}, smart: ${playlist.isSmart})`
      );

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

      const result = db
        .select()
        .from(playlists)
        .orderBy(desc(playlists.createdAt))
        .all();

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

      const result = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all();

      if (result.length === 0) {
        return null;
      }

      return toIpcSafe(result[0]) as IpcPlaylist;
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
   * @param data - Update data (name, description - all optional)
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
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.queryJson !== undefined) {
        updateData.queryJson = data.queryJson;
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
    const { playlistId, page, filters, limit } = params;
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
          ) as typeof posts.mediaType
        );
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Use JOIN to efficiently retrieve posts with their playlist entries
      const result = db
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
        .where(whereClause)
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset(offset)
        .all();

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
   * Resolve posts for a playlist (static or smart)
   *
   * For static playlists: Uses JOIN with playlist_entries.
   * For smart playlists: Parses query_json and builds dynamic Drizzle query.
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters (playlistId, page, limit)
   * @returns Array of posts
   */
  private async resolvePlaylistPosts(
    _event: IpcMainInvokeEvent,
    params: ResolvePlaylistPostsRequest
  ): Promise<IpcPost[]> {
    const { playlistId, page, limit } = params;
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

      // Get playlist to check if it's smart
      const playlistResult = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all();

      if (playlistResult.length === 0) {
        throw new Error(`Playlist ${playlistId} not found`);
      }

      const playlist = playlistResult[0];

      // Static playlist: use JOIN with playlist_entries
      if (!playlist.isSmart) {
        const result = db
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
          .where(eq(playlistEntries.playlistId, playlistId))
          .orderBy(desc(playlistEntries.addedAt))
          .limit(limit)
          .offset(offset)
          .all();

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

      let query: SmartPlaylistQuery;
      try {
        query = JSON.parse(playlist.queryJson);
      } catch (error) {
        log.error(
          `[PlaylistController] Failed to parse query_json for smart playlist ${playlistId}:`,
          error
        );
        throw new Error(`Invalid query_json for smart playlist ${playlistId}`);
      }

      // Build conditions from smart playlist query
      const conditions = this.buildSmartPlaylistConditions(query);

      if (conditions.length === 0) {
        log.warn(`[PlaylistController] Smart playlist ${playlistId} has no valid filters, returning empty result`);
        return [];
      }

      // Combine conditions using AND or OR operator
      const whereClause =
        query.operator === "OR" ? or(...conditions) : and(...conditions);

      // Execute query
      const result = db
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
        .where(whereClause)
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset(offset)
        .all();

      log.info(
        `[PlaylistController] Resolved ${result.length} posts from smart playlist ${playlistId} (page ${page})`
      );

      return toIpcSafe(result) as IpcPost[];
    } catch (error) {
      log.error(`[PlaylistController] Failed to resolve playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }
}
