import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, or, desc, sql, and, notLike, not } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { artists, posts, ARTIST_TYPES } from "../../db/schema";
import { escapeLikePattern } from "../../db/utils";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  PROVIDER_IDS,
  getProvider,
  type ProviderId,
  type SearchResults,
} from "../../providers";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { toIpcSafe } from "../../utils/ipc-serialization";
import {
  EXTERNAL_ARTIST_ID,
  EXTERNAL_ARTIST_TAG_PREFIX,
} from "../../../shared/constants";

type AppDatabase = BetterSQLite3Database<typeof schema>;
// Use Drizzle's type inference instead of manual imports for type safety
// This ensures types always match the schema, even if schema changes
type Artist = InferSelectModel<typeof artists>;
type NewArtist = InferInsertModel<typeof artists>;

/**
 * IPC-safe Artist type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 *
 * Uses TypeScript utility types to automatically map Date fields to numbers.
 * This ensures type safety and eliminates manual field enumeration.
 * 
 * Includes postsCount from JOIN query to avoid N+1 problem.
 */
type IpcArtist = {
  [K in keyof Artist]: Artist[K] extends Date
    ? number
    : Artist[K] extends Date | null
    ? number | null
    : Artist[K];
} & {
  postsCount?: number; // Added via JOIN in getArtists to fix N+1 problem
};

/**
 * Add Artist Schema
 *
 * Single source of truth for AddArtist validation and typing.
 * Type is exported directly from schema to avoid duplication.
 */
export const AddArtistSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  provider: z.enum(PROVIDER_IDS).default("rule34"),
  type: z.enum(ARTIST_TYPES),
  apiEndpoint: z.string().url().trim().optional(),
});

/**
 * Add Artist Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts) instead of duplicating interface.
 */
export type AddArtistRequest = z.infer<typeof AddArtistSchema>;

// Internal alias for controller methods
type AddArtistParams = AddArtistRequest;

/**
 * Artists Controller
 *
 * Handles IPC operations for artist management:
 * - Get all artists (ordered by last checked date)
 * - Add new artist (with conflict resolution)
 * - Delete artist by ID
 * - Search artists by name/tag
 * - Search remote tags via API (Rule34/Gelbooru)
 */
