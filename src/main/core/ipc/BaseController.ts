import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';
import { z } from 'zod';
import type { SerializableError, ValidationError } from '../../types/ipc';

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
   * Type-safe handler signature: The handler receives validated arguments based on the Zod schema.
   * TypeScript infers the correct types from the schema, ensuring type safety without using 'any'.
   */
  protected handle<
    TSchema extends z.ZodTuple<[z.ZodTypeAny, ...z.ZodTypeAny[]] | [], z.ZodTypeAny | null>,
    TInferred extends z.infer<TSchema>
  >(
    channel: string,
    schema: TSchema,
    handler: (
      event: IpcMainInvokeEvent,
      ...args: TInferred extends readonly [infer First, ...infer Rest]
        ? [First, ...Rest]
        : TInferred extends readonly []
        ? []
        : never
    ) => Promise<unknown>
  ): void {
    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      try {
        log.info(`[IPC] Incoming request: ${channel}`);

        // Validate input arguments using Zod schema
        let validatedArgs: TInferred;
        try {
          validatedArgs = schema.parse(args) as TInferred;
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            const errorMessage = `Validation Error: ${validationError.errors.map((e) => e.message).join(', ')}`;
            log.error(`[IPC] Validation failed for channel "${channel}":`, {
              errors: validationError.errors,
              args: this.sanitizeArgs(args),
            });
            
            // Create serializable validation error
            const serializedError: ValidationError = {
              message: errorMessage,
              stack: validationError.stack,
              name: 'ValidationError',
              originalError: String(validationError),
              errors: validationError.errors.map((e) => ({
                path: e.path,
                message: e.message,
                code: e.code,
              })),
            };
            throw serializedError;
          }
          // Re-throw if it's not a ZodError
          throw validationError;
        }

        // Call handler with validated arguments
        // TypeScript limitation: tuple unpacking in rest parameters requires type assertion
        // Runtime validation via Zod ensures type safety, so this is safe
        const result = await handler(
          event,
          ...(validatedArgs as unknown as TInferred extends readonly [infer First, ...infer Rest]
            ? [First, ...Rest]
            : TInferred extends readonly []
            ? []
            : never)
        );
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
          // Already serialized, ensure it's properly structured
          throw error as ValidationError;
        }

        // Log the full error details for debugging
        log.error(`[IPC] Error in channel "${channel}":`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          args: this.sanitizeArgs(args),
        });

        // Electron IPC quirk: pure Error objects don't serialize well via invoke
        // Serialize error to plain object to preserve stack trace and message
        const serializedError: SerializableError = error instanceof Error
          ? {
              message: error.message || 'Unknown IPC error',
              stack: error.stack,
              name: error.name,
              originalError: String(error),
            }
          : {
              message: String(error) || 'Unknown IPC error',
              stack: undefined,
              name: 'Error',
              originalError: String(error),
            };
        
        throw serializedError;
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
    return args.map((arg) => {
      // Mask strings that might contain sensitive data
      if (typeof arg === 'string') {
        // Mask file paths (may contain username, sensitive directories)
        if (/^[A-Za-z]:[\\/]|^\/|^~/.test(arg)) {
          // Extract just filename or last segment, mask full path
          const segments = arg.split(/[\\/]/);
          const lastSegment = segments[segments.length - 1];
          return `<path:${lastSegment || 'root'}>`;
        }
        
        // Mask tokens and keys (any length if they match patterns)
        if (
          /(password|token|key|secret|api[_-]?key|auth|credential)/i.test(arg) ||
          /^[A-Za-z0-9+/]{32,}={0,2}$/.test(arg) || // Base64-like strings (32+ chars)
          /^[a-f0-9]{32,}$/i.test(arg) // Hex strings (likely hashes/tokens)
        ) {
          return '<masked>';
        }
        
        // Mask long strings (likely tokens, keys, etc.)
        if (arg.length > 50) {
          return `<string:${arg.length}chars>`;
        }
        
        return arg;
      }
      
      // Mask objects that might contain sensitive data
      if (typeof arg === 'object' && arg !== null) {
        if (Array.isArray(arg)) {
          return arg.map((item) => this.sanitizeArgs([item])[0]);
        }
        
        // Check for sensitive keys in objects
        const sensitiveKeys = /(password|token|key|secret|api[_-]?key|auth|credential|path|file|dir)/i;
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(arg)) {
          if (sensitiveKeys.test(key)) {
            sanitized[key] = '<masked>';
          } else if (typeof value === 'string') {
            // Recursively sanitize string values
            const sanitizedValue = this.sanitizeArgs([value])[0];
            sanitized[key] = sanitizedValue;
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      }
      
      return arg;
    });
  }
}

