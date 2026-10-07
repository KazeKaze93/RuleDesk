import type { Reporter } from "vitest/node";

const FORCE_EXIT_DELAY_MS = 500;

/**
 * Vitest can hang forever on open handles (HTTP servers, uncleared timers) after a
 * green suite. CI uses this reporter to exit shortly after results are final.
 */
export default class VitestForceExitReporter implements Reporter {
  onFinished(): void {
    setTimeout(() => {
      process.exit(process.exitCode ?? 0);
    }, FORCE_EXIT_DELAY_MS).unref();
  }
}
