/* eslint-disable @typescript-eslint/no-explicit-any */
import { parentPort } from "worker_threads";
import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { NewArtist } from "./schema";
import { eq, asc, desc, sql, like, or, count } from "drizzle-orm";
import type { WorkerRequest, WorkerResponse } from "./worker-types";
import * as path from "path";
import * as fs from "fs";
import { logger } from "../lib/logger";
import { z } from "zod";

if (logger && logger.transports && logger.transports.file) {
  logger.transports.file.level = false;
}

type DbType = BetterSQLite3Database<typeof schema>;

let db: DbType | null = null;
let dbInstance: Database.Database | null = null;
let dbPath: string | null = null;

// === WORKER VALIDATION SCHEMAS ===
const SettingsPayloadSchema = z.object({
  userId: z.string(),
  encryptedApiKey: z.string(),
});

const UpdateProgressSchema = z.object({
  artistId: z.number(),
  newMaxPostId: z.number(),
  postsAddedCount: z.number(),
});

const PostsPayloadSchema = z.object({
  artistId: z.number(),
  limit: z.number().default(1000),
  offset: z.number().default(0),
});

const PostsCountPayloadSchema = z.object({
  artistId: z.number().optional(),
});

const SearchPayloadSchema = z.object({
  query: z.string(),
});

const PostItemSchema = z.object({
  artistId: z.number().int(),
  postId: z.number().int(),
  fileUrl: z.string(),
  previewUrl: z.string().optional().nullable(),
  sampleUrl: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  rating: z.string(),
  tags: z.string().optional().nullable(),
  // Трансформируем дату из строки/числа/Date в объект Date для Drizzle
  publishedAt: z
    .union([z.string(), z.number(), z.date()])
    .transform((val) => new Date(val)),
  isViewed: z.boolean().optional().default(false),
});

const SavePostsSchema = z.object({
  artistId: z.number(),
  posts: z.array(PostItemSchema), // Используем строгую схему
});

const PostActionPayloadSchema = z.object({
  postId: z.number().int().positive(),
});

interface RawSettingsRow {
  user_id: string;
  api_key?: string;
  encrypted_api_key?: string;
}

export const togglePostViewed = async (postId: number): Promise<boolean> => {
  if (!db) {
    console.error(`DB Worker: togglePostViewed called before initialization.`);
    return false;
  }

  try {
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId),
      columns: { isViewed: true },
    });

    if (!post) {
      console.warn(
        `Post with ID ${postId} not found for toggling viewed status.`
      );
      return false;
    }

    const newIsViewed = !post.isViewed;

    await db
      .update(schema.posts)
      .set({ isViewed: newIsViewed })
      .where(eq(schema.posts.id, postId));

    return true;
  } catch (error) {
    console.error(`Error toggling viewed status for post ${postId}:`, error);
    return false;
  }
};

export const resetPostCache = async (postId: number): Promise<boolean> => {
  console.warn(
    `[DEV ACTION] Placeholder: Resetting local cache for Post ID: ${postId}. Actual cache clearing logic (deleting file, clearing fields) should be implemented here.`
  );
  return true;
};

// --- Helpers ---
function sendResponse(response: WorkerResponse): void {
  if (parentPort) parentPort.postMessage(response);
}
function sendError(id: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : String(error);
  sendResponse({ id, success: false, error: msg });
}
function sendSuccess(id: string, data?: unknown): void {
  sendResponse({ id, success: true, data });
}

function initializeDatabase(initialDbPath: string): void {
  try {
    dbInstance = new Database(initialDbPath, {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    });
    db = drizzle(dbInstance, { schema });
    dbPath = initialDbPath;

    const migrationsPath = path.join(process.cwd(), "drizzle");
    logger.info(`Migrations: Path: ${migrationsPath}`);
    migrate(db, { migrationsFolder: migrationsPath });
    logger.info("Migrations: Success.");
  } catch (error) {
    logger.error("Migrations: FATAL ERROR", error);
    throw new Error(`Failed to run migrations: ${error}`);
  }
}

function getSettingsRaw(db: Database.Database) {
  try {
    const row = db.prepare("SELECT * FROM settings LIMIT 1").get() as
      | RawSettingsRow
      | undefined;

    if (!row) {
      logger.info("Worker: getSettingsRaw returned no settings row."); // 🔥 LOG
      return null;
    }

    const key = row.encrypted_api_key || row.api_key;
    logger.info(
      `Worker: Found settings in DB. UserID: ${
        row.user_id
      }, Encrypted Key length: ${key?.length || 0}`
    );

    return {
      userId: row.user_id,
      encryptedApiKey: key,
    };
  } catch (e) {
    logger.error("Worker: CRITICAL error in getSettingsRaw:", e); // 🔥 LOG
    return null;
  }
}

// --- Maintenance Helpers ---
async function fixDatabaseSchemaHelper(
  _db: DbType,
  dbInstance: Database.Database
) {
  logger.info("DbService: 🛠️ Running database schema repair...");
  await dbInstance.exec(`
        DELETE FROM posts WHERE id NOT IN (SELECT MIN(id) FROM posts GROUP BY artist_id, post_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_artist_post_unique ON posts (artist_id, post_id);
    `);
  logger.info("DbService: ✅ Database repaired.");
}

