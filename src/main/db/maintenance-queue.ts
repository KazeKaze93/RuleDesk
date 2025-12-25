import log from "electron-log";

/**
 * Database Maintenance Queue
 *
 * Ensures that maintenance operations (backup, restore, close, initialize)
 * are executed sequentially to prevent race conditions and "Database is closed" errors.
 *
 * Uses a simple Promise-based queue: each operation waits for the previous one to complete.
 */
class MaintenanceQueue {
  private queue: Promise<unknown> = Promise.resolve();
  private isLocked = false;

  /**
   * Execute a maintenance operation in the queue
   *
   * @param operation - Async function to execute
   * @returns Promise that resolves when operation completes
   */
  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Add operation to queue
    const previousOperation = this.queue;
    
    // Create new promise that waits for previous operation and then executes current one
    const currentOperation = previousOperation
      .then(async () => {
        this.isLocked = true;
        log.debug("[MaintenanceQueue] Operation started");
        try {
          const result = await operation();
          return result;
        } finally {
          this.isLocked = false;
          log.debug("[MaintenanceQueue] Operation completed");
        }
      })
      .catch((error) => {
        this.isLocked = false;
        log.error("[MaintenanceQueue] Operation failed:", error);
        throw error;
      });

    // Update queue to include current operation
    this.queue = currentOperation;

    return currentOperation as Promise<T>;
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

