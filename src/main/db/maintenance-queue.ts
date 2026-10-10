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
export class MaintenanceQueue {
  private queue: Promise<unknown> = Promise.resolve();
  private isLocked = false;

  /**
   * Execute a maintenance operation in the queue
   *
   * @param operation - Async function to execute
   * @returns Promise that resolves when operation completes
   */
  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    const previousOperation = this.queue;

    const currentOperation: Promise<T> = previousOperation.then(async () => {
      this.isLocked = true;
      log.debug("[MaintenanceQueue] Operation started");
      try {
        return await operation();
      } finally {
        this.isLocked = false;
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
   * Wait for all queued operations to complete
   *
   * @returns Promise that resolves when queue is empty
   */
  public async waitForCompletion(): Promise<void> {
    await this.queue;
  }
}

// Singleton instance
export const maintenanceQueue = new MaintenanceQueue();
