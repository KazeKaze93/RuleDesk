import { ipcMain } from "electron";
import log from "electron-log";
import { and, count, eq, gte, not, notLike, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "../../db/client";
import { maintenanceQueue } from "../../db/maintenance-queue";
import { artists, posts } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import { z } from "zod";
import { PostFilterSchema } from "../../../shared/schemas/post";
import { createValidatedHandler } from "./createValidatedHandler";
import {
  EXTERNAL_ARTIST_ID,
  EXTERNAL_ARTIST_TAG_PREFIX,
} from "../../../shared/constants";

const TotalUnreadCountParamsSchema = z
  .object({
    filters: PostFilterSchema.optional(),
  })
  .optional()
  .default({});

const buildUpdatesUnreadConditions = (filters: z.infer<typeof PostFilterSchema> | undefined): SQL[] => {
  const conditions: SQL[] = [eq(posts.isViewed, false)];

  if (filters?.rating !== undefined) {
    conditions.push(eq(posts.rating, filters.rating));
  }

  if (filters?.isFavorited !== undefined) {
    conditions.push(eq(posts.isFavorited, filters.isFavorited));
  }

  if (filters?.mediaType === "videos") {
    conditions.push(eq(posts.mediaType, "video"));
  } else if (filters?.mediaType === "images") {
    conditions.push(or(eq(posts.mediaType, "image"), sql`${posts.mediaType} IS NULL`) as SQL);
  }

  if (filters?.tags && filters.tags.trim().length > 0) {
    const tagTokens = filters.tags
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length > 0);

    for (const token of tagTokens) {
      const escapedToken = token.replace(/[%_]/g, (char) =>
        char === "%" ? "\\%" : "\\_"
      );
      conditions.push(
        sql`LOWER(COALESCE(${posts.tags}, '')) LIKE ${`%${escapedToken}%`} ESCAPE '\\'`
      );
    }
  }

  return conditions;
};

export function registerUpdatesHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.UPDATES.GET_UNREAD_COUNT, () => {
    return maintenanceQueue.execute(() => {
      try {
        const row = getDb()
          .select({ value: count() })
          .from(posts)
          .where(eq(posts.isViewed, false))
          .get();
        return Promise.resolve(row?.value ?? 0);
      } catch (error) {
        log.error("[UpdatesHandlers] Failed to get unread count:", error);
        return Promise.resolve(0);
      }
    });
  });

  ipcMain.handle(IPC_CHANNELS.UPDATES.MARK_ALL_SEEN, () => {
    return maintenanceQueue.execute(() => {
      try {
        getDb().update(posts).set({ isViewed: true }).run();
        return Promise.resolve(true);
      } catch (error) {
        log.error("[UpdatesHandlers] Failed to mark all seen:", error);
        return Promise.resolve(false);
      }
    });
  });

  ipcMain.handle(
    IPC_CHANNELS.UPDATES.GET_TOTAL_UNREAD_COUNT,
    createValidatedHandler(
      IPC_CHANNELS.UPDATES.GET_TOTAL_UNREAD_COUNT,
      TotalUnreadCountParamsSchema,
      (_event, params) => {
        return maintenanceQueue.execute(() => {
          try {
            const filters = params.filters;
            const baseConditions = buildUpdatesUnreadConditions(filters);
            const whereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined;

            if (filters?.sinceTracking === true) {
              const joinConditions = and(
                eq(posts.artistId, artists.id),
                gte(posts.publishedAt, artists.createdAt),
                not(eq(posts.artistId, EXTERNAL_ARTIST_ID)),
                notLike(artists.tag, `${EXTERNAL_ARTIST_TAG_PREFIX}%`)
              );
              const finalWhereClause = whereClause
                ? and(whereClause, not(eq(posts.artistId, EXTERNAL_ARTIST_ID)))
                : not(eq(posts.artistId, EXTERNAL_ARTIST_ID));

              const row = getDb()
                .select({ value: count() })
                .from(posts)
                .innerJoin(artists, joinConditions)
                .where(finalWhereClause)
                .get();

              return Promise.resolve(row?.value ?? 0);
            }

            const row = getDb()
              .select({ value: count() })
              .from(posts)
              .where(whereClause)
              .get();

            return Promise.resolve(row?.value ?? 0);
          } catch (error) {
            log.error("[UpdatesHandlers] Failed to get total unread count:", error);
            return Promise.resolve(0);
          }
        });
      },
      () => Promise.resolve(0)
    )
  );

  log.info("[UpdatesHandlers] All handlers registered");
}
