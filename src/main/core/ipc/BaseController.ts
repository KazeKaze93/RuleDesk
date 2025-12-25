import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';
import { z } from 'zod';

/**
 * Base Controller for IPC Handlers
 * 
 * Provides centralized error handling, input validation, and abstracts direct ipcMain dependency.
 * All IPC controllers should extend this class.
 * 
 * Usage:
 * ```ts
 * class UserController extends BaseController {
 *   setup() {
 *     this.handle(
 *       'user:get',
 *       z.tuple([z.number().int().positive()]),
 *       this.getUser.bind(this)
 *     );
 *   }
 *   
 *   private async getUser(event: IpcMainInvokeEvent, id: number) {
 *     // Business logic here - id is guaranteed to be valid
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
   * Protected helper to register IPC handlers with centralized error handling and input validation
   * 
   * @param channel - IPC channel name (e.g., 'user:get')
   * @param schema - Zod schema for validating handler arguments (must be a tuple)
   * @param handler - Async handler function with validated, typed arguments
   * 
   * Note: TypeScript has limitations with tuple unpacking in rest parameters.
   * The handler signature should match the tuple structure, e.g.:
   * - For `z.tuple([z.object({...})])` use `(event, params: {...}) => ...`
   * - For `z.tuple([z.number()])` use `(event, id: number) => ...`
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected handle<T extends z.ZodTuple<any, any>>(
    channel: string,
    schema: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<unknown>
  ): void {
    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      try {
        log.info(`[IPC] Incoming request: ${channel}`);

        // Validate input arguments using Zod schema
        let validatedArgs: z.infer<T>;
        try {
          validatedArgs = schema.parse(args) as z.infer<T>;
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            const errorMessage = `Validation Error: ${validationError.errors.map((e) => e.message).join(', ')}`;
            log.error(`[IPC] Validation failed for channel "${channel}":`, {
              errors: validationError.errors,
              args: this.sanitizeArgs(args),
            });
            throw {
              message: errorMessage,
              stack: validationError.stack,
              name: 'ValidationError',
              originalError: String(validationError),
            };
          }
          // Re-throw if it's not a ZodError
          throw validationError;
        }

        // Call handler with validated arguments
        // TypeScript limitation: we need to cast here as tuple unpacking is not inferred
        // Using unknown[] is safer than any, but we still need runtime validation (which Zod provides)
        const result = await (handler as (
          event: IpcMainInvokeEvent,
          ...args: unknown[]
        ) => Promise<unknown>)(event, ...(validatedArgs as unknown[]));
        log.info(`[IPC] Request completed: ${channel}`);
        return result;
      } catch (error: unknown) {
        // Skip error handling if it's already a serialized validation error
        if (
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'ValidationError'
        ) {
          throw error;
        }

        // Log the full error details for debugging
        log.error(`[IPC] Error in channel "${channel}":`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          args: this.sanitizeArgs(args),
        });

        // Electron IPC quirk: pure Error objects don't serialize well via invoke
        // Serialize error to plain object to preserve stack trace and message
        if (error instanceof Error) {
          throw {
            message: error.message || 'Unknown IPC error',
            stack: error.stack,
            name: error.name,
            originalError: String(error),
          };
        }

        // For non-Error objects, wrap in serializable format
        throw {
          message: String(error) || 'Unknown IPC error',
          stack: undefined,
          name: 'Error',
          originalError: error,
        };
      }
    });

    log.info(`[IPC] Handler registered: ${channel} (with validation)`);
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

