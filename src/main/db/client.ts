import { app, dialog } from "electron";
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

export async function initializeDatabase(): Promise<AppDatabase> {
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
    // Run migrations asynchronously to avoid blocking the event loop
    // Use setImmediate to yield control and allow UI to update
    await new Promise<void>((resolve, reject) => {
      setImmediate(() => {
        try {
          // dbInstance is guaranteed to be non-null here (created above)
          if (!dbInstance) {
            throw new Error("Database instance is null");
          }
          migrate(dbInstance, { migrationsFolder });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
    logger.info("[DB] Migrations complete.");
  } catch (e) {
    logger.error("[DB] Migration failed:", e);
    
    // Show error dialog to user in production (critical error)
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorDetails = `Database migration failed. The application cannot start.\n\nError: ${errorMessage}\n\nPlease check the logs for more details.`;
    
    // Use showErrorBox for synchronous display (works even if app is crashing)
    dialog.showErrorBox(
      "Database Migration Error",
      errorDetails
    );
    
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