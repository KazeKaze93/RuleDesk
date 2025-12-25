import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, like, or, desc, sql } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container } from "../../core/di/Container";
import { artists, type Artist, type NewArtist, ARTIST_TYPES } from "../../db/schema";
import { PROVIDER_IDS } from "../../providers";
import { getProvider } from "../../providers";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import type { SearchResults } from "../../providers/types";

type AppDatabase = BetterSQLite3Database<typeof schema>;

const AddArtistSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  provider: z.enum(PROVIDER_IDS).default("rule34"),
  type: z.enum(ARTIST_TYPES),
  apiEndpoint: z.string().url().trim().optional(),
});

// Export types for use in bridge.ts
export type AddArtistParams = z.infer<typeof AddArtistSchema>;

const DeleteArtistSchema = z.number().int().positive();


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
    return container.resolve<AppDatabase>("Database");
  }


  /**
   * Setup IPC handlers for artist operations
   */
  public setup(): void {
    this.handle(IPC_CHANNELS.DB.GET_ARTISTS, this.getArtists.bind(this));
    this.handle(IPC_CHANNELS.DB.ADD_ARTIST, this.addArtist.bind(this));
    this.handle(IPC_CHANNELS.DB.DELETE_ARTIST, this.deleteArtist.bind(this));
    this.handle(IPC_CHANNELS.DB.SEARCH_TAGS, this.searchArtists.bind(this));
    this.handle(IPC_CHANNELS.API.SEARCH_REMOTE, this.searchRemoteTags.bind(this));

    log.info("[ArtistsController] All handlers registered");
  }

  /**
   * Get all artists ordered by last checked date (most recent first)
   * Falls back to creation date if lastChecked is null
   *
   * @returns Array of artists
   */
  private async getArtists(_event: IpcMainInvokeEvent): Promise<Artist[]> {
    const db = this.getDb();
    try {
      const result = await db.query.artists.findMany({
        orderBy: [
          desc(sql`COALESCE(${artists.lastChecked}, ${artists.createdAt})`),
        ],
      });
      log.info(`[ArtistsController] Retrieved ${result.length} artists`);
      return result;
    } catch (error) {
      log.error("[ArtistsController] Failed to get artists:", error);
      throw new Error("Failed to fetch artists");
    }
  }

  /**
   * Add a new artist or update existing one (by tag)
   *
   * @param _event - IPC event (unused)
   * @param payload - Artist data to add
   * @returns Created or updated artist
   * @throws {Error} If validation fails or database operation fails
   */
  private async addArtist(
    _event: IpcMainInvokeEvent,
    payload: unknown
  ): Promise<Artist> {
    const validation = AddArtistSchema.safeParse(payload);
    if (!validation.success) {
      log.error(
        "[ArtistsController] Invalid artist data:",
        validation.error.errors
      );
      throw new Error(
        `Validation failed: ${validation.error.errors.map((e) => e.message).join(", ")}`
      );
    }

    const data = validation.data;

    // Get default endpoint from provider if not explicitly provided
    const provider = getProvider(data.provider);
    const finalApiEndpoint = data.apiEndpoint || provider.getDefaultApiEndpoint();

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
      return inserted;
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
   * @param id - Artist ID to delete
   * @returns true if deletion succeeded
   * @throws {Error} If ID is invalid or deletion fails
   */
  private async deleteArtist(
    _event: IpcMainInvokeEvent,
    id: unknown
  ): Promise<boolean> {
    const validation = DeleteArtistSchema.safeParse(id);
    if (!validation.success) {
      log.error("[ArtistsController] Invalid artist ID:", id);
      throw new Error("Invalid artist ID");
    }

    try {
      const db = this.getDb();
      await db.delete(artists).where(eq(artists.id, validation.data));
      log.info(`[ArtistsController] Artist deleted: ID ${validation.data}`);
      return true;
    } catch (error) {
      log.error("[ArtistsController] Failed to delete artist:", error);
      throw new Error("Failed to delete artist");
    }
  }

  /**
   * Search artists by name or tag (LIKE query)
   *
   * @param _event - IPC event (unused)
   * @param query - Search query string (legacy format: direct string, not object)
   * @returns Array of matching artists (limited to 20)
   */
  private async searchArtists(
    _event: IpcMainInvokeEvent,
    query: unknown
  ): Promise<Artist[]> {
    // Legacy format: query is passed directly as string, not as object
    const validation = z.string().trim().min(1).safeParse(query);
    if (!validation.success) {
      log.warn("[ArtistsController] Invalid search query:", query);
      return [];
    }

    try {
      const db = this.getDb();
      const searchPattern = `%${validation.data}%`;
      const result = await db.query.artists.findMany({
        where: or(
          like(artists.tag, searchPattern),
          like(artists.name, searchPattern)
        ),
        limit: 20,
      });
      log.info(
        `[ArtistsController] Search "${validation.data}" returned ${result.length} results`
      );
      return result;
    } catch (error) {
      log.error("[ArtistsController] Search failed:", error);
      return [];
    }
  }

  /**
   * Search remote tags via Rule34 autocomplete API
   *
   * @param _event - IPC event (unused)
   * @param query - Search query string
   * @returns Array of search results
   */
  private async searchRemoteTags(
    _event: IpcMainInvokeEvent,
    query: unknown
  ): Promise<SearchResults[]> {
    // Validate query parameter
    const queryValidation = z.string().trim().min(2).safeParse(query);
    if (!queryValidation.success || !queryValidation.data) {
      return [];
    }

    const searchQuery = queryValidation.data;

    try {
      // Use public Rule34 autocomplete endpoint
      const response = await fetch(
        `https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = (await response.json()) as Array<{
        label: string;
        value: string;
      }>;

      // Map to format expected by AsyncAutocomplete
      return data.map((item) => ({
        id: item.value, // value is the tag itself
        label: item.label, // label is "tag (count)"
        value: item.value,
      }));
    } catch (error) {
      log.error("[ArtistsController] Remote search error:", error);
      return [];
    }
  }
}

