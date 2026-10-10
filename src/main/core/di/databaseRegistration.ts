import log from "electron-log";
import { getDb } from "../../db/client";
import { container, DI_TOKENS } from "./Container";

type DatabaseReopenedListener = () => void;

const databaseReopenedListeners = new Set<DatabaseReopenedListener>();

/**
 * Subscribe to DB reopen after restore / VACUUM reinit.
 * Controllers refresh schema existence caches here — those caches are invalid
 * once the underlying sqlite connection is replaced.
 */
export function onDatabaseReopened(
  listener: DatabaseReopenedListener
): () => void {
  databaseReopenedListeners.add(listener);
  return () => {
    databaseReopenedListeners.delete(listener);
  };
}

/**
 * Re-bind DI DB token and notify subscribers after initializeDatabase().
 * Called from restore and VACUUM completion paths (not on first app boot —
 * controllers initialize caches in setup() after the first register).
 */
export function registerDatabaseInContainerAfterReinit(): void {
  container.register(DI_TOKENS.DB, getDb());
  for (const listener of databaseReopenedListeners) {
    try {
      listener();
    } catch (error) {
      log.error("[DB] Database-reopened listener failed:", error);
    }
  }
}

/** Test-only reset of module-level listener set. */
export function resetDatabaseReopenedListenersForTests(): void {
  databaseReopenedListeners.clear();
}
