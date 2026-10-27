import log from "electron-log";

/**
 * Database Maintenance Queue
 *
 * Ensures that maintenance operations (backup, restore, close, initialize)
 * are executed sequentially to prevent race conditions and "Database is closed" errors.
 *
 * Uses a simple Promise-based queue: each operation waits for the previous one to complete.
 * The queue tail always absorbs rejection so one failure cannot poison later work;
 * callers still receive their own operation's error.
 */

/** Restore must drain without quit timeout; everything else is interruptible. */
export const MAINTENANCE_JOB_KIND = {
  RESTORE: "restore",
  INTERRUPTIBLE: "interruptible",
} as const;

export type MaintenanceJobKind =
  (typeof MAINTENANCE_JOB_KIND)[keyof typeof MAINTENANCE_JOB_KIND];

export type MaintenanceExecuteOptions = {
  kind?: MaintenanceJobKind;
};

export type WaitForCompletionResult = {
  timedOut: boolean;
};

export class MaintenanceQueue {
  private queue: Promise<unknown> = Promise.resolve();
  private isLocked = false;
  private currentJobKind: MaintenanceJobKind | null = null;

  /**
   * Execute a maintenance operation in the queue
   *
   * @param operation - Async function to execute
   * @param options - Optional job kind (default: interruptible)
   * @returns Promise that resolves when operation completes
   */
  public async execute<T>(
    operation: () => Promise<T>,
    options?: MaintenanceExecuteOptions
  ): Promise<T> {
    const kind = options?.kind ?? MAINTENANCE_JOB_KIND.INTERRUPTIBLE;
    const previousOperation = this.queue;

    const currentOperation: Promise<T> = previousOperation.then(async () => {
      this.isLocked = true;
      this.currentJobKind = kind;
      log.debug(`[MaintenanceQueue] Operation started (kind=${kind})`);
      try {
        return await operation();
      } finally {
        this.isLocked = false;
        this.currentJobKind = null;
        log.debug("[MaintenanceQueue] Operation completed");
      }
    });

    // Keep the chain alive: a rejected op must not leave `this.queue` rejected.
    this.queue = currentOperation.then(
      () => undefined,
      (error: unknown) => {
        log.error("[MaintenanceQueue] Operation failed:", error);
      }
    );

    return currentOperation;
  }

  /**
   * Check if queue is currently processing an operation
   *
   * @returns true if an operation is in progress
   */
  public isProcessing(): boolean {
    return this.isLocked;
  }

  /**
   * Kind of the operation currently running, or null when idle.
   */
  public getCurrentJobKind(): MaintenanceJobKind | null {
    return this.currentJobKind;
  }

  /**
   * Wait for all queued operations to complete.
   *
   * @param timeoutMs - Optional bound; when elapsed, returns `{ timedOut: true }`
   *   without canceling the in-flight job (caller may terminate workers).
   */
  public async waitForCompletion(
    timeoutMs?: number
  ): Promise<WaitForCompletionResult> {
    if (timeoutMs === undefined) {
      await this.queue;
      return { timedOut: false };
    }

    let timedOut = false;
    await Promise.race([
      this.queue.then(() => undefined),
      new Promise<void>((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve();
        }, timeoutMs);
      }),
    ]);
    return { timedOut };
  }
}

// Singleton instance
export const maintenanceQueue = new MaintenanceQueue();
