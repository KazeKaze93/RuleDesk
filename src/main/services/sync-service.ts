import { BrowserWindow, safeStorage } from "electron";
import { logger } from "../lib/logger";
import axios from "axios";
import { URLSearchParams } from "url";
import { eq, sql } from "drizzle-orm";

// DB Access
import { getDatabase } from "../db";
import { posts, artists } from "../db/schema";
import type { Artist, NewPost } from "../db/schema";

// Services
import { SettingsService } from "./settings.service";
import { ArtistsService } from "./artists.service";

interface InternalDecryptedSettings {
  userId: string;
  apiKey: string;
}

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
  private window: BrowserWindow | null = null;
  private isSyncing = false;

  // Зависимости
  private settingsService: SettingsService | null = null;
  private artistsService: ArtistsService | null = null;

  // Прямой доступ к БД для массовых операций
  private get db() {
    return getDatabase();
  }

  public setWindow(window: BrowserWindow) {
    this.window = window;
  }

  public setServices(
    settingsService: SettingsService,
    artistsService: ArtistsService
  ) {
    this.settingsService = settingsService;
    this.artistsService = artistsService;
  }

  public sendEvent(channel: string, data?: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  private async getDecryptedSettings(): Promise<InternalDecryptedSettings | null> {
    if (!this.settingsService) {
      logger.error("SyncService: SettingsService is not initialized!");
      return null;
    }

    const settings = await this.settingsService.getSettings();
    let realApiKey = settings.encryptedApiKey || "";

    // Дешифровка
    if (realApiKey && safeStorage.isEncryptionAvailable()) {
      try {
        const buff = Buffer.from(realApiKey, "base64");
        realApiKey = safeStorage.decryptString(buff);
      } catch (e) {
        logger.warn(
          "SyncService: Failed to decrypt API Key. Using raw value.",
          e
        );
      }
    }

    return {
      userId: settings.userId || "",
      apiKey: realApiKey,
    };
  }

  /**
   * 🔥 Проверка кредов
   */
  public async checkCredentials(): Promise<boolean> {
    try {
      const settings = await this.getDecryptedSettings();

      if (!settings?.userId || !settings?.apiKey) {
        return false;
      }

      const params = new URLSearchParams({
        page: "dapi",
        s: "post",
        q: "index",
        limit: "1",
        json: "1",
        user_id: settings.userId,
        api_key: settings.apiKey,
      });

      const { data } = await axios.get(
        `https://api.rule34.xxx/index.php?${params}`,
        { timeout: 10000 }
      );

      return Array.isArray(data);
    } catch (error) {
      logger.error("SyncService: Credentials check failed", error);
      return false;
    }
  }

  public async syncAllArtists() {
    if (this.isSyncing) return;
    if (!this.artistsService) return;

    this.isSyncing = true;
    logger.info("SyncService: Start Full Sync");
    this.sendEvent("sync:start");

    try {
      // 1. Получаем артистов напрямую через сервис
      const allArtists = await this.artistsService.getAll();

      // 2. Получаем настройки
      const settings = await this.getDecryptedSettings();
      if (!settings?.userId) throw new Error("No API credentials");

      // 3. Синхронизируем
      for (const artist of allArtists) {
        this.sendEvent("sync:progress", `Checking ${artist.name}...`);
        await this.syncArtist(artist, settings);
        // Небольшая задержка, чтобы не DDOS-ить API
        await new Promise((r) => setTimeout(r, 1000));
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
    if (this.isSyncing || !this.artistsService) return;
    this.isSyncing = true;
    try {
      const artist = await this.artistsService.getById(artistId);
      const settings = await this.getDecryptedSettings();

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
    settings: InternalDecryptedSettings,
    maxPages = Infinity
  ) {
    let page = 0;
    let hasMore = true;
    let totalAddedForArtist = 0;
    let currentHighestId = artist.lastPostId;

    while (hasMore && page < maxPages) {
      try {
        const idFilter =
          artist.lastPostId > 0 ? ` id:>${artist.lastPostId}` : "";
        const tagsQuery = `${artist.type === "uploader" ? "user:" : ""}${
          artist.tag
        }${idFilter}`;

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

        const { data: postsData } = await axios.get<R34Post[]>(
          `https://api.rule34.xxx/index.php?${params.toString()}`,
          { timeout: 15000 }
        );

        // 🔥 КРИТИЧЕСКИЙ ФИКС: Проверка, что пришел массив
        if (!postsData || !Array.isArray(postsData) || postsData.length === 0) {
          hasMore = false;
          break;
        }

        // Вычисляем максимальный ID в этой пачке
        const batchMaxId = Math.max(...postsData.map((p) => Number(p.id)));
        if (batchMaxId > currentHighestId) currentHighestId = batchMaxId;

        // Фильтруем только те, которых у нас реально нет
        const newPostsFromBatch = postsData.filter(
          (p) => Number(p.id) > artist.lastPostId
        );

        if (newPostsFromBatch.length > 0) {
          const postsToSave: NewPost[] = newPostsFromBatch.map((p) => ({
            postId: Number(p.id),
            artistId: artist.id,
            fileUrl: p.file_url,
            previewUrl: pickPreviewUrl(p),
            sampleUrl: p.sample_url || p.file_url,
            title: "",
            rating: p.rating,
            tags: p.tags,
            publishedAt: new Date(
              (p.change || Math.floor(Date.now() / 1000)) * 1000
            ),
            isViewed: false,
            isFavorited: false,
          }));

          await this.db.transaction(async (tx) => {
            await tx.insert(posts).values(postsToSave).onConflictDoNothing();

            await tx
              .update(artists)
              .set({
                lastPostId: currentHighestId,
                newPostsCount: sql`${artists.newPostsCount} + ${postsToSave.length}`,
                lastChecked: new Date(),
              })
              .where(eq(artists.id, artist.id));
          });

          totalAddedForArtist += postsToSave.length;
        }

        if (postsData.length < 100) {
          hasMore = false;
        } else {
          page++;
          await new Promise((r) => setTimeout(r, 500));
        }
      } catch (e) {
        logger.error(`Sync error for ${artist.name}:`, e);
        hasMore = false;
      }
    }

    if (totalAddedForArtist === 0) {
      await this.db
        .update(artists)
        .set({ lastChecked: new Date() })
        .where(eq(artists.id, artist.id));
    }

    logger.info(
      `Sync finished for ${artist.name}. Added: ${totalAddedForArtist}`
    );
  }
}

export const syncService = new SyncService();
