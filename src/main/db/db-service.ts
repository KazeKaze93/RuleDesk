import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { Artist, NewArtist, NewPost, Post, Settings } from "./schema";
import { eq, asc, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

export type DbType = BetterSQLite3Database<typeof schema>;

export class DbService {
  public readonly db: DbType;

  constructor(sqliteDbInstance: InstanceType<typeof Database>) {
    this.db = drizzle(sqliteDbInstance, { schema });
    logger.info("DbService: Drizzle ORM инициализирован.");
  }

  // --- 1. Artist Management ---

  async getTrackedArtists(): Promise<Artist[]> {
    return this.db.query.artists.findMany({
      orderBy: [asc(schema.artists.name)],
    });
  }

  async addArtist(artistData: NewArtist): Promise<Artist> {
    try {
      const result = await this.db
        .insert(schema.artists)
        .values(artistData)
        .returning({ id: schema.artists.id });

      if (!result || result.length === 0) {
        throw new Error("Insert operation failed");
      }

      const savedArtist = await this.db.query.artists.findFirst({
        where: eq(schema.artists.id, result[0].id),
      });

      if (!savedArtist) {
        throw new Error("Artist inserted but could not be retrieved");
      }

      return savedArtist;
    } catch (error) {
      logger.error("DbService: Ошибка при добавлении автора:", error);
      throw error;
    }
  }

  async updateArtistLastChecked(artistId: number): Promise<void> {
    await this.db
      .update(schema.artists)
      .set({ lastChecked: Math.floor(Date.now() / 1000) })
      .where(eq(schema.artists.id, artistId));
  }

  // --- 2. Post Management ---

  async savePostsForArtist(artistId: number, posts: NewPost[]): Promise<void> {
    if (posts.length === 0) {
      await this.updateArtistLastChecked(artistId);
      return;
    }

    // Сортируем: новые в начале, чтобы найти самый большой ID
    const sortedPosts = posts.sort((a, b) => (b.id || 0) - (a.id || 0));
    const newestPostId = sortedPosts[0].id || 0;
    const count = posts.length;

    await this.db.transaction(async (tx) => {
      // Игнорируем дубликаты (onConflictDoNothing)
      await tx.insert(schema.posts).values(posts).onConflictDoNothing();

      await tx
        .update(schema.artists)
        .set({
          lastPostId: newestPostId,
          newPostsCount: sql`${schema.artists.newPostsCount} + ${count}`,
          lastChecked: Math.floor(Date.now() / 1000),
        })
        .where(eq(schema.artists.id, artistId));
    });

    logger.info(
      `DbService: Сохранено ${count} постов для автора ID ${artistId}`
    );
  }

  async getPostsByArtist(
    artistId: number,
    limit = 1000,
    offset = 0
  ): Promise<Post[]> {
    return this.db.query.posts.findMany({
      where: eq(schema.posts.artistId, artistId),
      orderBy: [desc(schema.posts.id)], // Сначала новые
      limit: limit,
      offset: offset,
    });
  }

  // --- 3. Settings Management ---
  async getSettings(): Promise<Settings | undefined> {
    return this.db.query.settings.findFirst();
  }

  async saveSettings(userId: string, apiKey: string): Promise<void> {
    // ID всегда 1, чтобы перезаписывать старые настройки
    await this.db
      .insert(schema.settings)
      .values({ id: 1, userId, apiKey })
      .onConflictDoUpdate({
        target: schema.settings.id,
        set: { userId, apiKey },
      });

    logger.info("DbService: Настройки API обновлены");
  }

  async deleteArtist(id: number): Promise<void> {
    await this.db.delete(schema.artists).where(eq(schema.artists.id, id));
    logger.info(`DbService: Автор ID ${id} и его посты удалены.`);
  }
}
