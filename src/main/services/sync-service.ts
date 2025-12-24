import { BrowserWindow, safeStorage } from "electron";
import { logger } from "../lib/logger";
import { getDb } from "../db/client";
import { posts, artists, settings } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import axios from "axios";
import type { Artist } from "../db/schema";
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
  private window: BrowserWindow | null = null;
  private isSyncing = false;

  public setWindow(window: BrowserWindow) {
    this.window = window;
  }

  public sendEvent(channel: string, data?: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  private async getDecryptedSettings() {
    try {
      const db = getDb();
      const settingsRecord = await db.query.settings.findFirst({
        where: eq(settings.id, 1),
      });

      if (!settingsRecord) {
        logger.warn("SyncService: No settings found in database");
        return null;
      }

      let realApiKey = settingsRecord.encryptedApiKey || "";

      // Дешифровка (safeStorage)
      if (realApiKey && safeStorage.isEncryptionAvailable()) {
        try {
          const buff = Buffer.from(realApiKey, "base64");
          realApiKey = safeStorage.decryptString(buff);
          logger.info(
            `SyncService: Credentials decrypted successfully. Final Key Length: ${realApiKey.length}`
          );
        } catch (e) {
          // Если ошибка дешифровки, возможно это "сырой" ключ (например в dev режиме), оставляем как есть
          logger.warn(
            "SyncService: Failed to decrypt API Key. This usually means the app was run by a different user/session or the encryption key was lost.",
            e
          );
          realApiKey = settingsRecord.encryptedApiKey || "";
        }
      }

      return {
        userId: settingsRecord.userId || "",
        apiKey: realApiKey,
      };
    } catch (error) {
      logger.error("SyncService: Error fetching settings:", error);
      return null;
    }
  }

  /**
   * 🔥 Реальная проверка кредов через API Rule34
   */
  public async checkCredentials(): Promise<boolean> {
    try {
      const settings = await this.getDecryptedSettings();

      if (!settings?.userId || !settings?.apiKey) {
        logger.warn(
          "SyncService: Cannot verify credentials - missing ID or Key."
        );
        return false;
      }

      logger.info(
        `SyncService: Verifying connectivity for User ID: ${settings.userId}...`
      );

      const params = new URLSearchParams({
        page: "dapi",
        s: "post",
        q: "index",
        limit: "1",
        json: "1",
        user_id: settings.userId,
        api_key: settings.apiKey,
      });

      const { data, status } = await axios.get(
        `https://api.rule34.xxx/index.php?${params}`,
        {
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json",
            "Accept-Encoding": "identity",
          },
        }
      );

      if (Array.isArray(data)) {
        logger.info(
          `SyncService: Connection verified (Status: ${status}). Downloaded ${data.length} test posts.`
        );
        return true;
      }

      logger.warn(
        `SyncService: Verification failed. API response was not an array. Data: ${JSON.stringify(
          data
        ).substring(0, 100)}`
      );
      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          `SyncService: Network error. Status: ${error.response?.status}.`
        );
      } else {
        logger.error("SyncService: Verification error", error);
      }
      return false;
    }
  }

  public async syncAllArtists() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    logger.info("SyncService: Start Full Sync");
    this.sendEvent("sync:start");

    try {
      const db = getDb();
      const artistsList = await db.query.artists.findMany({
        orderBy: [artists.name],
      });

      const settingsData = await this.getDecryptedSettings();

      if (!settingsData?.userId) throw new Error("No API credentials");

      for (const artist of artistsList) {
        this.sendEvent("sync:progress", `Checking ${artist.name}...`);
        await this.syncArtist(artist, settingsData);
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
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const db = getDb();
      const artist = await db.query.artists.findFirst({
        where: eq(artists.id, artistId),
      });

      const settingsData = await this.getDecryptedSettings();

      if (artist && settingsData) {
        this.sendEvent("sync:repair:start", artist.name);
        // Force download by using lastPostId: 0
        await this.syncArtist({ ...artist, lastPostId: 0 }, settingsData, 3);
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
    settings: { userId: string; apiKey: string },
    maxPages = Infinity
  ) {
    const db = getDb();
    let page = 0;
    let hasMore = true;
    let newPostsCount = 0;
    let highestPostId = artist.lastPostId;
    const allPostsToSave: Array<{
      artistId: number;
      fileUrl: string;
      postId: number;
      previewUrl: string;
      sampleUrl: string;
      title: string;
      rating: string;
      tags: string;
      publishedAt: Date;
      isViewed: boolean;
    }> = [];

    // Fetch all posts first (network operations outside transaction)
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

        const { data: postsData } = await axios.get<R34Post[]>(
          `https://api.rule34.xxx/index.php?${params}`,
          {
            timeout: 15000,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Encoding": "identity",
            },
          }
        );

        const batchMaxId = postsData.length > 0 ? Math.max(...postsData.map((p) => Number(p.id))) : 0;
        if (batchMaxId > highestPostId) highestPostId = batchMaxId;

        const newPosts = postsData.filter((p) => p.id > artist.lastPostId);

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
          publishedAt: new Date((p.change || 0) * 1000),
          isViewed: false,
        }));

        allPostsToSave.push(...postsToSave);
        newPostsCount += postsToSave.length;

        if (postsData.length < 100) hasMore = false;
        else page++;

        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        logger.error(`Sync error for ${artist.name}`, e);
        hasMore = false;
      }
    }

    // Single transaction for all database operations
    await db.transaction(async (tx) => {
      if (allPostsToSave.length > 0) {
        // Bulk insert all posts
        await tx
          .insert(posts)
          .values(allPostsToSave)
          .onConflictDoUpdate({
            target: [posts.artistId, posts.postId],
            set: {
              fileUrl: sql`excluded.file_url`,
              sampleUrl: sql`excluded.sample_url`,
              previewUrl: sql`excluded.preview_url`,
              tags: sql`excluded.tags`,
              rating: sql`excluded.rating`,
              publishedAt: sql`excluded.published_at`,
            },
          });
      }

      // Update artist stats atomically
      await tx
        .update(artists)
        .set({
          lastPostId: sql`CASE WHEN ${artists.lastPostId} > ${highestPostId} THEN ${artists.lastPostId} ELSE ${highestPostId} END`,
          newPostsCount: sql`${artists.newPostsCount} + ${newPostsCount}`,
          lastChecked: new Date(),
        })
        .where(eq(artists.id, artist.id));
    });

    logger.info(`Sync finished for ${artist.name}. Added: ${newPostsCount}`);
  }
}

export const syncService = new SyncService();
