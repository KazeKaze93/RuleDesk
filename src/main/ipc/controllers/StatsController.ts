import fs from "fs";
import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { getSqliteInstance } from "../../db/client";
import { getDatabasePaths } from "../../db/paths";
import { buildPostsTimeline } from "../../db/queries/stats";
import { IPC_CHANNELS } from "../channels";
import type { ExtendedStats } from "../../../shared/schemas/stats";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";
import type { SyncService } from "../../services/sync-service";
import type Database from "better-sqlite3";

type CountRow = { c: number };
type RatingRow = { rating: string; c: number };
type MediaRow = { mediaType: string | null; c: number };
type ProviderRow = { provider: string; c: number };
type TopArtistRow = { name: string; postCount: number };
type TopTagRow = { tag: string; count: number };

type TopTagsCacheEntry = {
  tags: TopTagRow[];
  expiresAtMs: number;
};

/** In-memory TTL for the expensive recursive top-tags CTE. */
export const TOP_TAGS_CACHE_TTL_MS = 5 * 60 * 1000;

const TOP_TAGS_SQL = `
        WITH RECURSIVE plain_tags(post_id, tag, rest) AS (
          SELECT id, '', trim(tags) || ' '
          FROM posts
          WHERE tags != '' AND NOT json_valid(tags)
          UNION ALL
          SELECT
            post_id,
            substr(rest, 0, instr(rest, ' ')),
            substr(rest, instr(rest, ' ') + 1)
          FROM plain_tags
          WHERE rest != ''
        ),
        normalized_tags AS (
          SELECT lower(trim(value)) as tag
          FROM posts, json_each(posts.tags)
          WHERE json_valid(posts.tags)
          UNION ALL
          SELECT lower(trim(tag)) as tag
          FROM plain_tags
          WHERE tag != ''
        )
        SELECT tag, COUNT(*) as count
        FROM normalized_tags
        WHERE tag != ''
        GROUP BY tag
        ORDER BY count DESC, tag ASC
        LIMIT 20
      `;

const syncEndCacheInvalidators = new Set<() => void>();
let wrappedSyncService: SyncService | null = null;

function ensureSyncEndSendEventWrap(syncService: SyncService): void {
  if (wrappedSyncService === syncService) {
    return;
  }
  // New SyncService instance (tests / DI re-register): drop stale listeners.
  if (wrappedSyncService !== null) {
    syncEndCacheInvalidators.clear();
  }
  const previousSendEvent = syncService.sendEvent.bind(syncService);
  syncService.sendEvent = (channel: string, data?: unknown) => {
    if (channel === IPC_CHANNELS.SYNC.END) {
      for (const invalidate of syncEndCacheInvalidators) {
        invalidate();
      }
    }
    previousSendEvent(channel, data);
  };
  wrappedSyncService = syncService;
}

// Query style: Drizzle Builder API only in this controller.
export class StatsController extends BaseController {
  private topTagsCache: TopTagsCacheEntry | null = null;
  /** Increments only when the recursive CTE runs (not on TTL hits). */
  private topTagsQueryCount = 0;
  private syncEndInvalidator: (() => void) | null = null;

  public setup(): void {
    this.handle(IPC_CHANNELS.STATS.GET_EXTENDED, z.tuple([]), this.getExtendedStats.bind(this), {
      isIdempotent: true,
    });
    this.handle(IPC_CHANNELS.DB.GET_STATS, z.tuple([]), this.getExtendedStats.bind(this), {
      isIdempotent: true,
    });

    // SyncService is registered after setupIpc(); defer until the same turn finishes.
    void Promise.resolve().then(() => {
      this.ensureSyncEndInvalidationHook();
    });

    log.info("[StatsController] All handlers registered");
  }

  private getSyncService(): SyncService {
    return container.resolve(DI_TOKENS.SYNC_SERVICE);
  }

