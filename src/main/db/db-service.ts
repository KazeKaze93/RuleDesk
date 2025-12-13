import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { Artist, NewArtist, NewPost, Post, Settings } from "./schema";
import { eq, asc, desc, sql, like, or } from "drizzle-orm";
import { logger } from "../lib/logger";

export type DbType = BetterSQLite3Database<typeof schema>;
type ArtistInsertSchema = typeof schema.artists.$inferInsert;

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
    const dataToInsert: ArtistInsertSchema = {
      name: artistData.name,
      tag: artistData.tag,
      type: artistData.type,
      apiEndpoint: artistData.apiEndpoint,
    };

    try {
      const result = await this.db
        .insert(schema.artists)
        .values(dataToInsert)
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

    const sortedPosts = posts.sort((a, b) => (b.postId || 0) - (a.postId || 0));
    const newestPostId = sortedPosts[0].postId || 0;

    await this.db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(schema.posts)
        .values(posts)
        .onConflictDoUpdate({
          target: [schema.posts.artistId, schema.posts.postId],
          set: {
            // ЭТОТ SQL.RAW БЕЗОПАСЕН.
            // Мы используем только СТАТИЧЕСКОЕ имя колонки (.name),
            // а не невалидированные пользовательские данные.
            // Parametrization обеспечивается Drizzle.
            previewUrl: sql.raw(
              `CASE WHEN excluded.${schema.posts.previewUrl.name} != '' THEN excluded.${schema.posts.previewUrl.name} ELSE ${schema.posts.previewUrl.name} END`
            ),
            fileUrl: sql.raw(
              `CASE WHEN excluded.${schema.posts.fileUrl.name} != '' THEN excluded.${schema.posts.fileUrl.name} ELSE ${schema.posts.fileUrl.name} END`
            ),
            tags: sql.raw(`excluded.${schema.posts.tags.name}`),
            rating: sql.raw(`excluded.${schema.posts.rating.name}`),
            publishedAt: sql.raw(`excluded.${schema.posts.publishedAt.name}`),
          },
        })
        .returning({ id: schema.posts.id });

      const realAddedCount = insertedRows.length;

      await tx
        .update(schema.artists)
        .set({
          lastPostId: newestPostId,
          newPostsCount: sql`${schema.artists.newPostsCount} + ${realAddedCount}`,
          lastChecked: Math.floor(Date.now() / 1000),
        })
        .where(eq(schema.artists.id, artistId));

      if (realAddedCount > 0) {
        logger.info(
          `DbService: Автор ${artistId} -> Добавлено ${realAddedCount} новых постов (Обновлено: ${
            posts.length - realAddedCount
          })`
        );
      }
    });

    // ...
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
      columns: {
        id: true,
        name: true,
        type: true,
      },
    });

    return results.map((artist) => ({
      id: artist.id,
      label: artist.name,
    }));
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

  async markPostAsViewed(postId: number): Promise<void> {
    await this.db
      .update(schema.posts)
      .set({ isViewed: true })
      .where(eq(schema.posts.id, postId));
  }
}
