import { BrowserWindow } from "electron";
import { logger } from "../lib/logger";
import { DbService } from "../db/db-service";
import axios from "axios";
import type { Artist } from "../db/schema";

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
    logger.info("SyncService: Начало полного цикла синхронизации...");

    this.sendEvent("sync:start");

    try {
      const artists = await this.dbService.getTrackedArtists();
      logger.info(
        `SyncService: Найдено авторов для обновления: ${artists.length}`
      );

      for (const artist of artists) {
        this.sendEvent("sync:progress", `Checking ${artist.name}...`);
        await this.syncArtist(artist);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      logger.info("SyncService: Полный цикл синхронизации завершен.");
    } catch (error) {
      logger.error("SyncService: Ошибка глобальной синхронизации", error);
      this.sendEvent(
        "sync:error",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      this.isSyncing = false;
      this.sendEvent("sync:end");
    }
  }

  private async syncArtist(artist: Artist) {
    logger.info(`SyncService: Проверка ${artist.name} [${artist.tag}]...`);

    let page = 0;
    let hasMore = true;
    let newPostsCount = 0;

    const settings = await this.dbService?.getSettings();
    if (!settings || !settings.userId) {
      logger.warn("SyncService: Нет настроек API, пропускаем.");
      return;
    }

    while (hasMore) {
      try {
        const limit = 1000; // Rule34 limit
        const url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&limit=${limit}&pid=${page}&tags=${
          artist.type === "uploader" ? "user:" : ""
        }${artist.tag}&json=1`;

        const authUrl = settings.apiKey
          ? `${url}&user_id=${settings.userId}&api_key=${settings.apiKey}`
          : url;

        const response = await axios.get<R34Post[]>(authUrl);
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
            publishedAt: Math.floor(p.change), // change field is unix timestamp
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
        logger.error(`SyncService: Ошибка при обработке ${artist.name}`, e);
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