  /**
   * Clear top-tags cache when SyncService emits sync:end.
   * Main does not receive webContents.send, so controllers resolve SyncService
   * (same DI path as Auth/Maintenance/Artists) and wrap sendEvent once.
   */
  private ensureSyncEndInvalidationHook(): void {
    if (this.syncEndInvalidator !== null) {
      return;
    }
    if (!container.has(DI_TOKENS.SYNC_SERVICE)) {
      return;
    }

    const syncService = this.getSyncService();
    ensureSyncEndSendEventWrap(syncService);

    this.syncEndInvalidator = () => {
      this.invalidateTopTagsCache();
    };
    syncEndCacheInvalidators.add(this.syncEndInvalidator);
  }

  private invalidateTopTagsCache(): void {
    this.topTagsCache = null;
  }

  private queryTopTags(
    sqlite: InstanceType<typeof Database>
  ): TopTagRow[] {
    this.topTagsQueryCount += 1;
    return sqlite.prepare<[], TopTagRow>(TOP_TAGS_SQL).all();
  }

  private getTopTags(
    sqlite: InstanceType<typeof Database>,
    nowMs: number = Date.now()
  ): TopTagRow[] {
    this.ensureSyncEndInvalidationHook();

    const cached = this.topTagsCache;
    if (cached !== null && nowMs < cached.expiresAtMs) {
      return cached.tags;
    }

    const tags = this.queryTopTags(sqlite);
    this.topTagsCache = {
      tags,
      expiresAtMs: nowMs + TOP_TAGS_CACHE_TTL_MS,
    };
    return tags;
  }

  private getExtendedStats(_event: IpcMainInvokeEvent): ExtendedStats {
    const sqlite = getSqliteInstance();

    const totalArtists = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM artists")
      .get()?.c ?? 0;
    const totalPosts = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM posts")
      .get()?.c ?? 0;
    const totalFavorites = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM posts WHERE is_favorited = 1")
      .get()?.c ?? 0;
    const totalUnviewed = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM posts WHERE is_viewed = 0")
      .get()?.c ?? 0;

    const ratingRows = sqlite
      .prepare<[], RatingRow>("SELECT rating, COUNT(*) as c FROM posts GROUP BY rating")
      .all();
    const mediaRows = sqlite
      .prepare<[], MediaRow>("SELECT media_type as mediaType, COUNT(*) as c FROM posts GROUP BY media_type")
      .all();
    const providerRows = sqlite
      .prepare<[], ProviderRow>("SELECT provider, COUNT(*) as c FROM artists GROUP BY provider")
      .all();

    const ratingCounts = {
      safe: ratingRows.find((row) => row.rating === "s")?.c ?? 0,
      questionable: ratingRows.find((row) => row.rating === "q")?.c ?? 0,
      explicit: ratingRows.find((row) => row.rating === "e")?.c ?? 0,
    };

    const mediaCounts = {
      images: mediaRows
        .filter((row) => row.mediaType !== "video")
        .reduce((accumulator, row) => accumulator + row.c, 0),
      videos: mediaRows.find((row) => row.mediaType === "video")?.c ?? 0,
    };

    const providerCounts = {
      rule34: providerRows.find((row) => row.provider === "rule34")?.c ?? 0,
      gelbooru: providerRows.find((row) => row.provider === "gelbooru")?.c ?? 0,
    };

    const topArtists = sqlite
      .prepare<[], TopArtistRow>(`
        SELECT a.name, COUNT(p.id) as postCount
        FROM artists a
        LEFT JOIN posts p ON p.artist_id = a.id
        WHERE a.id != ${EXTERNAL_ARTIST_ID}
        GROUP BY a.id
        ORDER BY postCount DESC
        LIMIT 10
      `)
      .all();

    const topTags = this.getTopTags(sqlite);

    const postsTimeline = buildPostsTimeline(sqlite);

    const { dbPath } = getDatabasePaths();
    let dbSizeBytes = 0;
    try {
      dbSizeBytes = fs.statSync(dbPath).size;
    } catch (error) {
      log.error("[StatsController] Failed to get DB file size", error);
    }

    return {
      totalArtists,
      totalPosts,
      totalFavorites,
      totalUnviewed,
      ratingCounts,
      mediaCounts,
      providerCounts,
      topArtists,
      topTags,
      postsTimeline,
      dbSizeBytes,
    };
  }
}
