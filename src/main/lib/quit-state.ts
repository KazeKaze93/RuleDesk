/**
 * Process-wide quit flag for Main-process services.
 *
 * Set at the start of `before-quit` (before download/sync/maintenance drain).
 * Services that close+reopen SQLite must skip `initializeDatabase()` when this
 * is true so quit is not racing a reopen after `closeDatabase()`.
 *
 * Must not import `main.ts` — this module is the shared signal.
 */

let quitRequested = false;

export function setQuitRequested(): void {
  quitRequested = true;
}

export function isQuitRequested(): boolean {
  return quitRequested;
}

/** Test-only: reset between cases. Do not call from production paths. */
export function resetQuitRequestedForTests(): void {
  quitRequested = false;
}
