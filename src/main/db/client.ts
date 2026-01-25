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
  // CRITICAL: Set busyTimeout to handle SQLITE_BUSY errors from concurrent transactions
  // Default timeout: 5000ms (5 seconds) - prevents race conditions in shadowInsertPost
  // If two processes try to insert the same post simultaneously, SQLite will wait up to 5s
  // instead of immediately throwing SQLITE_BUSY
  const sqlite = new Database(dbPath, {
    verbose: process.env.DEBUG === "true" || process.env.DEBUG_SQLITE === "true"
      ? (message) => log.debug(`[SQLite] ${message}`)
      : undefined,
    timeout: 5000, // 5 seconds timeout for SQLITE_BUSY (concurrent access)
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
    
    // Check post count before migration to warn about potential Main Process lock
    // Migration 0006_add_fts5_search.sql performs INSERT INTO posts_fts SELECT ...
    // This can block Main Process for 30+ seconds on databases with 500k+ records
    try {
      const postCount = sqlite
        .prepare("SELECT COUNT(*) as count FROM posts")
        .get() as { count: number } | undefined;
      
      const count = postCount?.count ?? 0;
      
      if (count > 100000) {
        logger.warn(
          `[DB] Large database detected: ${count.toLocaleString()} posts. ` +
          `FTS5 migration may take 10-30 seconds and temporarily block Main Process. ` +
          `Please wait...`
        );
      } else if (count > 50000) {
        logger.info(
          `[DB] Medium database: ${count.toLocaleString()} posts. ` +
          `FTS5 migration may take 5-10 seconds.`
        );
      } else {
        logger.info(`[DB] Database size: ${count.toLocaleString()} posts.`);
      }
    } catch (_countError) {
      // Table might not exist yet (first migration), ignore count check
      logger.debug("[DB] Could not check post count (table may not exist yet)");
    }
    
    // Run migrations asynchronously to avoid blocking the event loop
    // Use setImmediate to yield control and allow UI to update
    await new Promise<void>((resolve, reject) => {
      setImmediate(() => {
        try {
          // dbInstance is guaranteed to be non-null here (created above)
          if (!dbInstance || !sqliteInstance) {
            throw new Error("Database instance is null");
          }
          
          // Handle migration 0004 specially - it tries to add columns that may already exist
          // This happens when database is created from schema (migration 0000) which already includes these columns
          // We need to manually execute migrations to handle duplicate column errors gracefully
          const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
          let migrationEntries: Array<{ tag: string }> = [];
          
          try {
            const journalContent = fs.readFileSync(journalPath, "utf-8");
            const journal = JSON.parse(journalContent);
            migrationEntries = journal.entries || [];
          } catch (_journalError) {
            // If journal doesn't exist, use standard migrate
            logger.warn("[DB] Could not read migration journal, using standard migrate");
            migrate(dbInstance, { migrationsFolder });
            resolve();
            return;
          }
          
          // Create __drizzle_migrations table if it doesn't exist
          sqliteInstance.exec(`
            CREATE TABLE IF NOT EXISTS __drizzle_migrations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              hash text NOT NULL,
              created_at bigint
            );
          `);
          
          // Execute migrations manually, handling duplicate column errors
          for (const entry of migrationEntries) {
            const migrationFile = path.join(migrationsFolder, `${entry.tag}.sql`);
            
            if (!fs.existsSync(migrationFile)) {
              logger.warn(`[DB] Migration file not found: ${migrationFile}`);
              continue;
            }
            
            // Check if migration was already executed
            const existing = sqliteInstance
              .prepare("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
              .get(entry.tag);
            if (existing) {
              logger.debug(`[DB] Migration ${entry.tag} already executed, skipping...`);
              continue;
            }
            
            try {
              const migrationSQL = fs.readFileSync(migrationFile, "utf-8");
              
              // Handle migration 0004 specially - check if columns exist before adding
              if (entry.tag === "0004_exotic_misty_knight") {
                const tableInfo = sqliteInstance
                  .prepare("PRAGMA table_info(settings)")
                  .all() as Array<{ name: string }>;
                const columnNames = tableInfo.map((col) => col.name);
                
                // Only execute ALTER TABLE if columns don't exist
                const needsIsAdultVerified = !columnNames.includes("is_adult_verified");
                const needsTosAcceptedAt = !columnNames.includes("tos_accepted_at");
                
                if (needsIsAdultVerified) {
                  sqliteInstance.exec(
                    "ALTER TABLE settings ADD COLUMN is_adult_verified integer DEFAULT 0 NOT NULL;"
                  );
                  logger.debug("[DB] Added is_adult_verified column");
                }
                if (needsTosAcceptedAt) {
                  sqliteInstance.exec("ALTER TABLE settings ADD COLUMN tos_accepted_at integer;");
                  logger.debug("[DB] Added tos_accepted_at column");
                }
                
                // Mark migration as executed
                sqliteInstance
                  .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
                  .run(entry.tag, Date.now());
              } else if (entry.tag === "0010_add_fts5_cache_invalidation") {
                // Handle migration 0010 specially - it tries to create triggers on FTS5 virtual table
                // SQLite doesn't allow triggers on virtual tables in some configurations
                // Create the cache invalidation table but skip triggers if they fail
                try {
                  // Create the cache invalidation table (this part works)
                  sqliteInstance.exec(`
                    CREATE TABLE IF NOT EXISTS fts5_cache_invalidation (
                      id INTEGER PRIMARY KEY CHECK (id = 1),
                      invalidated_at INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
                    );
                  `);
                  
                  // Initialize the single row if it doesn't exist
                  sqliteInstance.exec(`
                    INSERT OR IGNORE INTO fts5_cache_invalidation (id, invalidated_at) 
                    VALUES (1, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));
                  `);
                  
                  // Try to create triggers, but don't fail if they can't be created
                  // Triggers on FTS5 virtual tables may not be supported in all SQLite configurations
                  try {
                    sqliteInstance.exec(`
                      CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_insert 
                      AFTER INSERT ON posts_fts BEGIN
                        UPDATE fts5_cache_invalidation 
                        SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
                        WHERE id = 1;
                      END;
                    `);
                    sqliteInstance.exec(`
                      CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_update 
                      AFTER UPDATE ON posts_fts BEGIN
                        UPDATE fts5_cache_invalidation 
                        SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
                        WHERE id = 1;
                      END;
                    `);
                    sqliteInstance.exec(`
                      CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_delete 
                      AFTER DELETE ON posts_fts BEGIN
                        UPDATE fts5_cache_invalidation 
                        SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
                        WHERE id = 1;
                      END;
                    `);
                    logger.debug("[DB] Created FTS5 cache invalidation triggers");
                  } catch (triggerError) {
                    // Triggers on virtual tables may not be supported - log and continue
                    logger.warn(
                      `[DB] Could not create FTS5 triggers (may not be supported): ${triggerError instanceof Error ? triggerError.message : String(triggerError)}`
                    );
                  }
                  
                  // Mark migration as executed
                  sqliteInstance
                    .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
                    .run(entry.tag, Date.now());
                } catch (error) {
                  // If table creation fails, log and mark as executed anyway
                  // The triggers are not critical for basic functionality
                  logger.warn(
                    `[DB] Migration ${entry.tag} partially failed (triggers skipped): ${error instanceof Error ? error.message : String(error)}`
                  );
                  try {
                    sqliteInstance
                      .prepare(
                        "INSERT OR IGNORE INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)"
                      )
                      .run(entry.tag, Date.now());
                  } catch {
                    // Ignore errors when marking
                  }
                }
              } else if (entry.tag === "0011_add_fts5_count_meta") {
                // Handle migration 0011 specially - it tries to create triggers on FTS5 virtual table
                // SQLite doesn't allow triggers on virtual tables in some configurations
                // Create the count meta table but skip triggers if they fail
                try {
                  // Create the count meta table (this part works)
                  sqliteInstance.exec(`
                    CREATE TABLE IF NOT EXISTS fts5_count_meta (
                      id INTEGER PRIMARY KEY CHECK (id = 1),
                      count INTEGER NOT NULL DEFAULT 0
                    );
                  `);
                  
                  // Initialize the single row with count from posts_fts (if table exists)
                  try {
                    const countResult = sqliteInstance
                      .prepare("SELECT COUNT(*) as count FROM posts_fts")
                      .get() as { count: number } | undefined;
                    const count = countResult?.count ?? 0;
                    sqliteInstance.exec(`
                      INSERT OR IGNORE INTO fts5_count_meta (id, count) 
                      VALUES (1, ${count});
                    `);
                  } catch {
                    // If posts_fts doesn't exist yet, initialize with 0
                    sqliteInstance.exec(
                      "INSERT OR IGNORE INTO fts5_count_meta (id, count) VALUES (1, 0);"
                    );
                  }
                  
                  // Try to create triggers, but don't fail if they can't be created
                  try {
                    sqliteInstance.exec(`
                      CREATE TRIGGER IF NOT EXISTS fts5_count_increment_insert 
                      AFTER INSERT ON posts_fts BEGIN
                        UPDATE fts5_count_meta 
                        SET count = count + 1
                        WHERE id = 1;
                      END;
                    `);
                    sqliteInstance.exec(`
                      CREATE TRIGGER IF NOT EXISTS fts5_count_decrement_delete 
                      AFTER DELETE ON posts_fts BEGIN
                        UPDATE fts5_count_meta 
                        SET count = count - 1
                        WHERE id = 1;
                      END;
                    `);
                    logger.debug("[DB] Created FTS5 count meta triggers");
                  } catch (triggerError) {
                    // Triggers on virtual tables may not be supported - log and continue
                    logger.warn(
                      `[DB] Could not create FTS5 count triggers (may not be supported): ${triggerError instanceof Error ? triggerError.message : String(triggerError)}`
                    );
                  }
                  
                  // Mark migration as executed
                  sqliteInstance
                    .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
                    .run(entry.tag, Date.now());
                } catch (error) {
                  // If table creation fails, log and mark as executed anyway
                  logger.warn(
                    `[DB] Migration ${entry.tag} partially failed (triggers skipped): ${error instanceof Error ? error.message : String(error)}`
                  );
                  try {
                    sqliteInstance
                      .prepare(
                        "INSERT OR IGNORE INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)"
                      )
                      .run(entry.tag, Date.now());
                  } catch {
                    // Ignore errors when marking
                  }
                }
              } else {
                // Execute other migrations normally
                sqliteInstance.exec(migrationSQL);
                
                // Mark migration as executed
                sqliteInstance
                  .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
                  .run(entry.tag, Date.now());
              }
            } catch (migrationError: unknown) {
              const error = migrationError as Error & { code?: string; message?: string };
              const errorMessage = error.message || String(error);
              const errorCode = error.code || "";
              
              // If it's a duplicate column error, log and mark as executed
              if (errorCode === "SQLITE_ERROR" && errorMessage.includes("duplicate column")) {
                logger.warn(
                  `[DB] Migration ${entry.tag} attempted to add duplicate column. Skipping...`
                );
                // Mark as executed anyway to prevent retry
                try {
                  sqliteInstance
                    .prepare(
                      "INSERT OR IGNORE INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)"
                    )
                    .run(entry.tag, Date.now());
                } catch {
                  // Ignore errors when marking
                }
              } else if (
                errorCode === "SQLITE_ERROR" &&
                errorMessage.includes("cannot create triggers on virtual tables")
              ) {
                // Migration 0010 tries to create triggers on FTS5 virtual table, which may not be supported
                // This is expected in some configurations - skip trigger creation but mark migration as executed
                logger.warn(
                  `[DB] Migration ${entry.tag} attempted to create triggers on virtual table. Skipping triggers...`
                );
                // Mark as executed anyway to prevent retry
                try {
                  sqliteInstance
                    .prepare(
                      "INSERT OR IGNORE INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)"
                    )
                    .run(entry.tag, Date.now());
                } catch {
                  // Ignore errors when marking
                }
              } else {
                // For other errors, throw
                logger.error(`[DB] Migration ${entry.tag} failed:`, errorMessage);
                throw migrationError;
              }
            }
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
    logger.info("[DB] Migrations complete.");
    
    // FTS5 table creation is handled by migration 0006_add_fts5_search.sql
    // Do NOT create FTS5 tables here - this causes split-brain state if migration fails
    // If FTS5 table doesn't exist after migrations, it's a migration failure that should be fixed
    // by fixing the migration, not by creating it in code
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