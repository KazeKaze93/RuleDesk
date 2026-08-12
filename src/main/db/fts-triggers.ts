import type Database from "better-sqlite3";

/** Runtime-droppable during initial sync bulk insert; restored by ensureFtsTriggers. */
export const POSTS_FTS_INSERT_TRIGGER_NAME = "posts_fts_insert";
export const FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME =
  "fts5_cache_invalidate_insert";

/** Units: ms via julianday epoch formula — matches migration 0010 / 0032. */
const INVALIDATED_AT_NOW_SQL =
  "CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)";

/**
 * DDL for triggers dropped during initial sync.
 * posts_fts_insert: verbatim from drizzle/0006_add_fts5_search.sql
 * fts5_cache_invalidate_insert: from drizzle/0032_fix_fts5_cache_invalidation.sql (ON posts)
 */
export const RUNTIME_DROPPABLE_FTS_TRIGGERS = [
  {
    name: POSTS_FTS_INSERT_TRIGGER_NAME,
    ddl: `CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;`,
  },
  {
    name: FTS5_CACHE_INVALIDATE_INSERT_TRIGGER_NAME,
    ddl: `CREATE TRIGGER IF NOT EXISTS fts5_cache_invalidate_insert
AFTER INSERT ON posts BEGIN
  UPDATE fts5_cache_invalidation
  SET invalidated_at = ${INVALIDATED_AT_NOW_SQL}
  WHERE id = 1;
END;`,
  },
] as const;

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Ensure the singleton stamp row exists. UPDATE triggers are no-ops without it.
 * Does not overwrite an existing stamp (INSERT OR IGNORE).
 */
export function ensureFtsCacheInvalidationRow(sqlite: SqliteDatabase): void {
  sqlite.exec(`
    INSERT OR IGNORE INTO fts5_cache_invalidation (id, invalidated_at)
    VALUES (1, ${INVALIDATED_AT_NOW_SQL});
  `);
}

/** Bump invalidated_at so in-memory FTS count caches see a change. */
export function bumpFtsCacheInvalidationStamp(sqlite: SqliteDatabase): void {
  sqlite.exec(`
    UPDATE fts5_cache_invalidation
    SET invalidated_at = ${INVALIDATED_AT_NOW_SQL}
    WHERE id = 1;
  `);
}

/**
 * Drop FTS insert / invalidate-insert triggers that would fire per-row
 * during bulk initial sync.
 */
export function dropFtsTriggersForBulkInsert(sqlite: SqliteDatabase): void {
  for (const trigger of RUNTIME_DROPPABLE_FTS_TRIGGERS) {
    sqlite.exec(`DROP TRIGGER IF EXISTS ${trigger.name};`);
  }
}

/**
 * Ensure runtime-droppable FTS triggers exist (idempotent).
 * Returns names that were missing and recreated.
 * No try/catch: DDL failures must abort loudly.
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
    sqlite.exec(trigger.ddl);
    recreated.push(trigger.name);
  }

  return { recreated };
}
