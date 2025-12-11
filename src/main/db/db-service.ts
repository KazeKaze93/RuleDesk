import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { Artist, NewArtist } from "./schema";
import { eq, asc } from "drizzle-orm";
import { logger } from "../lib/logger";

export type DbType = BetterSQLite3Database<typeof schema>;

export class DbService {
  public readonly db: DbType;

  constructor(sqliteDbInstance: InstanceType<typeof Database>) {
    this.db = drizzle(sqliteDbInstance, { schema });
    logger.info("DbService: Drizzle ORM инициализирован.");
  }

  async getTrackedArtists(): Promise<Artist[]> {
    return this.db.query.artists.findMany({
      orderBy: [asc(schema.artists.username)],
    });
  }

  // ИСПРАВЛЕНО: Возвращаем Promise<Artist>, убрали undefined
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
      // ИСПРАВЛЕНО: Используем logger вместо console
      logger.error("DbService: Ошибка при добавлении автора:", error);
      throw error; // Пробрасываем ошибку для UI
    }
  }

  async updateArtistPostStatus(
    artistId: number,
    newPostId: number,
    count: number
  ): Promise<void> {
    await this.db
      .update(schema.artists)
      .set({
        lastPostId: newPostId,
        newPostsCount: count,
        lastChecked: Math.floor(Date.now() / 1000),
      })
      .where(eq(schema.artists.id, artistId));
  }
}
