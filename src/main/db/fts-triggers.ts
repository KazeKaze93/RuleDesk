import type Database from "better-sqlite3";
import { logger } from "../lib/logger";

/** Runtime-droppable during initial sync bulk insert; restored by ensureFtsTriggers. */
export const POSTS_FTS_INSERT_TRIGGER_NAME = "posts_fts_insert";
export const FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME =
  "fts5_cache_invalidate_insert";

/**
 * DDL copied verbatim from drizzle/0006_add_fts5_search.sql and
 * drizzle/0010_add_fts5_cache_invalidation.sql — do not rewrite.
 */
export const RUNTIME_DROPPABLE_FTS_TRIGGERS = [
  {
    name: POSTS_FTS_INSERT_TRIGGER_NAME,
    // From drizzle/0006_add_fts5_search.sql
    ddl: `CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;`,
  },
  {
    name: FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME,
    // From drizzle/0010_add_fts5_cache_invalidation.sql
    ddl: `CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_insert 
AFTER INSERT ON posts_fts BEGIN
  UPDATE fts5_cache_invalidation 
  SET invalidated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
  WHERE id = 1;
END;`,
  },
] as const;

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Drop FTS insert triggers that would fire per-row during bulk initial sync.
 */
export function dropFtsTriggersForBulkInsert(sqlite: SqliteDatabase): void {
  for (const trigger of RUNTIME_DROPPABLE_FTS_TRIGGERS) {
    sqlite.exec(`DROP TRIGGER IF EXISTS ${trigger.name};`);
  }
}

/**
 * Ensure runtime-droppable FTS triggers exist (idempotent).
 * Returns names that were missing and successfully recreated.
 *
 * Note: some SQLite builds reject triggers on FTS5 virtual tables
 * (`cannot create triggers on virtual tables`). That failure is soft-logged
 * so posts_fts_insert recovery is never blocked.
 */
export function ensureFtsTriggers(sqlite: SqliteDatabase): {
  recreated: string[];
} {
  const recreated: string[] = [];
  const existingStmt = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = ?"
  );

  for (const trigger of RUNTIME_DROPPABLE_FTS_TRIGGERS) {
    const existing = existingStmt.get(trigger.name);
    if (existing) {
      continue;
    }

    try {
      sqlite.exec(trigger.ddl);
      recreated.push(trigger.name);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("cannot create triggers on virtual tables")) {
        logger.warn(
          `[DB] Could not recreate ${trigger.name} (${errorMessage})`
        );
        continue;
      }
      throw error;
    }
  }

  return { recreated };
}