async function repairArtistTagsHelper(dbInstance: Database.Database) {
  logger.info("DbService: Normalizing artist tags...");
  await dbInstance.exec(
    `UPDATE artists SET tag = lower(replace(trim(tag), ' ', '_')) WHERE tag != lower(replace(trim(tag), ' ', '_'));`
  );
  logger.info("DbService: Tags normalized.");
}

// --- Main Handler ---
async function handleRequest(request: WorkerRequest): Promise<void> {
  if (!db || !dbInstance) {
    sendError(request.id, new Error("Database not initialized"));
    return;
  }

  try {
    switch (request.type) {
      case "getApiKeyDecrypted": {
        const settings = getSettingsRaw(dbInstance);

        sendSuccess(request.id, {
          userId: settings?.userId || "",
          apiKey: settings?.encryptedApiKey || "",
        });
        break;
      }
      case "getSettingsStatus": {
        const settings = getSettingsRaw(dbInstance);
        sendSuccess(request.id, {
          userId: settings?.userId || "",
          hasApiKey: !!settings?.encryptedApiKey,
        });
        break;
      }

      case "saveSettings": {
        const { userId, encryptedApiKey } = SettingsPayloadSchema.parse(
          request.payload
        );
        const tableInfo = dbInstance!.pragma("table_info(settings)") as Array<{
          name: string;
        }>;
        const colName = tableInfo.some((c) => c.name === "encrypted_api_key")
          ? "encrypted_api_key"
          : "api_key";

        dbInstance.transaction(() => {
          const existing = dbInstance!
            .prepare("SELECT id FROM settings WHERE id = 1")
            .get();
          if (existing) {
            dbInstance!
              .prepare(
                `UPDATE settings SET user_id = ?, ${colName} = ? WHERE id = 1`
              )
              .run(userId, encryptedApiKey);
          } else {
            dbInstance!
              .prepare(
                `INSERT INTO settings (id, user_id, ${colName}) VALUES (1, ?, ?)`
              )
              .run(userId, encryptedApiKey);
          }
        })();
        sendSuccess(request.id);
        break;
      }

      case "getTrackedArtists":
        sendSuccess(
          request.id,
          await db.query.artists.findMany({
            orderBy: [asc(schema.artists.name)],
          })
        );
        break;

      case "addArtist": {
        const ad = request.payload as NewArtist;
        const res = await db
          .insert(schema.artists)
          .values(ad)
          .returning({ id: schema.artists.id });
        sendSuccess(
          request.id,
          await db.query.artists.findFirst({
            where: eq(schema.artists.id, res[0].id),
          })
        );
        break;
      }

      case "updateArtistProgress": {
        const { artistId, newMaxPostId, postsAddedCount } =
          UpdateProgressSchema.parse(request.payload);
        const now = Date.now();
        await db.run(sql`
            UPDATE ${schema.artists} 
            SET 
                last_post_id = CASE WHEN ${newMaxPostId} > last_post_id THEN ${newMaxPostId} ELSE last_post_id END, 
                new_posts_count = new_posts_count + ${postsAddedCount}, 
                last_checked = ${now} 
            WHERE ${schema.artists.id} = ${artistId}
        `);
        sendSuccess(request.id);
        break;
      }

      case "savePostsForArtist": {
        const { posts } = SavePostsSchema.parse(request.payload);

        if (posts.length > 0) {
          await db.transaction(async (tx) => {
            // Используем sql.raw, так как Drizzle не поддерживает условные UPDATE/UPSERT
            // на основе EXCLUDED значений для SQLite. Это безопасно, так как
            // поля 'excluded.*' берутся из валидированного PostItemSchema.
            for (const post of posts) {
              await tx
                .insert(schema.posts)
                .values({
                  artistId: post.artistId,
                  postId: post.postId,
                  fileUrl: post.fileUrl,
                  previewUrl: post.previewUrl || "",
                  sampleUrl: post.sampleUrl || "",
                  title: post.title || "",
                  rating: post.rating,
                  tags: post.tags || "",
                  publishedAt: post.publishedAt,
                  isViewed: post.isViewed || false,
                })
                .onConflictDoUpdate({
                  target: [schema.posts.artistId, schema.posts.postId],
                  set: {
                    previewUrl: sql.raw(
                      `CASE WHEN excluded.preview_url != '' THEN excluded.preview_url ELSE posts.preview_url END`
                    ),
                    fileUrl: sql.raw(
                      `CASE WHEN excluded.file_url != '' THEN excluded.file_url ELSE posts.file_url END`
                    ),
                    sampleUrl: sql.raw(
                      `CASE WHEN excluded.sample_url != '' THEN excluded.sample_url ELSE posts.sample_url END`
                    ),
                    tags: sql.raw(`excluded.tags`),
                    rating: sql.raw(`excluded.rating`),
                  },
                });
            }
          });
        }
        sendSuccess(request.id);
        break;
      }

      case "getPostsByArtist": {
        const { artistId, limit, offset } = PostsPayloadSchema.parse(
          request.payload
        );
        sendSuccess(
          request.id,
          await db.query.posts.findMany({
            where: eq(schema.posts.artistId, artistId),
            orderBy: [desc(schema.posts.postId)],
            limit,
            offset,
          })
        );
        break;
      }

      case "getPostsCountByArtist": {
        const { artistId } = PostsCountPayloadSchema.parse(request.payload);
        try {
          let result;
          if (artistId !== undefined) {
            result = await db
              .select({ value: count() })
              .from(schema.posts)
              .where(eq(schema.posts.artistId, artistId));
          } else {
            result = await db.select({ value: count() }).from(schema.posts);
          }
          sendSuccess(request.id, result[0]?.value ?? 0);
        } catch (error) {
          console.error("Failed to get posts count:", error);
          sendSuccess(request.id, 0);
        }
        break;
      }

      case "getArtistById": {
        const { artistId } = request.payload as { artistId: number };
        const artist = await db.query.artists.findFirst({
          where: eq(schema.artists.id, artistId),
        });
        sendSuccess(request.id, artist);
        break;
      }

      case "runDeferredMaintenance": {
        await fixDatabaseSchemaHelper(db, dbInstance);
        await repairArtistTagsHelper(dbInstance);
        sendSuccess(request.id);
        break;
      }

      case "backup": {
        if (!dbInstance || !dbPath) throw new Error("Database not initialized");
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const backupDir = path.dirname(dbPath);
        const backupFilename = `metadata-backup-${dateStr}.db`;
        const backupPath = path.join(backupDir, backupFilename);

        if (!fs.existsSync(backupDir))
          fs.mkdirSync(backupDir, { recursive: true });

        dbInstance.prepare("VACUUM INTO ?").run(backupPath);

        sendSuccess(request.id, { backupPath });
        break;
      }

      case "searchArtists": {
        const { query } = SearchPayloadSchema.parse(request.payload);
        if (query.length < 2) {
          sendSuccess(request.id, []);
          break;
        }

        const r = await db.query.artists.findMany({
          where: or(
            like(schema.artists.name, `%${query}%`),
            like(schema.artists.tag, `%${query}%`)
          ),
          limit: 20,
        });
        sendSuccess(
          request.id,
          r.map((a) => ({ id: a.id, label: a.name }))
        );
        break;
      }

      case "deleteArtist": {
        const { id } = request.payload as { id: number };
        await db.delete(schema.artists).where(eq(schema.artists.id, id));
        sendSuccess(request.id);
        break;
      }

      case "markPostAsViewed": {
        const { postId } = PostActionPayloadSchema.parse(request.payload);
        await db
          .update(schema.posts)
          .set({ isViewed: true })
          .where(eq(schema.posts.id, postId));
        sendSuccess(request.id);
        break;
      }

      case "togglePostFavorite": {
        const { postId } = PostActionPayloadSchema.parse(request.payload);
        const currentPost = await db.query.posts.findFirst({
          where: eq(schema.posts.id, postId),
          columns: { isFavorited: true },
        });

        if (!currentPost) {
          sendSuccess(request.id, false);
          break;
        }

        const newState = !currentPost.isFavorited;

        await db
          .update(schema.posts)
          .set({ isFavorited: newState })
          .where(eq(schema.posts.id, postId));

        sendSuccess(request.id, newState);
        break;
      }

      case "togglePostViewed": {
        const { postId } = PostActionPayloadSchema.parse(request.payload);
        const result = await togglePostViewed(postId);
        sendSuccess(request.id, result);
        break;
      }

      case "resetPostCache": {
        const { postId } = PostActionPayloadSchema.parse(request.payload);
        const result = db
          .update(schema.posts)
          .set({
            isViewed: false,
          })
          .where(eq(schema.posts.id, postId))
          .run();

        const success =
          result && "changes" in result ? result.changes > 0 : false;

        sendSuccess(request.id, success);
        break;
      }

      case "logout": {
        const tableInfo = dbInstance!.pragma("table_info(settings)") as Array<{
          name: string;
        }>;

        const colName = tableInfo.some((c) => c.name === "encrypted_api_key")
          ? "encrypted_api_key"
          : "api_key";

        dbInstance!
          .prepare(`UPDATE settings SET ${colName} = NULL WHERE id = 1`)
          .run();

        sendSuccess(request.id);
        break;
      }

      default:
        sendError(
          request.id,
          new Error(`Unknown request type: ${(request as any).type}`)
        );
    }
  } catch (error) {
    sendError(request.id, error);
  }
}

if (parentPort) {
  parentPort.on("message", async (msg: any) => {
    if (msg.type === "terminate") {
      dbInstance?.close();
      db = null;
      sendSuccess(msg.id);
      setTimeout(() => process.exit(0), 100);
    } else if (msg.type === "init") {
      try {
        initializeDatabase(msg.dbPath);
        sendSuccess(msg.id);
      } catch (e) {
        sendError(msg.id, e);
      }
    } else {
      await handleRequest(msg as WorkerRequest);
    }
  });
}
