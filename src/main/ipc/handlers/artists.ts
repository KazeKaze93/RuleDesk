import { ipcMain } from "electron";
import { z } from "zod";
import axios from "axios";
import { eq, like, or, asc } from "drizzle-orm";
import { IPC_CHANNELS } from "../channels";
import { getDb } from "../../db/client";
import { artists } from "../../db/schema";
import { logger } from "../../lib/logger";

const AddArtistSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  type: z.enum(["tag", "uploader", "query"]),
  apiEndpoint: z.string().url().trim(),
});

// Export types for use in bridge.ts
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

    const artistData = validation.data;
    logger.info(`IPC: [db:add-artist] Adding: ${artistData.name}`);

    try {
      const db = getDb();
      const result = await db.insert(artists).values(artistData).returning();
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

  ipcMain.handle(IPC_CHANNELS.API.SEARCH_REMOTE, async (_, query: unknown) => {
    const validQuery = z.string().trim().safeParse(query);
    if (!validQuery.success || validQuery.data.length < 2) return [];

    interface Rule34AutocompleteItem {
      label: string;
      value: string;
      type?: string;
    }

    try {
      const { data } = await axios.get<Rule34AutocompleteItem[]>(
        `https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(
          validQuery.data
        )}`
      );
      return Array.isArray(data)
        ? data.map((item) => ({ id: item.value, label: item.label }))
        : [];
    } catch {
      return [];
    }
  });
};
