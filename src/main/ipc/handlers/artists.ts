import { ipcMain } from "electron";
import { z } from "zod";
import { eq, like, or, asc } from "drizzle-orm";
import { IPC_CHANNELS } from "../channels";
import { getDb } from "../../db/client";
import { artists } from "../../db/schema";
import { logger } from "../../lib/logger";
import { getProvider } from "../../providers";

const AddArtistSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  provider: z.string().default("rule34"),
  type: z.enum(["tag", "uploader", "query"]),
  apiEndpoint: z.string().url().trim().optional(),
});

// Validation for search params
const SearchRemoteSchema = z.object({
  query: z.string().trim().min(2),
  provider: z.string().default("rule34"),
});

export type AddArtistParams = z.infer<typeof AddArtistSchema>;

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
    const finalApiEndpoint = data.apiEndpoint || "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index";

    logger.info(`IPC: [db:add-artist] Adding: ${data.name} [${data.provider}]`);
    
    try {
      const db = getDb();
      const result = await db.insert(artists).values({
        name: data.name,
        tag: data.tag,
        type: data.type,
        provider: data.provider,
        apiEndpoint: finalApiEndpoint
      }).returning();
      return result[0];
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

  // UPDATED: Handle object payload for search
  ipcMain.handle(IPC_CHANNELS.API.SEARCH_REMOTE, async (_, payload: unknown) => {
    // Support legacy string call or new object call
    let query = "";
    let providerId = "rule34";

    if (typeof payload === "string") {
      query = payload;
    } else if (typeof payload === "object" && payload !== null) {
      const p = payload as { query: string; provider: string };
      query = p.query;
      providerId = p.provider || "rule34";
    }

    const validation = SearchRemoteSchema.safeParse({ query, provider: providerId });
    if (!validation.success) return [];

    try {
      const provider = getProvider(validation.data.provider);
      return await provider.searchTags(validation.data.query);
    } catch (e) {
      logger.error(`IPC: Search remote failed for ${providerId}`, e);
      return [];
    }
  });
};
