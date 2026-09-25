import { app, dialog } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import log from "electron-log";
import * as schema from "./schema";
import { logger } from "../lib/logger";
import { getDatabasePaths, getLegacyDatabasePaths, getLegacyNeutralUserDataDir, DB_FILE_NAME, LEGACY_NEUTRAL_USER_DATA_DIR_NAME } from "./paths";
import { SQLITE_BUSY_TIMEOUT_MS } from "../config/constants";
import { ensureFtsTriggers, rebuildFtsIndex } from "./fts-triggers";
import {
  assertNoUnknownMigrationHashes,
  createPreMigrationSnapshot,
  deletePreMigrationSnapshot,
  ensureDrizzleMigrationsTable,
  hasPendingMigrations,
  readMigrationJournal,
  runManualMigrations,
  stampUserVersion,
} from "./migration-runner";
import { migrateLegacyDatabase } from "./legacy-database-migrate";

type AppDatabase = BetterSQLite3Database<typeof schema>;

let dbInstance: AppDatabase | null = null;
let sqliteInstance: InstanceType<typeof Database> | null = null;

/**
 * Hard-kill mid-sync can leave artists.sync_status = 'syncing' forever.
 * Reset only that in-flight flag. Do not touch error / lastError / lastSyncIncomplete.
 */
export function resetStaleSyncingArtists(
  sqlite: InstanceType<typeof Database>
): number {
  const result = sqlite
    .prepare(
      "UPDATE artists SET sync_status = 'idle' WHERE sync_status = 'syncing'"
    )
    .run();
  if (result.changes > 0) {
    logger.info(
      `[DB] Reset ${result.changes} artist(s) stuck in syncing after hard interrupt`
    );
  }
  return result.changes;
}

/**
 * After hard-kill mid-initial-sync left runtime FTS triggers dropped:
 * backfill missing posts_fts rows so MATCH sees real index data.
 */
function recoverAfterRecreatedFtsTriggers(
  sqlite: InstanceType<typeof Database>,
  recreated: string[]
): void {
  logger.warn(
    `[DB] Missing FTS trigger(s) recreated after hard interrupt: ${recreated.join(", ")}`
  );

  try {
    rebuildFtsIndex(sqlite);
    logger.info("[DB] FTS index rebuilt after restoring runtime-dropped triggers");
  } catch (error) {
    logger.warn("[DB] FTS rebuild failed", error);
  }
}

async function migrateLegacyDatabaseIfNeeded(newDbPath: string): Promise<void> {
  const legacyCandidates = getLegacyDatabasePaths().map((legacyPath) => ({
    userDataDirName: legacyPath.userDataDirName,
    userDataDir: legacyPath.userDataDir,
    dbPath: legacyPath.dbPath,
  }));
  const result = await migrateLegacyDatabase({ newDbPath, legacyCandidates });
  if (result.blockedLegacyPath) {
    // Refuse to open/create an empty DB at newDbPath — that would look
    // "initialized" on the next launch and permanently orphan the legacy file.
    throw new Error(
      `Found a previous RuleDesk database at ${result.blockedLegacyPath}, but could not move it ` +
        `(the file may be locked, in use, or corrupted). Close any program that might be using ` +
        `that file and restart RuleDesk. Your data was left in place; RuleDesk did not create ` +
        `an empty replacement database.`
    );
  }
}

/**
 * Move live `data.bin` (+ wal/shm) from legacy `.rdcache` into the current userData
 * (`RuleDesk-Data`). Reuses the same checkpoint / EXDEV / stub-protection path as
 * the Electron-default → data.bin migrate above.
 */
async function migrateRdcacheDatabaseIfNeeded(newDbPath: string): Promise<void> {
  const rdcacheDir = getLegacyNeutralUserDataDir();
  const result = await migrateLegacyDatabase({
    newDbPath,
    legacyCandidates: [
      {
        userDataDirName: LEGACY_NEUTRAL_USER_DATA_DIR_NAME,
        userDataDir: rdcacheDir,
        dbPath: path.join(rdcacheDir, DB_FILE_NAME),
      },
    ],
  });
  if (result.blockedLegacyPath) {
    throw new Error(
      `Found a previous RuleDesk database at ${result.blockedLegacyPath}, but could not move it ` +
        `(the file may be locked, in use, or corrupted). Close any program that might be using ` +
        `that file and restart RuleDesk. Your data was left in place; RuleDesk did not create ` +
        `an empty replacement database.`
    );
  }
}

