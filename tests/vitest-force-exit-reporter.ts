import type { Reporter, TestModule } from "vitest/node";

const FORCE_EXIT_DELAY_MS = 250;

/**
 * Vitest can hang forever on open handles after (or while draining) a suite.
 * CI registers this reporter so we exit shortly after the run reports finished.
 */
export default class VitestForceExitReporter implements Reporter {
  onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _unhandledErrors: ReadonlyArray<unknown>,
    reason?: unknown
  ): void {
    const code =
      reason === "failed" || reason === "interrupted" || reason === "error"
        ? 1
        : (process.exitCode ?? 0);
    setTimeout(() => {
      process.exit(code);
    }, FORCE_EXIT_DELAY_MS);
  }

  onFinished(): void {
    setTimeout(() => {
      process.exit(process.exitCode ?? 0);
    }, FORCE_EXIT_DELAY_MS);
  }
}
