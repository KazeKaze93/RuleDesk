import { app } from "electron";
import Database from "better-sqlite3";
import log from "electron-log";
import { ErrorCode } from "../../shared/types/error-codes";
import { createCodedError } from "../../shared/utils/coded-error";

const MEMORY_DB_PATH = ":memory:";
const DB_REBUILD_HINT = "run npm run db:rebuild";
const PACKAGED_NATIVE_LOAD_MESSAGE =
  "The database engine failed to start. Reinstall RuleDesk or restore a working installation.";

/**
 * Minimal constructor surface for probing better-sqlite3 loadability.
 * Injected in unit tests so the real native binding is never required.
 */
export type SqliteProbeConstructor = new (filename: string) => {
  close(): void;
};

/**
 * Open an in-memory SQLite DB to verify the native binding loads before any
 * on-disk DB work (legacy migrate, mkdir, file open). Failures typically
 * include NODE_MODULE_VERSION in the message (Electron ABI mismatch).
 *
 * Does not show a dialog — callers (main.ts fatal path) surface the error.
 */
export function assertNativeSqliteLoadable(
  DatabaseCtor: SqliteProbeConstructor = Database
): void {
  let probe: { close(): void } | null = null;
  try {
    probe = new DatabaseCtor(MEMORY_DB_PATH);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : String(error);
    log.error(
      "[DB] Native better-sqlite3 module failed to load:",
      originalMessage
    );

    const message = app.isPackaged
      ? PACKAGED_NATIVE_LOAD_MESSAGE
      : `${originalMessage}. ${DB_REBUILD_HINT}`;

    throw createCodedError(message, ErrorCode.SQLITE_NATIVE_LOAD_FAILED, {
      name: "SqliteNativeLoadError",
      extra: { causeMessage: originalMessage },
    });
  } finally {
    if (probe) {
      try {
        probe.close();
      } catch (closeError) {
        log.warn("[DB] Failed to close native-module probe DB:", closeError);
      }
    }
  }
}
