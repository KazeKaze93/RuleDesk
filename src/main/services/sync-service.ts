import { BrowserWindow } from "electron";
import { logger } from "../lib/logger";
import { DbService } from "../db/db-service";
import axios from "axios";
import type { Artist, Settings } from "../db/schema";
import { URLSearchParams } from "url";

interface R34Post {
  id: number;
  file_url: string;
  preview_url: string;
  tags: string;
  rating: string;
  change: number;
}

export class SyncService {
  private dbService: DbService | null = null;
  private window: BrowserWindow | null = null;
  private isSyncing = false;

  constructor() {}

  public setWindow(window: BrowserWindow) {
    this.window = window;
  }

  public setDbService(dbService: DbService) {
    this.dbService = dbService;
  }

  // FIX: Сделано public для отправки ошибок из ipc.ts
  public sendEvent(channel: string, data?: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  public async syncAllArtists() {
    if (this.isSyncing) {
      logger.warn("SyncService: Синхронизация уже идет.");
      return;
    }

    if (!this.dbService) {
      logger.error("SyncService: DB Service не инициализирован");
      return;
    }

    this.isSyncing = true;
    logger.info("SyncService: Начало полного цикла синхронизации Rule34...");
    this.sendEvent("sync:start");

    try {
      const artists = await this.dbService.getTrackedArtists();

      const settings = await this.dbService.getSettings();
      if (!settings || !settings.userId) {
        throw new Error("API credentials not found. Please check settings.");
      }

      logger.info(
        `SyncService: Найдено авторов для обновления: ${artists.length}`
      );

      for (const artist of artists) {
        this.sendEvent("sync:progress", `Checking ${artist.name}...`);

        await this.syncArtist(artist, settings);

        await this.dbService.updateArtistLastChecked(artist.id);

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      logger.info("SyncService: Полный цикл синхронизации завершен.");
    } catch (error) {
      logger.error("SyncService: Ошибка глобальной синхронизации", error);
      this.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Unknown error during sync"
      );
    } finally {
      this.isSyncing = false;
      this.sendEvent("sync:end");
    }
  }

  private async syncArtist(artist: Artist, settings: Settings) {
    logger.info(`SyncService: Проверка ${artist.name} [${artist.tag}]...`);

    let page = 0;
    let hasMore = true;
    let newPostsCount = 0;
    const limit = 100;

    const encodedTag = encodeURIComponent(artist.tag);

    while (hasMore) {
      try {
        const tagsQuery = `${
          artist.type === "uploader" ? "user:" : ""
        }${encodedTag} id:>${artist.lastPostId}`;

        const params: Record<string, string> = {
          page: "dapi",
          s: "post",
          q: "index",
          limit: limit.toString(),
          pid: page.toString(),
          tags: tagsQuery,
          json: "1",
        };

        if (settings.apiKey && settings.userId) {
          params.user_id = settings.userId;
          params.api_key = settings.apiKey;
        }

        const urlParams = new URLSearchParams(params);

        const authUrl = `https://api.rule34.xxx/index.php?${urlParams.toString()}`;
        const response = await axios.get<R34Post[]>(authUrl, {
          timeout: 15000,
          headers: {
            "User-Agent": "NSFW-Booru-Client/1.0.0 (Github: KazeKaze93)",
          },
        });

        const posts = response.data;

        if (!Array.isArray(posts) || posts.length === 0) {
          hasMore = false;
          break;
        }

        const newPosts = posts.filter((p) => p.id > artist.lastPostId);

        if (newPosts.length === 0) {
          hasMore = false;
          break;
        }

        if (this.dbService) {
          const postsToSave = newPosts.map((p) => ({
            id: p.id,
            artistId: artist.id,
            fileUrl: p.file_url,
            previewUrl: p.preview_url,
            title: "",
            rating: p.rating,
            tags: p.tags,
            publishedAt: p.change,
            isViewed: false,
          }));

          await this.dbService.savePostsForArtist(artist.id, postsToSave);
          logger.info(
            `DbService: Сохранено ${postsToSave.length} постов для автора ID ${artist.id}`
          );
        }

        newPostsCount += newPosts.length;

        if (posts.length < limit) {
          hasMore = false;
        } else {
          page++;
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (e) {
        logger.error(
          `SyncService: Ошибка при обработке ${artist.name} (page ${page})`,
          e
        );
        this.sendEvent(
          "sync:error",
          `Sync failed for ${artist.name}: ${
            e instanceof Error ? e.message : "Network error"
          }`
        );
        hasMore = false;
      }
    }

    if (newPostsCount === 0) {
      logger.info(`SyncService: Нет новых постов для ${artist.name}`);
    } else {
      logger.info(
        `SyncService: Всего загружено ${newPostsCount} постов для ${artist.name}`
      );
    }
  }
}

export const syncService = new SyncService();
