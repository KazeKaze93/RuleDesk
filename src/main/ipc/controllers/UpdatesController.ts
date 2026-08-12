import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { and, count, eq, gte, not, notLike, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { getDb } from "../../db/client";
import { maintenanceQueue } from "../../db/maintenance-queue";
import { artists, posts } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import { PostFilterSchema } from "../../../shared/schemas/post";
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

type TotalUnreadCountParams = z.infer<typeof TotalUnreadCountParamsSchema>;

const buildUpdatesUnreadConditions = (
  filters: z.infer<typeof PostFilterSchema> | undefined
): SQL[] => {
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
    const imageOrNull = or(
      eq(posts.mediaType, "image"),
      sql`${posts.mediaType} IS NULL`
    );
    if (imageOrNull) conditions.push(imageOrNull);
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

/**
 * Updates Controller
 *
 * Unread badge counts and mark-all-seen for the Updates feed.
 */
export class UpdatesController extends BaseController {
  public setup(): void {
    this.handle(
      IPC_CHANNELS.UPDATES.GET_UNREAD_COUNT,
      z.tuple([]),
      this.getUnreadCount.bind(this),
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.UPDATES.MARK_ALL_SEEN,
      z.tuple([]),
      this.markAllSeen.bind(this)
    );
    this.handle(
      IPC_CHANNELS.UPDATES.GET_TOTAL_UNREAD_COUNT,
      TotalUnreadCountParamsSchema,
      (event, params) => {
        // BaseController already validated against TotalUnreadCountParamsSchema;
        // handler args are typed unknown[], so re-parse is TS narrowing only (idempotent).
        return this.getTotalUnreadCount(
          event,
          TotalUnreadCountParamsSchema.parse(params)
        );
      },
      { isIdempotent: true }
    );

    log.info("[UpdatesController] All handlers registered");
  }

  private async getUnreadCount(_event: IpcMainInvokeEvent): Promise<number> {
    return maintenanceQueue.execute(async () => {
      try {
        const row = getDb()
          .select({ value: count() })
          .from(posts)
          .where(eq(posts.isViewed, false))
          .get();
        return row?.value ?? 0;
      } catch (error) {
        log.error("[UpdatesController] Failed to get unread count:", error);
        throw error;
      }
    });
  }

  private async markAllSeen(_event: IpcMainInvokeEvent): Promise<boolean> {
    return maintenanceQueue.execute(async () => {
      try {
        getDb().update(posts).set({ isViewed: true }).run();
        return true;
      } catch (error) {
        log.error("[UpdatesController] Failed to mark all seen:", error);
        throw error;
      }
    });
  }

  private async getTotalUnreadCount(
    _event: IpcMainInvokeEvent,
    params: TotalUnreadCountParams
  ): Promise<number> {
    return maintenanceQueue.execute(async () => {
      try {
        const filters = params.filters;
        const baseConditions = buildUpdatesUnreadConditions(filters);
        const whereClause =
          baseConditions.length > 0 ? and(...baseConditions) : undefined;

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

          return row?.value ?? 0;
        }

        const row = getDb()
          .select({ value: count() })
          .from(posts)
          .where(whereClause)
          .get();

        return row?.value ?? 0;
      } catch (error) {
        log.error(
          "[UpdatesController] Failed to get total unread count:",
          error
        );
        throw error;
      }
    });
  }
}
