import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { Artist, NewArtist, NewPost, Post } from "./schema";
import { eq, asc, desc, sql, like, or } from "drizzle-orm";
import { logger } from "../lib/logger";
import { safeStorage } from "electron";

export type DbType = BetterSQLite3Database<typeof schema>;

export class DbService {
  public readonly db: DbType;

  constructor(sqliteDbInstance: InstanceType<typeof Database>) {
    this.db = drizzle(sqliteDbInstance, { schema });
    logger.info("DbService: Drizzle ORM initialized.");
  }

  // === 🛠️ DATABASE MAINTENANCE ===

  public async fixDatabaseSchema(): Promise<void> {
    logger.info("DbService: 🛠️ Running database schema repair...");
    try {
      // 1. Delete duplicates (keep only the one with smallest internal ID)
      await this.db.run(
        sql.raw(`
        DELETE FROM posts 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM posts 
          GROUP BY artist_id, post_id
        )
      `)
      );

      // 2. Create Unique Index (Prevents future duplicates)
      await this.db.run(
        sql.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_artist_post_unique 
        ON posts (artist_id, post_id)
      `)
      );

      logger.info("DbService: ✅ Database repaired and unique index secured.");
    } catch (error) {
      logger.error("DbService: Schema repair error (non-fatal)", error);
    }
  }

  /**
   * OPTIMIZED: Replaced N+1 loop with a single atomic SQL update.
   * Normalizes tags (trim spaces, lowercase, replace spaces with underscores).
   */
  async repairArtistTags(): Promise<void> {
    logger.info("DbService: Normalizing artist tags...");
    try {
      // SQLite native replacements to avoid JS loops
      await this.db.run(sql`
            UPDATE artists 
            SET tag = lower(replace(trim(tag), ' ', '_'))
            WHERE tag != lower(replace(trim(tag), ' ', '_'))
        `);
      logger.info("DbService: Tags normalized successfully.");
    } catch (error) {
      logger.error("DbService: Error normalizing tags:", error);
    }
  }

  // === 1. Artist Management ===

  async getTrackedArtists(): Promise<Artist[]> {
    return this.db.query.artists.findMany({
      orderBy: [asc(schema.artists.name)],
    });
  }

  async addArtist(artistData: NewArtist): Promise<Artist> {
    try {
      const result = await this.db
        .insert(schema.artists)
        .values({
          name: artistData.name,
          tag: artistData.tag,
          type: artistData.type, // Ensure UI allows selecting this!
          apiEndpoint: artistData.apiEndpoint,
        })
        .returning({ id: schema.artists.id });

      const saved = await this.getArtistById(result[0].id);
      if (!saved) throw new Error("Artist saved but not returned");
      return saved;
    } catch (error) {
      logger.error("DbService: Error adding artist:", error);
      throw error;
    }
  }

  async updateArtistLastChecked(artistId: number): Promise<void> {
    await this.db
      .update(schema.artists)
      .set({ lastChecked: new Date() })
      .where(eq(schema.artists.id, artistId));
  }

  // 🛡️ ATOMIC PROGRESS UPDATE
  async updateArtistProgress(
    artistId: number,
    newMaxPostId: number,
    postsAddedCount: number
  ): Promise<void> {
    const now = Date.now(); // FIX: Pass Date object, not timestamp number

    // SQL CASE ensures we NEVER decrease last_post_id
    await this.db.run(sql`
        UPDATE ${schema.artists}
        SET 
            last_post_id = CASE 
                WHEN ${newMaxPostId} > last_post_id THEN ${newMaxPostId} 
                ELSE last_post_id 
            END,
            new_posts_count = new_posts_count + ${postsAddedCount},
            last_checked = ${now}
        WHERE ${schema.artists.id} = ${artistId}
    `);

    if (postsAddedCount > 0) {
      logger.info(
        `DbService: Artist ${artistId} progress updated (MaxID: ${newMaxPostId}, +${postsAddedCount} posts)`
      );
    }
  }

  // === 2. Post Management ===

  async savePostsForArtist(_artistId: number, posts: NewPost[]): Promise<void> {
    if (posts.length === 0) return;

    await this.db.transaction(async (tx) => {
      await tx
        .insert(schema.posts)
        .values(posts)
        .onConflictDoUpdate({
          target: [schema.posts.artistId, schema.posts.postId],
          set: {
            // Using sql.raw for CASE logic is acceptable here for performance vs readability trade-off
            previewUrl: sql.raw(
              `CASE WHEN excluded.preview_url != '' THEN excluded.preview_url ELSE posts.preview_url END`
            ),
            fileUrl: sql.raw(
              `CASE WHEN excluded.file_url != '' THEN excluded.file_url ELSE posts.file_url END`
            ),
            tags: sql.raw(`excluded.tags`),
            rating: sql.raw(`excluded.rating`),
          },
        });
    });
  }

  async getPostsByArtist(
    artistId: number,
    limit = 1000,
    offset = 0
  ): Promise<Post[]> {
    return this.db.query.posts.findMany({
      where: eq(schema.posts.artistId, artistId),
      orderBy: [desc(schema.posts.postId)],
      limit: limit,
      offset: offset,
    });
  }

  async getArtistById(artistId: number): Promise<Artist | undefined> {
    return this.db.query.artists.findFirst({
      where: eq(schema.artists.id, artistId),
    });
  }

  async searchArtists(query: string): Promise<{ id: number; label: string }[]> {
    if (!query || query.length < 2) return [];
    const results = await this.db.query.artists.findMany({
      where: or(
        like(schema.artists.name, `%${query}%`),
        like(schema.artists.tag, `%${query}%`)
      ),
      limit: 20,
    });
    return results.map((artist) => ({ id: artist.id, label: artist.name }));
  }

  // === 3. Settings & Utils ===

  public async saveSettings(userId: string, apiKey: string): Promise<void> {
    if (!userId || !apiKey) {
      throw new Error("User ID and API Key are required.");
    }

    let encryptedKey: string | null = null;
    let encryptionAvailable = safeStorage.isEncryptionAvailable();

    if (!encryptionAvailable) {
      logger.warn(
        "Encryption is unavailable. API Key will be stored as plaintext (CRITICAL TEMPORARY FALLBACK)."
      );
      encryptedKey = apiKey;
    } else {
      try {
        const encryptedBuffer = safeStorage.encryptString(apiKey);
        encryptedKey = encryptedBuffer.toString("base64");
      } catch (error) {
        logger.error(
          "Failed to encrypt API Key. Storing as plaintext (CRITICAL SECURITY ISSUE).",
          error
        );
        encryptedKey = apiKey;
        encryptionAvailable = false;
      }
    }

    try {
      await this.db
        .insert(schema.settings)
        .values({
          id: 1,
          userId: userId,
          encryptedApiKey: encryptedKey,
        })
        .onConflictDoUpdate({
          target: schema.settings.id,
          set: {
            userId: userId,
            // Используем новое поле
            encryptedApiKey: encryptedKey,
          },
        });
    } catch (error) {
      logger.error("Database error while saving settings:", error);
      throw new Error("Failed to save credentials to database.");
    }
  }

  async deleteArtist(id: number): Promise<void> {
    await this.db.delete(schema.artists).where(eq(schema.artists.id, id));
    logger.info(`DbService: Artist ${id} deleted.`);
  }

  async markPostAsViewed(postId: number): Promise<void> {
    await this.db
      .update(schema.posts)
      .set({ isViewed: true })
      .where(eq(schema.posts.id, postId));
  }

  /**
   * Retrieves the settings status without exposing the API key.
   * Used by the IPC handler app:get-settings.
   */
  public async getSettingsStatus(): Promise<
    { hasApiKey: boolean; userId: string | null } | undefined
  > {
    const settings = await this.db.query.settings.findFirst({
      where: eq(schema.settings.id, 1),
    });

    if (!settings) {
      return undefined;
    }

    return {
      userId: settings.userId,
      // Проверяем, существует ли зашифрованный ключ
      hasApiKey: !!settings.encryptedApiKey,
    };
  }

  /**
   * Retrieves the decrypted API key for internal Main/Worker services (SyncService).
   * This method is NEVER exposed to the Renderer Process via IPC.
   */
  public async getApiKeyDecrypted(): Promise<
    { userId: string; apiKey: string } | undefined
  > {
    const settings = await this.db.query.settings.findFirst({
      where: eq(schema.settings.id, 1),
    });

    if (!settings || !settings.userId || !settings.encryptedApiKey) {
      return undefined;
    }

    let decryptedKey = settings.encryptedApiKey;

    // Логика дешифрования, которую ты уже реализовал
    if (safeStorage.isEncryptionAvailable()) {
      try {
        const encryptedBuffer = Buffer.from(settings.encryptedApiKey, "base64");
        decryptedKey = safeStorage.decryptString(encryptedBuffer);
      } catch (error) {
        logger.error(
          "Failed to decrypt API Key. Using raw stored value.",
          error
        );
        decryptedKey = settings.encryptedApiKey;
      }
    }

    // Возвращаем дешифрованный ключ (или сырой fallback)
    return {
      userId: settings.userId,
      apiKey: decryptedKey,
    };
  }
}
