import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { getService } from "../../core/services";
import { posts } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { InferSelectModel } from "drizzle-orm";
import type { IpcSafe } from "../../../shared/types/ipc";
import { toIpcSafe } from "../../utils/ipc-serialization";
import {
  GetPostsSchema,
  GetPostsCountSchema,
  GetDownloadItemsSchema,
  GetPostsCountWithFiltersParamsSchema,
  MarkViewedIpcSchema,
  ToggleFavoriteIpcSchema,
  ResetPostCacheIpcSchema,
  type PostData,
  type GetPostsRequest,
  type GetPostsCountRequest,
} from "../../../shared/schemas/posts";
import { ShadowInsertRequestSchema } from "../../../shared/schemas/shadow-insert";
import { PostsService } from "../../services/posts-service";
import type { ProviderId } from "../../providers";

type IpcPost = IpcSafe<InferSelectModel<typeof posts>>;

/**
 * IPC adapter for post operations: validate with Zod, delegate to {@link PostsService}, serialize for IPC.
 */
export class PostsController extends BaseController {
  private readonly service: PostsService;

  constructor() {
    super();
    this.service = new PostsService(getService("db"));
  }

  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS,
      z.tuple([GetPostsSchema]),
      this.getPosts.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.GET_DOWNLOAD_ITEMS,
      z.tuple([GetDownloadItemsSchema]),
      this.getDownloadItems.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS_COUNT,
      z.tuple([GetPostsCountSchema]),
      this.getPostsCount.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.GET_POSTS_COUNT_WITH_FILTERS,
      z.tuple([GetPostsCountWithFiltersParamsSchema]),
      this.getPostsCountWithFilters.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>,
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.DB.MARK_VIEWED,
      MarkViewedIpcSchema,
      this.markViewed.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.RESET_POST_CACHE,
      ResetPostCacheIpcSchema,
      this.resetPostCache.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.TOGGLE_FAVORITE,
      ToggleFavoriteIpcSchema,
      this.toggleFavorite.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.DB.SHADOW_INSERT_POST,
      z.tuple([ShadowInsertRequestSchema]),
      this.shadowInsertPost.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    this.service.initializeFtsTableCheck();
    log.info("[PostsController] All handlers registered");
  }

  private async getPosts(
    _event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<IpcPost[]> {
    const [data] = args as [GetPostsRequest];
    const rows = await this.service.getPosts(data);
    return toIpcSafe(rows) as IpcPost[];
  }

  private async getDownloadItems(
    _event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<{ items: Array<{ url: string; filename: string }> }> {
    const [data] = args as [
      GetPostsRequest & { limit?: number },
    ];
    return this.service.getDownloadItems(data);
  }

  private async getPostsCount(
    _event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<number> {
    const [data] = args as [GetPostsCountRequest];
    return this.service.getPostsCount(data);
  }

  private async getPostsCountWithFilters(
    _event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<number> {
    const [data] = args as [Pick<GetPostsRequest, "artistId" | "filters">];
    return this.service.getPostsCountWithFilters(data);
  }

  private async markViewed(
    _event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<boolean> {
    const [postId, postData] = args as [number, PostData?];
    return this.service.markViewed(postId, postData);
  }

  private async resetPostCache(
    _event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<boolean> {
    const [postId] = args as [number];
    return this.service.resetPostCache(postId);
  }

  private async toggleFavorite(
    _event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<boolean> {
    const [postId, postData] = args as [number, PostData?];
    return this.service.toggleFavorite(postId, postData);
  }

  private async shadowInsertPost(
    _event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<IpcPost> {
    const [request] = args as [{ postId: number; provider: ProviderId }];
    const post = await this.service.shadowInsertPost(request);
    return toIpcSafe(post) as IpcPost;
  }
}
