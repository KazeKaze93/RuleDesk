import fs from "fs";
import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { getSqliteInstance } from "../../db/client";
import { getDatabasePaths } from "../../db/paths";
import { IPC_CHANNELS } from "../channels";
import type { DatabaseStats } from "../../../shared/schemas/stats";

type CountRow = { c: number };
type RatingRow = { rating: string; c: number };
type TopArtistRow = { name: string; postCount: number; newPostsCount: number };

export class StatsController extends BaseController {
  public setup(): void {
    this.handle(IPC_CHANNELS.DB.GET_STATS, z.tuple([]), this.getStats.bind(this), {
      isIdempotent: true,
    });

    log.info("[StatsController] All handlers registered");
  }

  private getStats(_event: IpcMainInvokeEvent): DatabaseStats {
    const sqlite = getSqliteInstance();

    const totalArtists = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM artists")
      .get()?.c ?? 0;
    const totalPosts = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM posts")
      .get()?.c ?? 0;
    const totalViewed = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM posts WHERE is_viewed = 1")
      .get()?.c ?? 0;
    const totalFavorited = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM posts WHERE is_favorited = 1")
      .get()?.c ?? 0;
    const totalVideos = sqlite
      .prepare<[], CountRow>("SELECT COUNT(*) as c FROM posts WHERE media_type = 'video'")
      .get()?.c ?? 0;
    const totalImages = totalPosts - totalVideos;

    const ratingRows = sqlite
      .prepare<[], RatingRow>("SELECT rating, COUNT(*) as c FROM posts GROUP BY rating")
      .all();

    const postsByRating = {
      safe: ratingRows.find((row) => row.rating === "s")?.c ?? 0,
      questionable: ratingRows.find((row) => row.rating === "q")?.c ?? 0,
      explicit: ratingRows.find((row) => row.rating === "e")?.c ?? 0,
    };

    const topArtistsByPosts = sqlite
      .prepare<[], TopArtistRow>(`
        SELECT a.name, COUNT(p.id) as postCount, a.new_posts_count as newPostsCount
        FROM artists a
        LEFT JOIN posts p ON p.artist_id = a.id
        WHERE a.id != -1
        GROUP BY a.id
        ORDER BY postCount DESC
        LIMIT 10
      `)
      .all();

    const { dbPath } = getDatabasePaths();
    let dbFileSizeBytes = 0;
    try {
      dbFileSizeBytes = fs.statSync(dbPath).size;
    } catch {
      // Keep zero when DB file is not available yet.
    }

    return {
      totalArtists,
      totalPosts,
      totalViewed,
      totalFavorited,
      totalVideos,
      totalImages,
      postsByRating,
      topArtistsByPosts,
      dbFileSizeBytes,
    };
  }
}
