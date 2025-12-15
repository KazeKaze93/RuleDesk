/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Database Worker Thread
 * Handles all database operations in a separate thread
 */

import { parentPort } from "worker_threads";
import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { NewArtist } from "./schema";
import { eq, asc, desc, sql, like, or } from "drizzle-orm";
import type { WorkerRequest, WorkerResponse } from "./worker-types";
import * as path from "path";
import * as fs from "fs";
import { logger } from "../lib/logger";

if (logger && logger.transports && logger.transports.file) {
  logger.transports.file.level = false;
}

type DbType = BetterSQLite3Database<typeof schema>;

let db: DbType | null = null;
let dbInstance: Database.Database | null = null;
let dbPath: string | null = null;

interface RawSettingsRow {
  user_id: string;
  api_key?: string;
  encrypted_api_key?: string;
}

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

    // Schema Auto-fix
    try {
      const tableInfo = dbInstance.pragma("table_info(settings)") as Array<{
        name: string;
      }>;
      const hasApiKey = tableInfo.some((c) => c.name === "api_key");
      const hasEncryptedKey = tableInfo.some(
        (c) => c.name === "encrypted_api_key"
      );

      if (hasApiKey && !hasEncryptedKey) {
        dbInstance.exec(
          "ALTER TABLE settings RENAME COLUMN api_key TO encrypted_api_key"
        );
        logger.info("DbService: Migrated column api_key -> encrypted_api_key");
      }
    } catch (e) {
      logger.warn("DbService: Schema auto-fix skipped", e);
    }
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
    if (!row) return null;
    return {
      userId: row.user_id,
      encryptedApiKey: row.encrypted_api_key || row.api_key,
    };
  } catch {
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
      case "getApiKeyDecrypted":
      case "getSettings": {
        const settings = getSettingsRaw(dbInstance);
        sendSuccess(request.id, {
          userId: settings?.userId || "",
          apiKey: settings?.encryptedApiKey || "",
        });
        break;
      }

      case "saveSettings": {
        const { userId, apiKey } = request.payload as {
          userId: string;
          apiKey: string;
        };
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
              .run(userId, apiKey);
          } else {
            dbInstance!
              .prepare(
                `INSERT INTO settings (id, user_id, ${colName}) VALUES (1, ?, ?)`
              )
              .run(userId, apiKey);
          }
        })();
        sendSuccess(request.id);
        break;
      }

      // ... Остальные методы (getTrackedArtists и т.д.) оставляем как были
      // (Я их сократил для чтения, но в реальном файле они должны быть)
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
          request.payload as any;
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
        const { posts } = request.payload as any;
        if (posts.length > 0) {
          await db.transaction(async (tx) => {
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
        sendSuccess(request.id);
        break;
      }

      case "getPostsByArtist": {
        const {
          artistId: aId,
          limit = 1000,
          offset = 0,
        } = request.payload as any;
        sendSuccess(
          request.id,
          await db.query.posts.findMany({
            where: eq(schema.posts.artistId, aId),
            orderBy: [desc(schema.posts.postId)],
            limit,
            offset,
          })
        );
        break;
      }

      case "getArtistById": {
        const { artistId } = request.payload as any;
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
        const escapedPath = backupPath.replace(/'/g, "''");
        dbInstance.exec(`VACUUM INTO '${escapedPath}'`);
        sendSuccess(request.id, { backupPath });
        break;
      }

      case "searchArtists": {
        const { query } = request.payload as any;
        if (!query || query.length < 2) {
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
        const { postId } = request.payload as { postId: number };
        await db
          .update(schema.posts)
          .set({ isViewed: true })
          .where(eq(schema.posts.id, postId));
        sendSuccess(request.id);
        break;
      }

      case "getSettingsStatus": {
        const row = getSettingsRaw(dbInstance);
        sendSuccess(request.id, {
          hasApiKey: !!row?.encryptedApiKey,
          userId: row?.userId || "",
        });
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