export class ArtistsController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  /**
   * Setup IPC handlers for artist operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.GET_ARTISTS,
      z.tuple([]),
      this.getArtists.bind(this)
    );
    this.handle(
      IPC_CHANNELS.DB.ADD_ARTIST,
      z.tuple([AddArtistSchema]),
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      // Handler method has specific parameter types, but BaseController accepts generic signature
      this.addArtist.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.DELETE_ARTIST,
      z.tuple([z.number().int().positive()]),
      this.deleteArtist.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.SEARCH_TAGS,
      z.tuple([z.string().trim().min(1)]),
      this.searchArtists.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.API.SEARCH_REMOTE,
      z.tuple([
        z.string().trim().min(2),
        z.enum(["rule34", "gelbooru"]).optional(),
      ]),
      this.searchRemoteTags.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    log.info("[ArtistsController] All handlers registered");
  }

  /**
   * Get all artists ordered by last checked date (most recent first)
   * Falls back to creation date if lastChecked is null
   *
   * @returns Array of artists
   */
  private async getArtists(_event: IpcMainInvokeEvent): Promise<IpcArtist[]> {
    const db = this.getDb();
    try {
      // Use COALESCE with integer columns (both are integer with timestamp mode)
      // This matches the expression index: COALESCE(last_checked, created_at) DESC
      // Filter out placeholder artists created by togglePostFavorite (tag starts with EXTERNAL_ARTIST_TAG_PREFIX)
      // Also exclude artist with id === EXTERNAL_ARTIST_ID if it exists
      // CRITICAL: Use JOIN to get posts count in single query (fixes N+1 problem)
      const result = await db
        .select({
          id: artists.id,
          name: artists.name,
          tag: artists.tag,
          provider: artists.provider,
          type: artists.type,
          apiEndpoint: artists.apiEndpoint,
          lastPostId: artists.lastPostId,
          newPostsCount: artists.newPostsCount,
          lastChecked: artists.lastChecked,
          createdAt: artists.createdAt,
          postsCount: sql<number>`COALESCE(COUNT(${posts.id}), 0)`.as("postsCount"),
        })
        .from(artists)
        .leftJoin(posts, eq(artists.id, posts.artistId))
        .where(
          and(
            notLike(artists.tag, `${EXTERNAL_ARTIST_TAG_PREFIX}%`), // Exclude placeholder artists
            not(eq(artists.id, EXTERNAL_ARTIST_ID)) // Explicitly exclude EXTERNAL_ARTIST_ID
          )
        )
        .groupBy(artists.id)
        .orderBy(desc(sql`COALESCE(${artists.lastChecked}, ${artists.createdAt})`));
      
      log.info(
        `[ArtistsController] Retrieved ${result.length} tracked artists (placeholder artists excluded)`
      );

      // Convert Date objects to numbers for Electron 39+ IPC serialization
      // Uses universal toIpcSafe utility to avoid code duplication
      // Note: postsCount is already a number, so it will pass through toIpcSafe unchanged
      return toIpcSafe(result) as IpcArtist[];
    } catch (error) {
      log.error("[ArtistsController] Failed to get artists:", error);
      throw new Error("Failed to fetch artists");
    }
  }

  /**
   * Add a new artist or update existing one (by tag)
   *
   * @param _event - IPC event (unused)
   * @param data - Artist data to add (validated)
   * @returns Created or updated artist
   * @throws {Error} If database operation fails
   */
  private async addArtist(
    _event: IpcMainInvokeEvent,
    data: AddArtistParams
  ): Promise<IpcArtist> {
    // Get default endpoint from provider if not explicitly provided
    const provider = getProvider(data.provider);
    const finalApiEndpoint =
      data.apiEndpoint || provider.getDefaultApiEndpoint();

    log.info(
      `[ArtistsController] Adding artist: ${data.name} [${data.provider}]`
    );

    try {
      const db = this.getDb();
      const artistData: NewArtist = {
        name: data.name,
        tag: data.tag,
        type: data.type,
        provider: data.provider,
        apiEndpoint: finalApiEndpoint,
      };

      // Use onConflictDoUpdate to handle duplicate tags
      const result = await db
        .insert(artists)
        .values(artistData)
        .onConflictDoUpdate({
          target: artists.tag,
          set: {
            name: data.name,
            type: data.type,
            provider: data.provider,
            apiEndpoint: finalApiEndpoint,
          },
        })
        .returning();

      const inserted = result[0];
      log.info(`[ArtistsController] Artist added/updated: ${inserted.name}`);

      // Convert Date objects to numbers for Electron 39+ IPC serialization
      return toIpcSafe(inserted) as IpcArtist;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log.error("[ArtistsController] Failed to add artist:", error);
      throw new Error(`Database error: ${msg}`);
    }
  }

  /**
   * Delete artist by ID
   *
   * @param _event - IPC event (unused)
   * @param id - Artist ID to delete (validated)
   * @returns true if deletion succeeded
   * @throws {Error} If deletion fails
   */
  private async deleteArtist(
    _event: IpcMainInvokeEvent,
    id: number
  ): Promise<boolean> {
    try {
      // SECURITY: Prevent deletion of EXTERNAL_ARTIST_ID (virtual artist for external posts)
      // This is a sentinel value that should never be deleted
      if (id === EXTERNAL_ARTIST_ID) {
        log.warn(
          `[ArtistsController] Attempted to delete EXTERNAL_ARTIST_ID (${EXTERNAL_ARTIST_ID}). This is not allowed.`
        );
        throw new Error("Cannot delete external artist placeholder");
      }

      const db = this.getDb();
      await db.delete(artists).where(eq(artists.id, id));
      log.info(`[ArtistsController] Artist deleted: ID ${id}`);
      return true;
    } catch (error) {
      log.error("[ArtistsController] Failed to delete artist:", error);
      throw error;
    }
  }


  /**
   * Search artists by name or tag (LIKE query)
   *
   * @param _event - IPC event (unused)
   * @param query - Search query string (validated)
   * @returns Array of matching artists (limited to 20)
   */
  private async searchArtists(
    _event: IpcMainInvokeEvent,
    query: string
  ): Promise<IpcArtist[]> {
    try {
      const db = this.getDb();
      // Escape special LIKE characters before wrapping with %
      const escapedQuery = escapeLikePattern(query);
      const searchPattern = `%${escapedQuery}%`;

      // Use sql template with ESCAPE clause for proper LIKE escaping
      const result = await db.query.artists.findMany({
        where: or(
          sql`${artists.tag} LIKE ${searchPattern} ESCAPE '\\'`,
          sql`${artists.name} LIKE ${searchPattern} ESCAPE '\\'`
        ),
        limit: 20,
      });
      log.info(
        `[ArtistsController] Search "${query}" returned ${result.length} results`
      );

      // Convert Date objects to numbers for Electron 39+ IPC serialization
      return toIpcSafe(result) as IpcArtist[];
    } catch (error) {
      log.error("[ArtistsController] Search failed:", error);
      return [];
    }
  }

  /**
   * Search remote tags via Booru provider autocomplete API
   *
   * @param _event - IPC event (unused)
   * @param query - Search query string (validated)
   * @param providerId - Provider identifier (optional, defaults to "rule34")
   * @returns Array of search results
   */
  private async searchRemoteTags(
    _event: IpcMainInvokeEvent,
    query: string,
    providerId?: ProviderId
  ): Promise<SearchResults[]> {
    try {
      const provider = getProvider(providerId || "rule34");
      return await provider.searchTags(query);
    } catch (error) {
      log.error("[ArtistsController] Remote search error:", error);
      // Re-throw original error instead of swallowing it
      throw error;
    }
  }
}
