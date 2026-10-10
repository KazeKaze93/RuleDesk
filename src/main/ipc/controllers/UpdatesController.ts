import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { getDb } from "../../db/client";
import { maintenanceQueue } from "../../db/maintenance-queue";
import {
  countUpdatesFeedPosts,
  getLastTrackedArtistSyncAtMs,
  markPostsViewedByIds,
  markUpdatesFeedPostsViewed,
} from "../../db/queries/updates-feed";
import { IPC_CHANNELS } from "../channels";
import { PostFilterSchema } from "../../../shared/schemas/post";
import { IdSchema } from "../../../shared/schemas/ipc";
import { UPDATES_MARK_SEEN_BY_IDS_MAX } from "../../../shared/constants";

const TotalUnreadCountParamsSchema = z
  .object({
    filters: PostFilterSchema.optional(),
  })
  .optional()
  .default({});

type TotalUnreadCountParams = z.infer<typeof TotalUnreadCountParamsSchema>;

const MarkAllSeenParamsSchema = z
  .object({
    filters: PostFilterSchema.optional(),
  })
  .optional()
  .default({});

type MarkAllSeenParams = z.infer<typeof MarkAllSeenParamsSchema>;

const MarkSeenByIdsArgsSchema = z.tuple([
  z.array(IdSchema).max(UPDATES_MARK_SEEN_BY_IDS_MAX),
]);

/**
 * Updates Controller
 *
 * Unread badge/header counts, scoped mark-all-read, and mark-seen-by-ids for the Updates feed.
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
      MarkAllSeenParamsSchema,
      (event, params) => {
        return this.markAllSeen(event, MarkAllSeenParamsSchema.parse(params));
      }
    );
    this.handle(
      IPC_CHANNELS.UPDATES.MARK_SEEN_BY_IDS,
      MarkSeenByIdsArgsSchema,
      (event, ...args) => {
        const [ids] = MarkSeenByIdsArgsSchema.parse(args);
        return this.markSeenByIds(event, ids);
      }
    );
    this.handle(
      IPC_CHANNELS.UPDATES.GET_TOTAL_UNREAD_COUNT,
      TotalUnreadCountParamsSchema,
      (event, params) => {
        return this.getTotalUnreadCount(
          event,
          TotalUnreadCountParamsSchema.parse(params)
        );
      },
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.UPDATES.GET_LAST_SYNC_AT,
      z.tuple([]),
      this.getLastSyncAt.bind(this),
      { isIdempotent: true }
    );

    log.info("[UpdatesController] All handlers registered");
  }

  /** Sidebar badge: feed unread without tag filters. */
  private async getUnreadCount(_event: IpcMainInvokeEvent): Promise<number> {
    return maintenanceQueue.execute(async () => {
      try {
        return countUpdatesFeedPosts(getDb(), { unreadOnly: true });
      } catch (error) {
        log.error("[UpdatesController] Failed to get unread count:", error);
        throw error;
      }
    });
  }

  /** Mark all read: feed scope + optional filters (tags). */
  private async markAllSeen(
    _event: IpcMainInvokeEvent,
    params: MarkAllSeenParams
  ): Promise<{ updatedCount: number }> {
    return maintenanceQueue.execute(async () => {
      try {
        const updatedCount = markUpdatesFeedPostsViewed(
          getDb(),
          params.filters
        );
        return { updatedCount };
      } catch (error) {
        log.error("[UpdatesController] Failed to mark all seen:", error);
        throw error;
      }
    });
  }

  private async markSeenByIds(
    _event: IpcMainInvokeEvent,
    ids: number[]
  ): Promise<{ updatedCount: number }> {
    return maintenanceQueue.execute(async () => {
      try {
        const updatedCount = markPostsViewedByIds(getDb(), ids);
        return { updatedCount };
      } catch (error) {
        log.error("[UpdatesController] Failed to mark seen by ids:", error);
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
        return countUpdatesFeedPosts(getDb(), {
          filters: params.filters,
          unreadOnly: true,
        });
      } catch (error) {
        log.error(
          "[UpdatesController] Failed to get total unread count:",
          error
        );
        throw error;
      }
    });
  }

  /** MAX(artists.last_checked) for tracked artists, Unix ms; null if never. */
  private async getLastSyncAt(
    _event: IpcMainInvokeEvent
  ): Promise<number | null> {
    return maintenanceQueue.execute(async () => {
      try {
        return getLastTrackedArtistSyncAtMs(getDb());
      } catch (error) {
        log.error("[UpdatesController] Failed to get last sync at:", error);
        throw error;
      }
    });
  }
}
