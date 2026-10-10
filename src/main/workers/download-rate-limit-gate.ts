import { download429PauseMs } from "@shared/utils/download-failure";

/**
 * Global 429 gate for mass download: while paused, lanes must not take new
 * queue items. In-flight requests may still finish; retries wait for open.
 */
export class DownloadRateLimitGate {
  private openAtMs = 0;
  private waveIndex = 0;

  get blockedUntilMs(): number {
    return this.openAtMs;
  }

  isPaused(nowMs: number = Date.now()): boolean {
    return nowMs < this.openAtMs;
  }

  /**
   * Extends the pause using max(current openAt, now + pauseMs).
   * Returns the pause duration applied for this call.
   */
  schedulePause(params: {
    baseDelayMs: number;
    retryAfterMs?: number;
    nowMs?: number;
  }): number {
    const nowMs = params.nowMs ?? Date.now();
    const pauseMs = download429PauseMs({
      attemptIndex: this.waveIndex,
      baseDelayMs: params.baseDelayMs,
      retryAfterMs: params.retryAfterMs,
    });
    this.waveIndex += 1;
    this.openAtMs = Math.max(this.openAtMs, nowMs + pauseMs);
    return pauseMs;
  }

  async waitUntilOpen(
    isAborted: () => boolean,
    sleep: (ms: number) => Promise<void>,
    nowFn: () => number = Date.now
  ): Promise<void> {
    while (!isAborted()) {
      const remaining = this.openAtMs - nowFn();
      if (remaining <= 0) {
        return;
      }
      await sleep(Math.min(50, remaining));
    }
  }
}
