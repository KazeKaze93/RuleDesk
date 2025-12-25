import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';

/**
 * Base Controller for IPC Handlers
 * 
 * Provides centralized error handling and abstracts direct ipcMain dependency.
 * All IPC controllers should extend this class.
 * 
 * Usage:
 * ```ts
 * class UserController extends BaseController {
 *   setup() {
 *     this.handle('user:get', this.getUser.bind(this));
 *   }
 *   
 *   private async getUser(event: IpcMainInvokeEvent, id: string) {
 *     // Business logic here
 *   }
 * }
 * ```
 */
export abstract class BaseController {
  /**
   * Setup method must be implemented by all controllers
   * Register IPC handlers here using this.handle()
   */
  public abstract setup(): void;

  /**
   * Protected helper to register IPC handlers with centralized error handling
   * 
   * @param channel - IPC channel name (e.g., 'user:get')
   * @param handler - Async handler function
   */
  protected handle(
    channel: string,
    handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
  ): void {
    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      try {
        log.info(`[IPC] Incoming request: ${channel}`);
        const result = await handler(event, ...args);
        log.info(`[IPC] Request completed: ${channel}`);
        return result;
      } catch (error) {
        // Log the full error details for debugging
        log.error(`[IPC] Error in channel "${channel}":`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          args: this.sanitizeArgs(args),
        });

        // Re-throw the error so renderer can handle it
        // Note: Only error.message will be serialized across IPC boundary
        throw error;
      }
    });

    log.info(`[IPC] Handler registered: ${channel}`);
  }

  /**
   * Remove handler for a specific channel
   * Useful for cleanup or hot-reload scenarios
   * 
   * @param channel - IPC channel name
   */
  protected removeHandler(channel: string): void {
    ipcMain.removeHandler(channel);
    log.info(`[IPC] Handler removed: ${channel}`);
  }

  /**
   * Sanitize arguments for logging (prevent logging sensitive data)
   * Override this method in subclasses if needed
   * 
   * @param args - Handler arguments
   * @returns Sanitized args safe for logging
   */
  protected sanitizeArgs(args: unknown[]): unknown[] {
    // Default implementation: just return args
    // Override in subclasses to mask passwords, tokens, etc.
    return args;
  }
}

