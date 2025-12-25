import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { eq, like, or, desc, sql } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { artists, ARTIST_TYPES } from "../../db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { PROVIDER_IDS, getProvider, type ProviderId, type SearchResults } from "../../providers";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;
// Use Drizzle's type inference instead of manual imports for type safety
// This ensures types always match the schema, even if schema changes
type Artist = InferSelectModel<typeof artists>;
type NewArtist = InferInsertModel<typeof artists>;

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
      // In DEBUG mode, log EXPLAIN QUERY PLAN to verify index usage
      // Critical: Ensure the COALESCE expression matches the index exactly
      // SQLite requires exact type and expression match for expression indexes
      if (process.env.DEBUG === "true" || process.env.DEBUG_SQLITE === "true") {
        const { getSqliteInstance } = await import("../../db/client");
        const sqlite = getSqliteInstance();
        
        // Use the exact same expression as in the query (COALESCE with integer columns)
        // Both lastChecked and createdAt are integer columns with timestamp mode
        const explainQuery = sqlite.prepare(`
          EXPLAIN QUERY PLAN
          SELECT * FROM artists
          ORDER BY COALESCE(last_checked, created_at) DESC
        `);
        const plan = explainQuery.all() as Array<{ detail?: string; [key: string]: unknown }>;
        log.debug("[ArtistsController] EXPLAIN QUERY PLAN:", JSON.stringify(plan, null, 2));
        
        // Verify that artists_sort_idx is being used
        // Check both 'detail' field and full plan for index usage
        const usesIndex = plan.some(
          (row) => {
            const detail = String(row.detail || "");
            const info = String(row.info || "");
            return detail.includes("artists_sort_idx") || info.includes("artists_sort_idx");
          }
        );
        if (!usesIndex) {
          log.warn("[ArtistsController] ⚠️ Index artists_sort_idx not detected in query plan! Performance may be degraded.");
          log.warn("[ArtistsController] Query plan:", plan);
        } else {
          log.debug("[ArtistsController] ✓ Index artists_sort_idx is being used");
        }
      }

      // Use COALESCE with integer columns (both are integer with timestamp mode)
      // This matches the expression index: COALESCE(last_checked, created_at) DESC
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

