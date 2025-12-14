import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { Artist, NewArtist, NewPost, Post, Settings } from "./schema";
import { eq, asc, desc, sql, like, or } from "drizzle-orm";
import { logger } from "../lib/logger";
import { normalizeTag } from "../../shared/lib/tag-utils";

export type DbType = BetterSQLite3Database<typeof schema>;
type ArtistInsertSchema = typeof schema.artists.$inferInsert;

export class DbService {
  public readonly db: DbType;

  constructor(sqliteDbInstance: InstanceType<typeof Database>) {
    this.db = drizzle(sqliteDbInstance, { schema });
    logger.info("DbService: Drizzle ORM initialized.");
  }

  // === 🛠️ CRITICAL FIX: DATABASE REPAIR ===
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

  // === 1. Artist Management ===

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

      const savedArtist = await this.db.query.artists.findFirst({
        where: eq(schema.artists.id, result[0].id),
      });

      if (!savedArtist) throw new Error("Artist inserted but not found");
      return savedArtist;
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

  // 🛡️ ATOMIC PROGRESS UPDATE (Fixed Date issue)
  async updateArtistProgress(
    artistId: number,
    newMaxPostId: number,
    postsAddedCount: number
  ): Promise<void> {
    // FIX: SQLite raw query expects a number for timestamp, not a JS Date object
    const now = Math.floor(Date.now() / 1000);

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
        `DbService: Artist ${artistId} updated (MaxID: ${newMaxPostId}, +${postsAddedCount} posts)`
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

  async getSettings(): Promise<Settings | undefined> {
    return this.db.query.settings.findFirst();
  }

  async saveSettings(userId: string, apiKey: string): Promise<void> {
    await this.db
      .insert(schema.settings)
      .values({ id: 1, userId, apiKey })
      .onConflictDoUpdate({
        target: schema.settings.id,
        set: { userId, apiKey },
      });
    logger.info("DbService: Settings updated");
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

  async repairArtistTags(): Promise<void> {
    const allArtists = await this.db.query.artists.findMany();
    for (const artist of allArtists) {
      const cleaned = normalizeTag(artist.tag);
      if (artist.tag !== cleaned) {
        await this.db
          .update(schema.artists)
          .set({ tag: cleaned })
          .where(eq(schema.artists.id, artist.id));
      }
    }
  }
}
