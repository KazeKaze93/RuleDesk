import { app, dialog } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import log from "electron-log";
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

  // Only enable verbose SQLite logging in DEBUG mode to avoid performance issues
  // Verbose logging can generate thousands of log entries per query with joins
  const sqlite = new Database(dbPath, {
    verbose: process.env.DEBUG === "true" || process.env.DEBUG_SQLITE === "true"
      ? (message) => log.debug(`[SQLite] ${message}`)
      : undefined,
  });

  // Configure SQLite for optimal performance and data safety
  sqlite.pragma("journal_mode = WAL");
  // Performance: synchronous = NORMAL is safe and optimal for WAL mode
  // - In WAL mode, NORMAL waits for WAL file write confirmation (safe)
  // - FULL mode is overkill for WAL: it waits for both WAL AND main DB fsync (slow)
  // - For mass metadata writes (Sync All), NORMAL provides 2-3x better performance
  // - WAL mode provides crash recovery: data in WAL is automatically recovered on next startup
  // - This is metadata storage (not financial data), so NORMAL is the optimal balance
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("temp_store = MEMORY"); // Use memory for temp tables (faster)
  
  // Memory-mapped I/O: configurable size (default 64MB, can be overridden via env)
  // Lower default for weaker machines, can be increased via SQLITE_MMAP_SIZE env var
  const mmapSize = process.env.SQLITE_MMAP_SIZE
    ? parseInt(process.env.SQLITE_MMAP_SIZE, 10)
    : 67108864; // 64MB default (more conservative than 256MB)
  
  if (mmapSize > 0) {
    sqlite.pragma(`mmap_size = ${mmapSize}`);
    logger.info(`[DB] Memory-mapped I/O enabled: ${mmapSize / 1024 / 1024}MB`);
  }

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