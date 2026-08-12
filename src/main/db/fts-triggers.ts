import type Database from "better-sqlite3";

/** Runtime-droppable during initial sync / repair bulk upsert; restored by ensureFtsTriggers. */
export const POSTS_FTS_INSERT_TRIGGER_NAME = "posts_fts_insert";
export const POSTS_FTS_UPDATE_TRIGGER_NAME = "posts_fts_update";

/**
 * DDL for triggers dropped during bulk sync upsert.
 *
 * - posts_fts_insert: perf (per-row FTS insert during large initial sync).
 * - posts_fts_update: correctness — while insert is dropped, conflict
 *   `ON CONFLICT DO UPDATE SET tags` would fire the update trigger's
 *   FTS5 `'delete'` command on a never-indexed rowid, which corrupts the
 *   VTAB (SQLITE_CORRUPT_VTAB) on better-sqlite3 12.5.0 / SQLite 3.51.1.
 *
 * posts_fts_delete stays live (bulk sync does not delete posts).
 * Verbatim trigger bodies match drizzle/0006 insert + drizzle/0033 update.
 */
export const RUNTIME_DROPPABLE_FTS_TRIGGERS = [
  {
    name: POSTS_FTS_INSERT_TRIGGER_NAME,
    ddl: `CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;`,
  },
  {
    name: POSTS_FTS_UPDATE_TRIGGER_NAME,
    ddl: `CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE OF tags ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, tags) VALUES('delete', old.id, old.tags);
  INSERT INTO posts_fts(rowid, tags) VALUES (new.id, new.tags);
END;`,
  },
] as const;

type SqliteDatabase = InstanceType<typeof Database>;

/**
 * Drop FTS insert/update triggers that would fire per-row during bulk
 * initial sync or repair upsert.
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
