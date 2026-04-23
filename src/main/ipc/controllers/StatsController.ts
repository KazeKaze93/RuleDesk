import fs from "fs";
import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { getSqliteInstance } from "../../db/client";
import { getDatabasePaths } from "../../db/paths";
import { IPC_CHANNELS } from "../channels";
import type { ExtendedStats } from "../../../shared/schemas/stats";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";

type CountRow = { c: number };
type RatingRow = { rating: string; c: number };
type MediaRow = { mediaType: string | null; c: number };
type ProviderRow = { provider: string; c: number };
type TopArtistRow = { name: string; postCount: number };
type TopTagRow = { tag: string; count: number };
type TimelineRow = { month: string; count: number };

export class StatsController extends BaseController {
  public setup(): void {
    this.handle(IPC_CHANNELS.STATS.GET_EXTENDED, z.tuple([]), this.getExtendedStats.bind(this), {
      isIdempotent: true,
    });
    // Backward compatibility for existing renderer code.
    this.handle(IPC_CHANNELS.DB.GET_STATS, z.tuple([]), this.getExtendedStats.bind(this), {
      isIdempotent: true,
    });

    log.info("[StatsController] All handlers registered");
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

    const topTags = sqlite
      .prepare<[], TopTagRow>(`
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
      `)
      .all();

    const timelineRows = sqlite
      .prepare<[], TimelineRow>(`
        SELECT
          strftime('%Y-%m', datetime(created_at / 1000, 'unixepoch')) as month,
          COUNT(*) as count
        FROM posts
        WHERE created_at >= CAST(strftime('%s', 'now', 'start of month', '-11 months') AS INTEGER) * 1000
        GROUP BY month
        ORDER BY month ASC
      `)
      .all();

    const postsTimeline = this.fillMissingMonths(timelineRows);

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

  private fillMissingMonths(rows: TimelineRow[]): Array<{ month: string; count: number }> {
    const timelineMap = new Map<string, number>();
    rows.forEach((row) => {
      timelineMap.set(row.month, row.count);
    });

    const now = new Date();
    const months: Array<{ month: string; count: number }> = [];
    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${month}`;
      months.push({ month: monthKey, count: timelineMap.get(monthKey) ?? 0 });
    }
    return months;
  }
}