export async function initializeDatabase(): Promise<AppDatabase> {
  if (dbInstance) return dbInstance;

  const { dbPath } = getDatabasePaths();
  await migrateLegacyDatabaseIfNeeded(dbPath);
  await migrateRdcacheDatabaseIfNeeded(dbPath);
  
  // Determine migrations folder path - handle test environment correctly
  // In test mode, migrations are in project root (not packaged)
  const isTestMode = process.env.NODE_ENV === "test";
  const isDev = process.env.NODE_ENV === "development";
  
  // In test mode, ensure database is created in the unique tempDir provided by test runner
  // This avoids 'busy' or 'locked' errors from parallel runs
  if (isTestMode) {
    const userDataPath = app.getPath("userData");
    logger.info(`[DB] Test mode: Using userData path: ${userDataPath}`);
    logger.info(`[DB] Test mode: Database will be created at: ${dbPath}`);
    // Verify that userData path is a temp directory (should contain 'ruledesk-e2e' or similar)
    if (!userDataPath.includes('ruledesk-e2e') && !userDataPath.includes('tmp')) {
      logger.warn(`[DB] Test mode: userData path doesn't look like a temp directory: ${userDataPath}`);
    }
  }
  
  let migrationsFolder: string;
  if (app.isPackaged && !isTestMode) {
    // Production: migrations are in resources folder
    migrationsFolder = path.join(process.resourcesPath, "drizzle");
  } else {
    // Development or test: migrations are in project root
    // Use __dirname to resolve relative to this file's location
    migrationsFolder = path.join(__dirname, "../../drizzle");
  }
  
  // Ensure migrations folder exists and is accessible
  if (!fs.existsSync(migrationsFolder)) {
    const errorMsg = `Migrations folder not found: ${migrationsFolder}. Current working directory: ${process.cwd()}, __dirname: ${__dirname}`;
    logger.error(`[DB] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  logger.info(`[DB] Initializing at: ${dbPath}`);
  logger.info(`[DB] Migrations folder: ${migrationsFolder} (test mode: ${isTestMode}, dev: ${isDev}, packaged: ${app.isPackaged})`);

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
    timeout: SQLITE_BUSY_TIMEOUT_MS,
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
  // boundary: better-sqlite3 raw row — drizzle() generic schema typing to AppDatabase
  // eslint-disable-next-line no-restricted-syntax -- boundary: better-sqlite3 / drizzle instance typing
  dbInstance = drizzle(sqlite, { schema }) as AppDatabase;

  let preMigrationSnapshotPath: string | null = null;
  let stampedMigrationCount: number | null = null;

  try {
    logger.info("[DB] Running migrations...");
    
    // Check post count before migration to warn about potential Main Process lock
    // Migration 0006_add_fts5_search.sql performs INSERT INTO posts_fts SELECT ...
    // This can block Main Process for 30+ seconds on databases with 500k+ records
    try {
      // boundary: better-sqlite3 raw row — prepare().get() row typing
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
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

          const migrationEntries = readMigrationJournal(migrationsFolder);
          if (!migrationEntries) {
            logger.warn("[DB] Could not read migration journal, using standard migrate");
            migrate(dbInstance, { migrationsFolder });
            resolve();
            return;
          }

          ensureDrizzleMigrationsTable(sqliteInstance);

          // Refuse DBs stamped by a newer app (unknown journal hashes) before
          // any snapshot or migration writes.
          assertNoUnknownMigrationHashes(sqliteInstance, migrationEntries);

          // Snapshot only on upgrade (existing migration history + pending tags).
          // Fresh install: empty __drizzle_migrations → no snapshot.
          if (hasPendingMigrations(sqliteInstance, migrationEntries)) {
            const vacuumStartedAt = Date.now();
            preMigrationSnapshotPath = createPreMigrationSnapshot(
              sqliteInstance,
              dbPath
            );
            const vacuumMs = Date.now() - vacuumStartedAt;
            logger.info(`[DB] Pre-migration VACUUM INTO took ${vacuumMs}ms`);
          }

          runManualMigrations(sqliteInstance, migrationsFolder, migrationEntries);
          stampedMigrationCount = migrationEntries.length;
          
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
    const { recreated } = ensureFtsTriggers(sqlite);
    if (recreated.length > 0) {
      recoverAfterRecreatedFtsTriggers(sqlite, recreated);
    }
    resetStaleSyncingArtists(sqlite);

    // Informational only — not used for downgrade/upgrade decisions.
    if (stampedMigrationCount !== null) {
      stampUserVersion(sqlite, stampedMigrationCount);
    }

    // Delete snapshot only after the full successful init path (migrations + FTS + reset).
    // On any throw above, catch must leave the snapshot on disk.
    if (preMigrationSnapshotPath) {
      deletePreMigrationSnapshot(preMigrationSnapshotPath);
      preMigrationSnapshotPath = null;
    }
  } catch (e) {
    logger.error("[DB] Migration failed:", e);
    
    // Don't show error dialog in headless/test mode (blocks process in CI)
    const isHeadless = process.env.NODE_ENV === "test" || process.env.CI === "true" || !process.env.DISPLAY;
    
    if (!isHeadless) {
      // Show error dialog to user in production (critical error)
      const errorMessage = e instanceof Error ? e.message : String(e);
      const errorDetails = `Database migration failed. The application cannot start.\n\nError: ${errorMessage}\n\nPlease check the logs for more details.`;
      
      // Use showErrorBox for synchronous display (works even if app is crashing)
      dialog.showErrorBox(
        "Database Migration Error",
        errorDetails
      );
    }
    
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
  // Idempotent: safe when already closed (before-quit + tray Quit, or repeated quit paths)
  if (!sqliteInstance) {
    return;
  }
  sqliteInstance.close();
  sqliteInstance = null;
  dbInstance = null;
  logger.info("[DB] Database closed.");
}

export { getDatabasePaths };