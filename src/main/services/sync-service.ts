import { BrowserWindow } from "electron";
import { logger } from "../lib/logger";
import { DbService } from "../db/db-service";
import axios from "axios";
import type { Artist, Settings } from "../db/schema";
import { URLSearchParams } from "url";

interface R34Post {
  id: number;
  file_url: string;
  sample_url: string;
  preview_url: string;
  tags: string;
  rating: string;
  change: number;
}

const isVideo = (url?: string) => !!url && /\.(webm|mp4|mov)(\?|$)/i.test(url);
const pickPreviewUrl = (p: R34Post) => {
  if (p.sample_url && !isVideo(p.sample_url)) return p.sample_url;
  if (p.preview_url && !isVideo(p.preview_url)) return p.preview_url;
  if (p.file_url && !isVideo(p.file_url)) return p.file_url;
  return "";
};

export class SyncService {
  private dbService: DbService | null = null;
  private window: BrowserWindow | null = null;
  private isSyncing = false;

  public setWindow(window: BrowserWindow) {
    this.window = window;
  }
  public setDbService(dbService: DbService) {
    this.dbService = dbService;
  }

  public sendEvent(channel: string, data?: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  public async syncAllArtists() {
    if (this.isSyncing) return;
    if (!this.dbService) return;

    this.isSyncing = true;
    logger.info("SyncService: Start Full Sync");
    this.sendEvent("sync:start");

    try {
      const artists = await this.dbService.getTrackedArtists();
      const settings = await this.dbService.getSettings();
      if (!settings?.userId) throw new Error("No API credentials");

      for (const artist of artists) {
        this.sendEvent("sync:progress", `Checking ${artist.name}...`);
        await this.syncArtist(artist, settings);
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (error) {
      logger.error("Sync error", error);
      this.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Error"
      );
    } finally {
      this.isSyncing = false;
      this.sendEvent("sync:end");
    }
  }

  public async repairArtist(artistId: number) {
    if (this.isSyncing || !this.dbService) return;
    this.isSyncing = true;
    try {
      const artist = await this.dbService.getArtistById(artistId);
      const settings = await this.dbService.getSettings();
      if (artist && settings) {
        this.sendEvent("sync:repair:start", artist.name);
        // Force download by using lastPostId: 0
        await this.syncArtist({ ...artist, lastPostId: 0 }, settings, 3);
      }
    } catch (e) {
      logger.error("Repair error", e);
    } finally {
      this.isSyncing = false;
      this.sendEvent("sync:repair:end");
    }
  }

  private async syncArtist(
    artist: Artist,
    settings: Settings,
    maxPages = Infinity
  ) {
    if (!this.dbService) return;

    let page = 0;
    let hasMore = true;
    let newPostsCount = 0;
    // Track highest ID in this session to prevent ID regression
    let highestPostId = artist.lastPostId;

    while (hasMore && page < maxPages) {
      try {
        const idFilter =
          artist.lastPostId > 0 ? ` id:>${artist.lastPostId}` : "";
        const tagsQuery = `${
          artist.type === "uploader" ? "user:" : ""
        }${encodeURIComponent(artist.tag)}${idFilter}`;

        const params = new URLSearchParams({
          page: "dapi",
          s: "post",
          q: "index",
          limit: "100",
          pid: page.toString(),
          tags: tagsQuery,
          json: "1",
        });
        if (settings.apiKey && settings.userId) {
          params.append("user_id", settings.userId);
          params.append("api_key", settings.apiKey);
        }

        const { data: posts } = await axios.get<R34Post[]>(
          `https://api.rule34.xxx/index.php?${params}`,
          { timeout: 15000 }
        );

        if (!Array.isArray(posts) || posts.length === 0) {
          hasMore = false;
          break;
        }

        // Calculate max ID in this batch
        const batchMaxId = Math.max(...posts.map((p) => Number(p.id)));
        if (batchMaxId > highestPostId) highestPostId = batchMaxId;

        const newPosts = posts.filter((p) => p.id > artist.lastPostId);

        if (newPosts.length === 0 && artist.lastPostId > 0) {
          hasMore = false;
          break;
        }

        const postsToSave = newPosts.map((p) => ({
          artistId: artist.id,
          fileUrl: p.file_url,
          postId: p.id,
          previewUrl: pickPreviewUrl(p),
          sampleUrl: p.sample_url || p.file_url,
          title: "",
          rating: p.rating,
          tags: p.tags,
          // Fix: API returns seconds, JS Date needs milliseconds
          publishedAt: new Date((p.change || 0) * 1000),
          isViewed: false,
        }));

        if (postsToSave.length > 0) {
          await this.dbService.savePostsForArtist(artist.id, postsToSave);
          // 2. Atomic Update of Progress
          await this.dbService.updateArtistProgress(
            artist.id,
            highestPostId,
            postsToSave.length
          );
        }

        newPostsCount += postsToSave.length;
        if (posts.length < 100) hasMore = false;
        else page++;

        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        logger.error(`Sync error for ${artist.name}`, e);
        hasMore = false;
      }
    }

    // Final check to update timestamps even if no new posts
    if (newPostsCount === 0) {
      await this.dbService.updateArtistProgress(artist.id, highestPostId, 0);
    }
    logger.info(`Sync finished for ${artist.name}. Added: ${newPostsCount}`);
  }
}

export const syncService = new SyncService();
