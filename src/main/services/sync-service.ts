import axios from "axios";
import { DbService } from "../db/db-service";
import { logger } from "../lib/logger";
import { NewPost, Artist } from "../db/schema";

// Типизация ответа Rule34 (JSON)
interface Rule34Post {
  id: number;
  file_url: string;
  preview_url: string;
  tags: string;
  rating: string;
  change: number; // timestamp
  height: number;
  width: number;
}

export class SyncService {
  constructor(private dbService: DbService) {}

  async syncAllArtists(): Promise<void> {
    logger.info("SyncService: Начало полного цикла синхронизации Rule34...");

    try {
      // 1. Получаем ключи
      const settings = await this.dbService.getSettings();

      if (!settings) {
        logger.warn(
          "SyncService: Ключи (userId/apiKey) не найдены. Синхронизация пропущена."
        );
        return;
      }

      const artists = await this.dbService.getTrackedArtists();
      logger.info(
        `SyncService: Найдено авторов для обновления: ${artists.length}`
      );

      for (const artist of artists) {
        try {
          await this.syncArtist(artist, settings.userId, settings.apiKey);
        } catch (error) {
          logger.error(
            `SyncService: Ошибка при обновлении ${artist.name}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }

        // Пауза 1.5 сек (Rule34 Rate Limit) - Асинхронная, не блокирует Event Loop.
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      logger.info("SyncService: Полный цикл синхронизации завершен.");
    } catch (criticalError) {
      logger.error(
        `SyncService: Критическая ошибка в syncAllArtists: ${criticalError}`
      );
      throw criticalError;
    }
  }

  private async syncArtist(
    artist: Artist,
    userId: string,
    apiKey: string
  ): Promise<void> {
    logger.info(`SyncService: Проверка ${artist.name} [${artist.tag}]...`);

    const limit = 1000; // Максимум Rule34
    let page = 0; // pid начинается с 0
    let hasMore = true; // Флаг для цикла
    let totalSynced = 0;

    // 1. Цикл пагинации
    while (hasMore) {
      let tagsQuery = artist.tag;
      if (artist.lastPostId > 0) {
        tagsQuery += ` id:>${artist.lastPostId}`;
      }

      // 2. Параметры запроса Rule34
      const params = new URLSearchParams({
        page: "dapi",
        s: "post",
        q: "index",
        json: "1",
        limit: limit.toString(),
        tags: tagsQuery,
        user_id: userId,
        api_key: apiKey,
        pid: page.toString(),
      });

      // Чистим URL
      const baseUrl = artist.apiEndpoint.split("?")[0];

      try {
        const response = await axios.get<Rule34Post[]>(baseUrl, {
          params,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NSFWBooruClient/1.0)",
          },
          timeout: 8000,
        });

        const apiPosts = response.data;

        if (!Array.isArray(apiPosts) || apiPosts.length === 0) {
          hasMore = false;
          break;
        }

        // 3. Маппинг
        const newPosts: NewPost[] = apiPosts.map((p) => ({
          id: p.id,
          artistId: artist.id,
          fileUrl: p.file_url,
          previewUrl: p.preview_url || p.file_url,
          title: "",
          rating: p.rating,
          tags: p.tags,
          publishedAt: p.change,
        }));

        // 4. Сохранение
        await this.dbService.savePostsForArtist(artist.id, newPosts);

        totalSynced += newPosts.length;
        logger.info(
          `SyncService: ${artist.name} -> Страница ${page} загружена (${newPosts.length} постов)`
        );

        if (apiPosts.length < limit) {
          hasMore = false;
        } else {
          page++;
          // Пауза 0.5 сек между страницами пагинации
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.data === "") {
          hasMore = false;
          break;
        }

        logger.error(
          `SyncService: Ошибка при обработке страницы ${page} для ${
            artist.name
          }: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    if (totalSynced === 0) {
      await this.dbService.updateArtistLastChecked(artist.id);
      logger.info(`SyncService: Нет новых постов для ${artist.name}`);
    } else {
      logger.info(
        `SyncService: Всего загружено ${totalSynced} постов для ${artist.name}`
      );
    }
  }
}
