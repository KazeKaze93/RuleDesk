import log from "electron-log";
import { ErrorCode } from "../../shared/types/error-codes";
import { createCodedError } from "../../shared/utils/coded-error";

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

const QUEUE_CLOSED_MESSAGE = "maintenance queue closed: quit in progress";

function createQueueClosedError(): Error {
  return createCodedError(QUEUE_CLOSED_MESSAGE, ErrorCode.CANCELLED);
}

export class MaintenanceQueue {
  private queue: Promise<unknown> = Promise.resolve();
  private isLocked = false;
  private currentJobKind: MaintenanceJobKind | null = null;
  private closed = false;

  /**
   * Stop accepting new work. Idempotent.
   * In-flight operations run to completion; queued-but-not-started jobs
   * reject when their turn begins without invoking the operation.
   */
  public close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    log.info("[MaintenanceQueue] Closed — quit in progress");
  }

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
    if (this.closed) {
      throw createQueueClosedError();
    }

    const kind = options?.kind ?? MAINTENANCE_JOB_KIND.INTERRUPTIBLE;
    const previousOperation = this.queue;

    const currentOperation: Promise<T> = previousOperation.then(async () => {
      // Closed after enqueue: reject before starting so the op never runs.
      if (this.closed) {
        throw createQueueClosedError();
      }
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.queue.then(() => undefined),
        new Promise<void>((resolve) => {
          timeoutId = setTimeout(() => {
            timedOut = true;
            resolve();
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
    return { timedOut };
  }
}

// Singleton instance
export const maintenanceQueue = new MaintenanceQueue();
