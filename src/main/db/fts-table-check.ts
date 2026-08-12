import type Database from "better-sqlite3";
import log from "electron-log";

type SqliteDatabase = InstanceType<typeof Database>;

const POSTS_FTS_EXISTS_SQL =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='posts_fts'";

/**
 * Schema introspection: posts_fts is a virtual table; no Drizzle equivalent.
 * Failures return false so callers can fall back (LIKE / empty smart-playlist).
 */
export function postsFtsTableExists(sqlite: SqliteDatabase): boolean {
  try {
    const stmt = sqlite.prepare<[], { name: string }>(POSTS_FTS_EXISTS_SQL);
    const result = stmt.get();
    const exists = !!result;
    log.info(`[FTS] posts_fts table check: ${exists}`);
    return exists;
  } catch (error) {
    log.warn("[FTS] Failed to check posts_fts table existence:", error);
    return false;
  }
}
