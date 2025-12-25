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
   * Accepts either:
   * - z.tuple([...]) for multiple arguments or empty tuple
   * - Single Zod schema (object, string, etc.) which will be auto-wrapped in tuple
   * 
   * ⚠️ IMPORTANT: Schema must match the exact number of arguments expected.
   * If handler expects 1 object, schema must be a single object schema (not tuple).
   * If handler expects multiple args, schema must be a tuple.
   * 
   * @param channel - IPC channel name (e.g., 'user:get')
   * @param schema - Zod schema for validating handler arguments (tuple or single schema)
   * @param handler - Async handler function with validated, typed arguments
   */
  protected handle(
    channel: string,
    schema: z.ZodTuple<[z.ZodTypeAny, ...z.ZodTypeAny[]] | [], z.ZodTypeAny | null> | z.ZodTypeAny,
    handler: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => Promise<unknown>
  ): void {
    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      try {
        // Security: Log only channel name and argument count, not actual arguments
        // This prevents leaking user data, file paths, or other sensitive information
        log.info(`[IPC] Incoming request: ${channel} (${args.length} arg${args.length !== 1 ? 's' : ''})`);

        // Determine if schema is a tuple
        const isTuple = schema instanceof z.ZodTuple;
        
        // Strict validation: Check argument count BEFORE parsing
        // This prevents silent failures when Renderer sends wrong number of arguments
        if (isTuple) {
          // Access items length safely - ZodTuple.items is a readonly array
          // Use type assertion to access items.length (Zod's internal structure)
          // @ts-expect-error - ZodTuple.items is readonly array, but we need to check length
          const tupleSchema = schema as z.ZodTuple<readonly z.ZodTypeAny[], z.ZodTypeAny | null>;
          const expectedCount = (tupleSchema as unknown as { items: readonly z.ZodTypeAny[] }).items.length;
          if (args.length !== expectedCount) {
            const errorMessage = `Argument count mismatch: expected ${expectedCount}, got ${args.length}`;
            // Security: Log only error details, not sanitized args (may still leak info)
            log.error(`[IPC] Validation failed for channel "${channel}": ${errorMessage}`, {
              expected: expectedCount,
              received: args.length,
            });
            
            const serializedError: ValidationError = {
              message: errorMessage,
              stack: undefined,
              name: 'ValidationError',
              originalError: undefined,
              errors: [{
                path: [],
                message: errorMessage,
                code: 'custom',
              }],
            };
            throw serializedError;
          }
        } else {
          // Single schema: must receive exactly 1 argument
          if (args.length !== 1) {
            const errorMessage = `Argument count mismatch: expected 1 (single object/primitive), got ${args.length}`;
            // Security: Log only error details, not sanitized args (may still leak info)
            log.error(`[IPC] Validation failed for channel "${channel}": ${errorMessage}`, {
              expected: 1,
              received: args.length,
            });
            
            const serializedError: ValidationError = {
              message: errorMessage,
              stack: undefined,
              name: 'ValidationError',
              originalError: undefined,
              errors: [{
                path: [],
                message: errorMessage,
                code: 'custom',
              }],
            };
            throw serializedError;
          }
        }

        // Normalize schema: if single ZodType (not tuple), wrap in tuple for validation
        const normalizedSchema = isTuple
          ? schema
          : z.tuple([schema as z.ZodTypeAny]);

        // Validate input arguments using normalized schema
        let validatedArgs: unknown[];
        try {
          validatedArgs = normalizedSchema.parse(args) as unknown[];
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            const errorMessage = `Validation Error: ${validationError.errors.map((e) => e.message).join(', ')}`;
            // Security: Log only validation errors (paths and messages), not actual argument values
            log.error(`[IPC] Validation failed for channel "${channel}":`, {
              errors: validationError.errors.map((e) => ({
                path: e.path,
                message: e.message,
                code: e.code,
              })),
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
        // Unpack tuple: if single arg was wrapped, unwrap it; otherwise spread tuple
        const handlerArgs = isTuple
          ? validatedArgs
          : [validatedArgs[0]];
        
        const result = await handler(event, ...handlerArgs);
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

        // Log error details for debugging (without sensitive argument data)
        log.error(`[IPC] Error in channel "${channel}":`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          // Security: Do not log args - they may contain sensitive data even after sanitization
        });

        // Electron IPC quirk: pure Error objects don't serialize well via invoke
        // Serialize error to plain object, but hide sensitive details in production
        const isProduction = process.env.NODE_ENV === 'production';
        
        const serializedError: SerializableError = error instanceof Error
          ? {
              message: error.message || 'Unknown IPC error',
              // Hide stack trace in production (potential security leak - file paths, structure)
              stack: isProduction ? undefined : error.stack,
              name: error.name,
              // Hide originalError in production (may contain system details)
              originalError: isProduction ? undefined : String(error),
            }
          : {
              message: String(error) || 'Unknown IPC error',
              stack: undefined,
              name: 'Error',
              originalError: isProduction ? undefined : String(error),
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
        // Mask file paths (preserve path structure, mask only username)
        if (/^[A-Za-z]:[\\/]|^\/|^~/.test(arg)) {
          // Preserve path for debugging, but mask username
          // Windows: C:\Users\Username\... -> C:\Users\<user>\...
          // Unix: /home/username/... -> /home/<user>/...
          // This allows debugging file operations while protecting user identity
          const maskedPath = arg
            // Windows user path: C:\Users\Username\... -> C:\Users\<user>\...
            .replace(/^([A-Za-z]:[\\/]Users[\\/])([^\\/]+)([\\/])/i, '$1<user>$3')
            // Unix home path: /home/username/... -> /home/<user>/...
            .replace(/^(\/home\/)([^/]+)(\/)/, '$1<user>$3')
            // Tilde expansion: ~username/... -> ~<user>/...
            .replace(/^(~)([^/\\]+)([/\\])/, '$1<user>$3')
            // Generic user directory patterns
            .replace(/\/(Users|home)\/([^/\\]+)([/\\])/gi, '/$1/<user>$3');
          
          return maskedPath;
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
        
        // Comprehensive list of sensitive keys to mask
        // Includes variations: apiKey, api_key, api-key, encryptedApiKey, etc.
        const sensitiveKeyPattern = /^(password|token|key|secret|api[_-]?key|encrypted[_-]?api[_-]?key|auth|credential|access[_-]?token|refresh[_-]?token|bearer|authorization)$/i;
        
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(arg)) {
          // Check if key matches sensitive patterns
          if (sensitiveKeyPattern.test(key)) {
            // Always mask sensitive keys, regardless of value type
            sanitized[key] = '<masked>';
          } else if (typeof value === 'string' && value.length > 0) {
            // Recursively sanitize string values (may contain nested sensitive data)
            const sanitizedValue = this.sanitizeArgs([value])[0];
            sanitized[key] = sanitizedValue;
          } else if (typeof value === 'object' && value !== null) {
            // Recursively sanitize nested objects and arrays
            sanitized[key] = this.sanitizeArgs([value])[0];
          } else {
            // Pass through primitives and null
            sanitized[key] = value;
          }
        }
        return sanitized;
      }
      
      return arg;
    });
  }
}

