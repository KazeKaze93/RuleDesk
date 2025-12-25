import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, like, or, desc, sql } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_KEYS } from "../../core/di/Container";
import { artists, type Artist, type NewArtist, ARTIST_TYPES } from "../../db/schema";
import { PROVIDER_IDS } from "../../providers";
import { getProvider } from "../../providers";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import type { TagResult } from "../../services/providers/IBooruProvider";
import { ProviderFactory } from "../../services/providers/ProviderFactory";
import type { ProviderId } from "../../providers";

type AppDatabase = BetterSQLite3Database<typeof schema>;

const AddArtistSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  provider: z.enum(PROVIDER_IDS).default("rule34"),
  type: z.enum(ARTIST_TYPES),
  apiEndpoint: z.string().url().trim().optional(),
});

// Internal type (not exported - use types from src/main/types/ipc.ts instead)
type AddArtistParams = z.infer<typeof AddArtistSchema>;


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
    return container.resolve<AppDatabase>(DI_KEYS.DB);
  }

  private getProviderFactory(): ProviderFactory {
    return container.resolve<ProviderFactory>(DI_KEYS.PROVIDER_FACTORY);
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
      this.addArtist.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.DELETE_ARTIST,
      z.tuple([z.number().int().positive()]),
      this.deleteArtist.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.SEARCH_TAGS,
      z.tuple([z.string().trim().min(1)]),
      this.searchArtists.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.API.SEARCH_REMOTE,
      z.tuple([z.string().trim().min(2), z.enum(["rule34", "gelbooru"]).optional()]),
      this.searchRemoteTags.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );

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
   * @param data - Artist data to add (validated)
   * @returns Created or updated artist
   * @throws {Error} If database operation fails
   */
  private async addArtist(
    _event: IpcMainInvokeEvent,
    data: AddArtistParams
  ): Promise<Artist> {

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
   * @param id - Artist ID to delete (validated)
   * @returns true if deletion succeeded
   * @throws {Error} If deletion fails
   */
  private async deleteArtist(
    _event: IpcMainInvokeEvent,
    id: number
  ): Promise<boolean> {
    try {
      const db = this.getDb();
      await db.delete(artists).where(eq(artists.id, id));
      log.info(`[ArtistsController] Artist deleted: ID ${id}`);
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
   * @param query - Search query string (validated)
   * @returns Array of matching artists (limited to 20)
   */
  private async searchArtists(
    _event: IpcMainInvokeEvent,
    query: string
  ): Promise<Artist[]> {
    try {
      const db = this.getDb();
      const searchPattern = `%${query}%`;
      const result = await db.query.artists.findMany({
        where: or(
          like(artists.tag, searchPattern),
          like(artists.name, searchPattern)
        ),
        limit: 20,
      });
      log.info(
        `[ArtistsController] Search "${query}" returned ${result.length} results`
      );
      return result;
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
  ): Promise<TagResult[]> {
    try {
      const factory = this.getProviderFactory();
      const provider = providerId
        ? factory.getProvider(providerId)
        : factory.getDefaultProvider();
      
      return await provider.searchTags(query);
    } catch (error) {
      log.error("[ArtistsController] Remote search error:", error);
      // Re-throw original error instead of swallowing it
      throw error;
    }
  }
}

