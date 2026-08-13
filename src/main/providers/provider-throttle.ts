const DEFAULT_MIN_INTERVAL_MS = 1200;
const DEFAULT_JITTER_MS = 400;

/** Max time a user-priority waiter may block on a closed 429 gate before failing. */
export const USER_GATE_WAIT_CEILING_MS = 30_000;

/** Fallback gate duration when notifyRateLimited is called without Retry-After. */
export const DEFAULT_RATE_LIMIT_GATE_MS = 5_000;

export type ThrottlePriority = "user" | "background";

const SHARED_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.119 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.118 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.6; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.155 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
];

export class ProviderRateLimitGateError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(
      `Provider rate-limit gate is closed (retry after ${retryAfterMs}ms)`
    );
    this.name = "ProviderRateLimitGateError";
    this.retryAfterMs = retryAfterMs;
  }
}

type QueuedWaiter = {
  priority: ThrottlePriority;
  resolve: () => void;
  reject: (error: unknown) => void;
};

export function createAbortError(
  message = "The operation was aborted."
): Error {
  if (typeof DOMException === "function") {
    return new DOMException(message, "AbortError");
  }
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

export function isAbortError(error: unknown): boolean {
  if (typeof DOMException === "function" && error instanceof DOMException) {
    return error.name === "AbortError";
  }
  return error instanceof Error && error.name === "AbortError";
}

type ProviderThrottleOptions = {
  userGateWaitCeilingMs?: number;
  defaultRateLimitGateMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Serializing request throttle with two FIFO priorities and a shared 429 gate.
 * All consumers of one provider host must share one instance.
 */
export class ProviderThrottle {
  private lastRequestAt = 0;
  private rateLimitedUntilMs = 0;
  private pumping = false;
  private readonly userQueue: QueuedWaiter[] = [];
  private readonly backgroundQueue: QueuedWaiter[] = [];
  private readonly minIntervalMs: number;
  private readonly jitterMs: number;
  private readonly userGateWaitCeilingMs: number;
  private readonly defaultRateLimitGateMs: number;

  constructor(
    minIntervalMs = DEFAULT_MIN_INTERVAL_MS,
    jitterMs = DEFAULT_JITTER_MS,
    options: ProviderThrottleOptions = {}
  ) {
    this.minIntervalMs = minIntervalMs;
    this.jitterMs = jitterMs;
    this.userGateWaitCeilingMs =
      options.userGateWaitCeilingMs ?? USER_GATE_WAIT_CEILING_MS;
    this.defaultRateLimitGateMs =
      options.defaultRateLimitGateMs ?? DEFAULT_RATE_LIMIT_GATE_MS;
  }

  /** Record a 429 from any consumer so every waiter sees the same host gate. */
  notifyRateLimited(retryAfterMs?: number): void {
    const delayMs =
      retryAfterMs !== undefined && retryAfterMs > 0
        ? retryAfterMs
        : this.defaultRateLimitGateMs;
    this.rateLimitedUntilMs = Math.max(
      this.rateLimitedUntilMs,
      Date.now() + delayMs
    );
  }

  isRateLimited(): boolean {
    return this.getRateLimitedRemainingMs() > 0;
  }

  getRateLimitedRemainingMs(): number {
    return Math.max(0, this.rateLimitedUntilMs - Date.now());
  }

  /** Test-only: clear the shared gate without reconstructing the throttle. */
  resetRateLimitGateForTests(): void {
    this.rateLimitedUntilMs = 0;
  }

  /**
   * Acquire the next request slot.
   * `user` is drained before `background`. Priority is required (no silent default).
   * Optional `signal` removes the waiter from the queue without consuming a paced slot
   * (a slot already inside `acquireSlot` still completes for whoever remains).
   */
  async wait(priority: ThrottlePriority, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw createAbortError();
    }
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const waiter: QueuedWaiter = {
        priority,
        resolve: () => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          resolve();
        },
        reject: (error: unknown) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          reject(error);
        },
      };
      const onAbort = () => {
        this.removeWaiter(waiter);
        waiter.reject(createAbortError());
      };
      const cleanup = () => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
      };
      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }
      if (priority === "user") {
        this.userQueue.push(waiter);
      } else {
        this.backgroundQueue.push(waiter);
      }
      void this.pump();
    });
  }

  private removeWaiter(waiter: QueuedWaiter): void {
    const queue =
      waiter.priority === "user" ? this.userQueue : this.backgroundQueue;
    const index = queue.indexOf(waiter);
    if (index >= 0) {
      queue.splice(index, 1);
    }
  }

  private dequeue(): QueuedWaiter | undefined {
    return this.userQueue.shift() ?? this.backgroundQueue.shift();
  }

  private dequeueMatching(priority: ThrottlePriority): QueuedWaiter | undefined {
    if (priority === "user") {
      return this.userQueue.shift();
    }
    return this.backgroundQueue.shift();
  }

  private async pump(): Promise<void> {
    if (this.pumping) {
      return;
    }
    this.pumping = true;
    try {
      while (this.userQueue.length > 0 || this.backgroundQueue.length > 0) {
        // Plan gate policy from current head, but re-check queues after the wait
        // so a user arriving during a background interval sleep still wins the slot.
        const plannedPriority: ThrottlePriority =
          this.userQueue.length > 0 ? "user" : "background";
        try {
          await this.acquireSlot(plannedPriority);
        } catch (error) {
          const failed = this.dequeueMatching(plannedPriority);
          if (failed) {
            failed.reject(error);
          }
          continue;
        }
        const waiter = this.dequeue();
        if (!waiter) {
          break;
        }
        waiter.resolve();
      }
    } finally {
      this.pumping = false;
      if (this.userQueue.length > 0 || this.backgroundQueue.length > 0) {
        void this.pump();
      }
    }
  }

  private async acquireSlot(priority: ThrottlePriority): Promise<void> {
    const remainingMs = this.getRateLimitedRemainingMs();
    if (remainingMs > 0) {
      if (priority === "background") {
        throw new ProviderRateLimitGateError(remainingMs);
      }
      const waitMs = Math.min(remainingMs, this.userGateWaitCeilingMs);
      await sleep(waitMs);
      const stillLimitedMs = this.getRateLimitedRemainingMs();
      if (stillLimitedMs > 0) {
        throw new ProviderRateLimitGateError(stillLimitedMs);
      }
    }

    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    const jitter = Math.random() * this.jitterMs;
    const requiredWait = this.minIntervalMs + jitter - elapsed;
    if (requiredWait > 0) {
      await sleep(requiredWait);
    }
    this.lastRequestAt = Date.now();
  }
}

export function pickRandomUA(): string {
  return SHARED_USER_AGENTS[
    Math.floor(Math.random() * SHARED_USER_AGENTS.length)
  ];
}
