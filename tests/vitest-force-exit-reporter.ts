import type { Reporter, TestModule } from "vitest/node";

/** Allow default reporter summary + pipe flush before hard exit (Windows spawnSync). */
const FORCE_EXIT_DELAY_MS = 1500;

/**
 * Vitest can hang forever on open handles after (or while draining) a suite.
 * CI registers this reporter so we exit shortly after the run reports finished.
 */
export default class VitestForceExitReporter implements Reporter {
  private exitScheduled = false;

  private scheduleExit(code: number): void {
    if (this.exitScheduled) {
      return;
    }
    this.exitScheduled = true;
    setTimeout(() => {
      process.exit(code);
    }, FORCE_EXIT_DELAY_MS);
  }

  onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _unhandledErrors: ReadonlyArray<unknown>,
    reason?: unknown
  ): void {
    const code =
      reason === "failed" || reason === "interrupted" || reason === "error"
        ? 1
        : (process.exitCode ?? 0);
    this.scheduleExit(code);
  }

  onFinished(): void {
    this.scheduleExit(process.exitCode ?? 0);
  }
}
