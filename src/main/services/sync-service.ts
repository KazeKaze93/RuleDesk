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

// 1. ЧИСТЫЙ КОСТЫЛЬ: Гарантируем, что превью — это не видео
const isVideo = (url?: string) => !!url && /\.(webm|mp4|mov)(\?|$)/i.test(url);

const pickPreviewUrl = (p: R34Post) => {
  // 1. sample_url (среднее качество)
  if (p.sample_url && !isVideo(p.sample_url)) return p.sample_url;
  // 2. preview_url (мыльное, но точно превью-картинка)
  if (p.preview_url && !isVideo(p.preview_url)) return p.preview_url;
  // 3. file_url (оригинал), только если не видео (крайний случай)
  if (p.file_url && !isVideo(p.file_url)) return p.file_url;

  return "";
};

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

        // Вызываем syncArtist без maxPages, чтобы синхронизировать новые
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

  // 2. НОВЫЙ МЕТОД: Ремонтная синхронизация (публичный API)
  public async repairArtist(artistId: number) {
    if (this.isSyncing) {
      logger.warn("SyncService: Синхронизация уже идет.");
      return;
    }
    if (!this.dbService) {
      logger.error("SyncService: DB Service не инициализирован");
      return;
    }

    this.isSyncing = true;

    try {
      const artist = await this.dbService.getArtistById(artistId);
      if (!artist) {
        throw new Error(`Artist ID ${artistId} not found.`);
      }

      const repairArtist = { ...artist, lastPostId: 0 };

      logger.info(
        `SyncService: Начало ремонтной синхронизации для ${artist.name}...`
      );
      this.sendEvent("sync:repair:start", artist.name);

      const settings = await this.dbService.getSettings();
      if (!settings || !settings.userId) {
        throw new Error("API credentials not found. Please check settings.");
      }

      const maxPages = 3;

      await this.syncArtist(repairArtist, settings, maxPages);

      await this.dbService.updateArtistLastChecked(artist.id);

      logger.info(
        `SyncService: Ремонтная синхронизация для ${artist.name} завершена.`
      );
    } catch (error) {
      logger.error(`SyncService: Ошибка ремонта для автора`, error);
      this.sendEvent(
        "sync:error",
        `Repair failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      this.isSyncing = false;
      this.sendEvent("sync:repair:end");
    }
  }

  // 3. ОБНОВЛЕННЫЙ МЕТОД: Поддержка лимита страниц (maxPages)
  private async syncArtist(
    artist: Artist,
    settings: Settings,
    maxPages: number = Infinity
  ) {
    logger.info(`SyncService: Проверка ${artist.name} [${artist.tag}]...`);

    let page = 0;
    let hasMore = true;
    let newPostsCount = 0;
    const limit = 100;

    const encodedTag = encodeURIComponent(artist.tag);

    while (hasMore && page < maxPages) {
      try {
        const idFilter =
          artist.lastPostId > 0 ? ` id:>${artist.lastPostId}` : "";

        const tagsQuery = `${
          artist.type === "uploader" ? "user:" : ""
        }${encodedTag}${idFilter}`;
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

        if (newPosts.length === 0 && artist.lastPostId > 0) {
          hasMore = false;
          break;
        }

        if (this.dbService) {
          const postsToSave = newPosts.map((p) => ({
            artistId: artist.id,
            fileUrl: p.file_url,
            postId: p.id,
            previewUrl: pickPreviewUrl(p),
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
