import { app } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { logger } from "../lib/logger";

type AppDatabase = BetterSQLite3Database<typeof schema>;

let dbInstance: AppDatabase | null = null;
let sqliteInstance: InstanceType<typeof Database> | null = null;

export function initializeDatabase() {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(app.getPath("userData"), "metadata.db");
  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, "drizzle")
    : path.join(__dirname, "../../drizzle");

  logger.info(`[DB] Initializing at: ${dbPath}`);

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbPath, {
    verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
  });

  sqlite.pragma("journal_mode = WAL");

  sqliteInstance = sqlite;
  dbInstance = drizzle(sqlite, { schema }) as AppDatabase;

  try {
    logger.info("[DB] Running migrations...");
    migrate(dbInstance, { migrationsFolder });
    logger.info("[DB] Migrations complete.");
  } catch (e) {
    logger.error("[DB] Migration failed:", e);
    throw e;
  }

  return dbInstance;
}

export function getDb(): AppDatabase {
  if (!dbInstance) {
    throw new Error(
      "[DB] Database not initialized! Call initializeDatabase() first."
    );
  }
  return dbInstance;
}

export function getSqliteInstance(): InstanceType<typeof Database> {
  if (!sqliteInstance) {
    throw new Error(
      "[DB] Database not initialized! Call initializeDatabase() first."
    );
  }
  return sqliteInstance;
}

export function closeDatabase(): void {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
    logger.info("[DB] Database closed.");
  }
}