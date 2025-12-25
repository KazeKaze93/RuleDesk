import { ipcMain } from "electron";
import { z } from "zod";
import { eq, like, or, asc } from "drizzle-orm";
import { IPC_CHANNELS } from "../channels";
import { getDb } from "../../db/client";
import { artists, ARTIST_TYPES } from "../../db/schema";
import { logger } from "../../lib/logger";
import { getProvider, PROVIDER_IDS } from "../../providers";

const AddArtistSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  provider: z.enum(PROVIDER_IDS).default("rule34"),
  type: z.enum(ARTIST_TYPES),
  apiEndpoint: z.string().url().trim().optional(),
});

// Validation for search params
const SearchRemoteSchema = z.object({
  query: z.string().trim().min(2).max(200), // Limit query length to prevent DoS
  provider: z.enum(PROVIDER_IDS).default("rule34"),
});

export type AddArtistParams = z.infer<typeof AddArtistSchema>;

// Map для хранения AbortController по webContents.id (для поддержки множественных окон)
const searchAbortControllers = new Map<number, AbortController>();

// Rate limiting для searchRemoteTags (защита от спама)
const searchRateLimits = new Map<number, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX_REQUESTS = 10; // max 10 requests per second per window

// Track which windows already have cleanup listeners to prevent memory leaks
const cleanupListenersRegistered = new Set<number>();

export const registerArtistHandlers = () => {
  ipcMain.handle(IPC_CHANNELS.DB.GET_ARTISTS, async () => {
    try {
      const db = getDb();
      return await db.query.artists.findMany({
        orderBy: [asc(artists.name)],
      });
    } catch (error) {
      logger.error("IPC: [db:get-artists] error:", error);
      throw new Error("Failed to fetch artists.");
    }
  });

  ipcMain.handle(IPC_CHANNELS.DB.ADD_ARTIST, async (_, payload: unknown) => {
    const validation = AddArtistSchema.safeParse(payload);
    if (!validation.success) {
      logger.error("IPC: Invalid artist data", validation.error);
      throw new Error(`Validation failed: ${validation.error.message}`);
    }
    const data = validation.data;
    
    // Get default endpoint from provider if not explicitly provided
    const provider = getProvider(data.provider);
    const finalApiEndpoint = data.apiEndpoint || provider.getDefaultApiEndpoint();

    logger.info(`IPC: [db:add-artist] Adding: ${data.name} [${data.provider}]`);
    
    try {
      const db = getDb();
      // Wrap in transaction for atomicity (future-proof for complex logic)
      const result = await db.transaction(async (tx) => {
        const inserted = await tx.insert(artists).values({
          name: data.name,
          tag: data.tag,
          type: data.type,
          provider: data.provider,
          apiEndpoint: finalApiEndpoint
        }).returning();
        return inserted[0];
      });
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("IPC: [db:add-artist] error:", error);
      throw new Error(`Database error: ${msg}`);
    }
  });

  ipcMain.handle(IPC_CHANNELS.DB.DELETE_ARTIST, async (_, id: unknown) => {
    const validation = z.number().int().positive().safeParse(id);
    if (!validation.success) throw new Error("Invalid ID.");
    try {
      const db = getDb();
      await db.delete(artists).where(eq(artists.id, validation.data));
      return true;
    } catch (error) {
      logger.error(`IPC: [db:delete-artist] error:`, error);
      throw new Error("Failed to delete artist.");
    }
  });

  ipcMain.handle(IPC_CHANNELS.DB.SEARCH_TAGS, async (_, query: unknown) => {
    const validQuery = z.string().trim().safeParse(query);
    if (!validQuery.success) return [];
    try {
      const db = getDb();
      const searchPattern = `%${validQuery.data}%`;
      return await db.query.artists.findMany({
        where: or(
          like(artists.tag, searchPattern),
          like(artists.name, searchPattern)
        ),
        limit: 20,
      });
    } catch {
      return [];
    }
  });

  ipcMain.handle(IPC_CHANNELS.API.SEARCH_REMOTE, async (event, payload: unknown) => {
    const validation = SearchRemoteSchema.safeParse(payload);
    if (!validation.success) {
      logger.warn("IPC: [api:search-remote-tags] Invalid payload", validation.error);
      return [];
    }

    // Use webContents.id as unique identifier for each window
    // webContents.id is stable for the lifetime of the webContents and unique per instance
    const windowId = event.sender.id;

    // Rate limiting check
    const now = Date.now();
    const rateLimit = searchRateLimits.get(windowId);
    
    if (rateLimit) {
      if (now < rateLimit.resetAt) {
        if (rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
          logger.warn(`[IPC] Rate limit exceeded for window ${windowId}`);
          return [];
        }
        rateLimit.count++;
      } else {
        // Reset window
        searchRateLimits.set(windowId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      }
    } else {
      searchRateLimits.set(windowId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }

    // Setup cleanup listener for this webContents if not already registered
    // Use separate Set to track listeners, not Map (Map can be empty after successful request)
    if (!cleanupListenersRegistered.has(windowId)) {
      cleanupListenersRegistered.add(windowId);
      
      event.sender.once("destroyed", () => {
        const controller = searchAbortControllers.get(windowId);
        if (controller) {
          controller.abort();
          searchAbortControllers.delete(windowId);
        }
        // Clean up rate limit data and listener tracking
        searchRateLimits.delete(windowId);
        cleanupListenersRegistered.delete(windowId);
        logger.debug(`[IPC] Cleaned up resources for destroyed window ${windowId}`);
      });
    }

    // Cancel previous search request for this specific window
    // Note: Map stores only ONE controller per windowId, so no memory leak
    // even if modal is opened/closed 1000 times - old controller is replaced
    const existingController = searchAbortControllers.get(windowId);
    if (existingController) {
      existingController.abort();
    }

    const newController = new AbortController();
    searchAbortControllers.set(windowId, newController);

    try {
      const provider = getProvider(validation.data.provider);
      const results = await provider.searchTags(validation.data.query, newController.signal);
      
      // Clean up controller only if it's still the current one (avoid race condition)
      if (searchAbortControllers.get(windowId) === newController) {
        searchAbortControllers.delete(windowId);
      }
      return results;
    } catch (e) {
      // Clean up controller only if it's still the current one
      if (searchAbortControllers.get(windowId) === newController) {
        searchAbortControllers.delete(windowId);
      }
      
      // Ignore abort errors (expected when user types quickly)
      if (e instanceof Error && e.name === "AbortError") {
        return [];
      }
      logger.error(`IPC: Search remote failed for ${validation.data.provider}`, e);
      return [];
    }
  });
};
