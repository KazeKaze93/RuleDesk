import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { Artist, NewArtist } from "./schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { asc } from "drizzle-orm";

// --- Тип для нашего Drizzle инстанса ---
export type DbType = BetterSQLite3Database<typeof schema>;

/**
 * Класс, инкапсулирующий логику доступа к базе данных.
 */
export class DbService {
  public readonly db: DbType;

  constructor(sqliteDbInstance: InstanceType<typeof Database>) {
    this.db = drizzle(sqliteDbInstance, { schema });
    logger.info("DbService: Drizzle ORM инициализирован.");
  }

  // --- 1. Artist Management ---

  async getTrackedArtists(): Promise<Artist[]> {
    return this.db.query.artists.findMany({
      orderBy: [asc(schema.artists.username)], // Сортировка по имени
    });
  }

  async addArtist(artistData: NewArtist): Promise<Artist | undefined> {
    try {
      const result = await this.db
        .insert(schema.artists)
        .values(artistData)
        .returning({ id: schema.artists.id });

      if (result.length > 0) {
        return this.db.query.artists.findFirst({
          where: eq(schema.artists.id, result[0].id),
        });
      }
    } catch (error) {
      logger.error("DbService: Ошибка при добавлении автора:", error);
      throw new Error(`Не удалось добавить автора: ${artistData.username}`);
    }
    return undefined;
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
