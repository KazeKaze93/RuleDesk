import { ipcMain, type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z, type ZodErrorMap } from "zod";
import type { SerializableError, ValidationError } from "../../types/ipc";
import { ErrorCode } from "../../types/ipc";

/**
 * Custom Zod error map that sanitizes error messages to prevent leaking sensitive data
 * 
 * SECURITY: Never includes actual values in error messages.
 * Instead of "Expected string, received 12345", returns "Expected string, received <value>"
 * 
 * This is more robust than regex replacement because it prevents values from appearing
 * in error messages at the source, rather than sanitizing them after the fact.
 */
const sanitizedErrorMap: ZodErrorMap = (_issue, ctx) => {
  const defaultMessage = ctx.defaultError;
  
  // SECURITY: Replace any value patterns in default messages
  // Patterns like "received 12345", "Expected number, received string", etc.
  const sanitized = defaultMessage.replace(/received\s+[^\s,;]+/gi, "received <value>");
  
  return { message: sanitized };
};

// Set global Zod error map for all schemas used in IPC validation
// This ensures consistent sanitization across all BaseController validations
z.setErrorMap(sanitizedErrorMap);

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

  // Throttling: Track last call time per channel to prevent DoS attacks
  // Map<channel, lastCallTimestamp>
  private static readonly throttleMap = new Map<string, number>();

  // Request Collapsing: For idempotent handlers, reuse in-flight Promise to prevent duplicate work
  // Map<key, { promise: Promise<unknown>, createdAt: number, timeoutId: NodeJS.Timeout }>
  // CRITICAL: Key must include args hash, otherwise getUser(1) and getUser(2) would share Promise
  // MEMORY LEAK PREVENTION: Each promise has its own setTimeout to ensure cleanup even if IPC stops
  private static readonly requestCollapseMap = new Map<
    string,
    { 
      promise: Promise<unknown>; 
      createdAt: number;
      timeoutId: NodeJS.Timeout; // Individual timeout for each promise
    }
  >();
  
  // Timeout for request collapsing: remove stuck promises after 30 seconds
  // If handler hangs (infinite await, deadlock), promise will be removed to prevent memory leak
  private static readonly REQUEST_COLLAPSE_TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Generate stable key for Request Collapsing from channel + args
   * PERFORMANCE: Uses only critical identifiers (id, type) instead of full serialization
   * This prevents Main Process blocking on large objects (e.g., 20k+ post arrays)
   * 
   * CRITICAL: Returns null if args cannot be safely collapsed (prevents data leakage)
   * If two different calls with different complex objects get same key, they would share Promise
   * 
   * Strategy:
   * - Empty args: use channel only
   * - Single arg with id/type: use those fields
   * - Arrays: use length + first element id (if available)
   * - Complex objects without id/type: return null (disable collapsing)
   * 
   * @returns Collapse key string, or null if collapsing is unsafe
   */
  private static getCollapseKey(channel: string, args: unknown[]): string | null {
    // Empty args - most common case (e.g., getSettings)
    if (args.length === 0) {
      return channel;
    }

    // Single argument - extract id or type if available
    if (args.length === 1) {
      const arg = args[0];
      if (arg === null || arg === undefined) {
        return `${channel}:null`;
      }
      
      // Check for common identifier fields
      if (typeof arg === "object" && arg !== null) {
        const obj = arg as Record<string, unknown>;
        if ("id" in obj && typeof obj.id === "number") {
          return `${channel}:id=${obj.id}`;
        }
        if ("type" in obj && typeof obj.type === "string") {
          return `${channel}:type=${obj.type}`;
        }
        // CRITICAL: Do NOT return default key for complex objects
        // Returning ":complex" would cause data leakage - different objects would share Promise
        // Disable collapsing for complex objects without id/type
        log.warn(
          `[IPC] Complex argument object for idempotent channel "${channel}" without id/type. ` +
          `Request Collapsing disabled to prevent data leakage. Consider using non-idempotent handler or pass hash from Renderer.`
        );
        return null; // Disable collapsing - prevents data leakage
      }
      
      // Primitive values
      const argString = String(arg);
      
      // CRITICAL: Hash long arguments to prevent data leakage in static map
      // Simple rule: hash everything longer than 16 characters
      // No guessing about "sensitive data" - just hash long strings
      // This prevents tokens, long tags, or other long data from being stored in memory forever
      // PERFORMANCE: Use fast non-cryptographic hash (djb2) instead of SHA-256
      // djb2 is O(n) but much faster and sufficient for collision-resistant key generation
      if (argString.length > 16) {
        const hash = this.fastHash(argString);
        return `${channel}:hash=${hash}`;
      }
      
      return `${channel}:${argString}`;
    }

    // Multiple arguments - use first arg id + count
    const firstArg = args[0];
    if (
      typeof firstArg === "object" &&
      firstArg !== null &&
      "id" in firstArg &&
      typeof (firstArg as Record<string, unknown>).id === "number"
    ) {
      return `${channel}:id=${(firstArg as Record<string, unknown>).id}:count=${args.length}`;
    }

    // CRITICAL: Do NOT return default key for multiple args without IDs
    // Returning ":multi:count=N" would cause data leakage - different arg sets would share Promise
    log.warn(
      `[IPC] Multiple arguments for idempotent channel "${channel}" without id/type. ` +
      `Request Collapsing disabled to prevent data leakage. Consider using non-idempotent handler.`
    );
    return null; // Disable collapsing - prevents data leakage
  }

  /**
   * Fast non-cryptographic hash (djb2 algorithm)
   * Used for hashing IPC keys to prevent data leakage without blocking Main Process
   * 
   * PERFORMANCE: O(n) time complexity, much faster than SHA-256
   * Collision resistance is sufficient for IPC key generation (not security-critical)
   * 
   * @param str - String to hash
   * @returns 16-character hex hash
   */
  private static fastHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      // Convert to 32-bit integer (prevent overflow)
      hash = hash & hash;
    }
    // Convert to positive hex string and take first 16 chars
    return Math.abs(hash).toString(16).substring(0, 16);
  }

  // Minimum time between calls for the same channel (milliseconds)
  // Prevents renderer from spamming IPC calls
  private static readonly THROTTLE_MS = 100; // 100ms = max 10 calls per second per channel

  // TTL for throttle map entries (1 hour) - prevents memory leak from dynamic channel names
  private static readonly THROTTLE_TTL_MS = 60 * 60 * 1000; // 1 hour

  // Cleanup interval: cleanup throttle map every N calls to prevent memory leak
  // Use counter instead of random to ensure predictable cleanup behavior
  // Reduced from 1000 to 200 to prevent map bloat with dynamic channels
  private static readonly CLEANUP_INTERVAL_CALLS = 200; // Cleanup every 200 calls
  private static callCount = 0; // Counter for tracking IPC calls

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
   * ⚠️ SECURITY: Automatically removes existing handler before registration to prevent
   * "Attempted to register a second handler" errors that would crash the Main process.
   * This allows safe re-initialization (e.g., hot-reload, error recovery).
   *
   * ⚠️ TYPE SAFETY: Handler function signature is automatically compatible with BaseController.
   * No need for `as` type assertions - TypeScript will infer correct types from method signature.
   *
   * @param channel - IPC channel name (e.g., 'user:get')
   * @param schema - Zod schema for validating handler arguments (tuple or single schema)
   * @param handler - Async handler function with validated, typed arguments
   * @param options - Optional configuration (e.g., isIdempotent for cached/idempotent handlers)
   */
  protected handle(
    channel: string,
    schema:
      | z.ZodTuple<[z.ZodTypeAny, ...z.ZodTypeAny[]] | [], z.ZodTypeAny | null>
      | z.ZodTypeAny,
    handler: (
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) => Promise<unknown>,
    options?: { isIdempotent?: boolean }
  ): void {
    // Critical: Remove existing handler to prevent "duplicate handler" crash
    // This allows safe re-initialization (hot-reload, error recovery, etc.)
    try {
      ipcMain.removeHandler(channel);
      log.debug(`[IPC] Removed existing handler for channel: ${channel}`);
    } catch {
      // Handler doesn't exist yet, which is fine
      log.debug(`[IPC] No existing handler to remove for channel: ${channel}`);
    }

    ipcMain.handle(
      channel,
      async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
        try {
          // Throttling: Prevent DoS attacks by limiting call frequency per channel
          // If rate limit exceeded, throw error immediately instead of creating promise queue
          const now = Date.now();

          // Cleanup old entries to prevent memory leak (TTL-based cleanup)
          // Use call counter instead of random for predictable cleanup behavior
          // Perform cleanup asynchronously to avoid blocking Main Process Event Loop
          BaseController.callCount++;
          if (
            BaseController.throttleMap.size > 100 &&
            BaseController.callCount >= BaseController.CLEANUP_INTERVAL_CALLS
          ) {
            BaseController.callCount = 0; // Reset counter

            // Schedule cleanup asynchronously to avoid blocking Event Loop
            // Use setImmediate to yield control and allow other IPC calls to proceed
            setImmediate(() => {
              const cleanupNow = Date.now();
              const keysToDelete: string[] = [];

              // Collect keys to delete (avoid modifying Map during iteration)
              for (const [
                key,
                timestamp,
              ] of BaseController.throttleMap.entries()) {
                if (cleanupNow - timestamp > BaseController.THROTTLE_TTL_MS) {
                  keysToDelete.push(key);
                }
              }

              // Delete collected keys
              for (const key of keysToDelete) {
                BaseController.throttleMap.delete(key);
              }
              
              // MEMORY LEAK PREVENTION: Clean up stuck promises in requestCollapseMap
              // Note: Each promise has its own setTimeout, but we also check here as backup
              const now = Date.now();
              const stuckKeys: string[] = [];
              for (const [key, entry] of BaseController.requestCollapseMap.entries()) {
                const age = now - entry.createdAt;
                if (age > BaseController.REQUEST_COLLAPSE_TIMEOUT_MS) {
                  stuckKeys.push(key);
                }
              }
              
              // Delete stuck promises and clear their timeouts
              for (const key of stuckKeys) {
                const entry = BaseController.requestCollapseMap.get(key);
                if (entry) {
                  clearTimeout(entry.timeoutId); // Clear individual timeout
                  log.warn(
                    `[IPC] Cleaning up stuck promise with key "${key}" ` +
                    `(age: ${now - entry.createdAt}ms)`
                  );
                  BaseController.requestCollapseMap.delete(key);
                }
              }
            });
          }

          const isIdempotent = options?.isIdempotent === true;

          // Request Collapsing: For idempotent handlers, reuse in-flight Promise
          // This prevents duplicate work when multiple calls arrive simultaneously (e.g., React Strict Mode)
          // CRITICAL: For idempotent handlers, Request Collapsing replaces throttling
          // Throttling is not needed because collapsing prevents duplicate work
          // CRITICAL: Key includes args hash to prevent data leakage (getUser(1) vs getUser(2))
          if (isIdempotent) {
            // Generate collapse key from channel + args (prevents different args from sharing Promise)
            // Returns null if args cannot be safely collapsed (prevents data leakage)
            const collapseKey = BaseController.getCollapseKey(channel, args);
            
            // If collapsing is unsafe (complex args without id/type), disable it
            if (collapseKey === null) {
              log.debug(
                `[IPC] Request collapsing disabled for idempotent channel "${channel}" - complex args without id/type`
              );
              // Fall through to normal execution (no collapsing, but still idempotent)
            } else {
              // Check for existing Promise FIRST (before creating new one)
              const existingEntry =
                BaseController.requestCollapseMap.get(collapseKey);
              if (existingEntry) {
                // MEMORY LEAK PREVENTION: Check if promise is stuck (>30s)
                const age = Date.now() - existingEntry.createdAt;
                if (age > BaseController.REQUEST_COLLAPSE_TIMEOUT_MS) {
                  // Promise is stuck - remove it to prevent memory leak
                  log.warn(
                    `[IPC] Removing stuck promise for channel "${channel}" with key "${collapseKey}" ` +
                    `(age: ${age}ms, timeout: ${BaseController.REQUEST_COLLAPSE_TIMEOUT_MS}ms)`
                  );
                  BaseController.requestCollapseMap.delete(collapseKey);
                  // Fall through to create new promise
                } else {
                  // Request already in-flight, return the same Promise
                  // This bypasses throttling because we're reusing existing work
                  log.debug(
                    `[IPC] Request collapsing for idempotent channel "${channel}" with key "${collapseKey}"`
                  );
                  return existingEntry.promise;
                }
              }
              
              // Create Promise IMMEDIATELY (synchronously) and store in map
              // This ensures second call (even milliseconds later) will see the Promise
              let promiseResolve: (value: unknown) => void;
              let promiseReject: (error: unknown) => void;
              const promise = new Promise<unknown>((resolve, reject) => {
                promiseResolve = resolve;
                promiseReject = reject;
              });

              // Store Promise in collapse map IMMEDIATELY (synchronously)
              // This prevents race condition where second call arrives before Promise is stored
              // MEMORY LEAK PREVENTION: Each promise gets its own setTimeout to ensure cleanup
              // Even if IPC calls stop, stuck promises will be removed after timeout
              const createdAt = Date.now();
              const timeoutId = setTimeout(() => {
                const entry = BaseController.requestCollapseMap.get(collapseKey);
                if (entry && Date.now() - entry.createdAt > BaseController.REQUEST_COLLAPSE_TIMEOUT_MS) {
                  log.warn(
                    `[IPC] Timeout cleanup: removing stuck promise for channel "${channel}" ` +
                    `with key "${collapseKey}" (age: ${Date.now() - entry.createdAt}ms)`
                  );
                  BaseController.requestCollapseMap.delete(collapseKey);
                }
              }, BaseController.REQUEST_COLLAPSE_TIMEOUT_MS);
              
              BaseController.requestCollapseMap.set(collapseKey, {
                promise,
                createdAt,
                timeoutId,
              });
              
              // NOTE: No throttling for idempotent handlers with Request Collapsing
              // Request Collapsing already prevents duplicate work, so throttling is redundant
              // If handler has internal cache (like SettingsController.getSettings), rapid calls are safe

              // Execute handler logic (validation + execution) asynchronously
              // Throttling already checked above
              (async () => {
              try {
                // Execute validation and handler (inline to avoid method extraction complexity)
                // Security: Log only channel name and argument count
                log.debug(
                  `[IPC] Incoming request: ${channel} (${args.length} arg${
                    args.length !== 1 ? "s" : ""
                  })`
                );

                // Determine if schema is a tuple
                const isTuple = schema instanceof z.ZodTuple;

                // Strict validation: Check argument count BEFORE parsing
                if (isTuple) {
                  const tupleSchema = schema as z.AnyZodTuple;
                  const expectedCount = tupleSchema.items.length;
                  if (args.length !== expectedCount) {
                    const errorMessage = `Argument count mismatch: expected ${expectedCount}, got ${args.length}`;
                    log.error(
                      `[IPC] Validation failed for channel "${channel}": ${errorMessage}`
                    );
                    const serializedError: ValidationError = {
                      message: errorMessage,
                      stack: undefined,
                      name: "ValidationError",
                      originalError: undefined,
                      errors: [{ path: [], message: errorMessage, code: "custom" }],
                    };
                    throw serializedError;
                  }
                } else {
                  if (args.length !== 1) {
                    const errorMessage = `Argument count mismatch: expected 1, got ${args.length}`;
                    log.error(
                      `[IPC] Validation failed for channel "${channel}": ${errorMessage}`
                    );
                    const serializedError: ValidationError = {
                      message: errorMessage,
                      stack: undefined,
                      name: "ValidationError",
                      originalError: undefined,
                      errors: [{ path: [], message: errorMessage, code: "custom" }],
                    };
                    throw serializedError;
                  }
                }

                // Normalize schema and validate
                const normalizedSchema = isTuple
                  ? schema
                  : z.tuple([schema as z.ZodTypeAny]);
                
                // Use z.infer to extract types from schema for proper type safety
                // This eliminates the need for 'as unknown[]' type assertion
                type ValidatedArgs = z.infer<typeof normalizedSchema>;
                let validatedArgs: ValidatedArgs;
                try {
                  validatedArgs = normalizedSchema.parse(args) as ValidatedArgs;
                } catch (validationError) {
                  if (validationError instanceof z.ZodError) {
                    // Build detailed error message with path information
                    // SECURITY: Sanitize error messages to prevent leaking sensitive data
                    // Zod error messages may contain values like "Expected string, received 12345"
                    // We must strip actual values and only keep type/format information
                    const errorMessages = validationError.errors.map((e) => {
                      const pathStr = e.path.length > 0 ? ` at path "${e.path.join(".")}"` : "";
                      // SECURITY: Error messages are already sanitized by custom errorMap
                      // No need for regex replacement - values are never included in messages
                      return `${e.message}${pathStr}`;
                    });
                    const errorMessage = `Validation Error: ${errorMessages.join("; ")}`;
                    
              // Security: Log only validation errors (paths and messages), not actual argument values
              // Mask sensitive data in error paths (e.g., paths containing "password", "token", "key")
              log.error(`[IPC] Validation failed for channel "${channel}":`, {
                errors: validationError.errors.map((e) => ({
                  path: e.path.map(segment => {
                    // Mask sensitive path segments
                    const segmentStr = String(segment);
                    if (/password|token|key|secret|api[_-]?key|auth|credential/i.test(segmentStr)) {
                      return "<masked>";
                    }
                    return segment;
                  }),
                  // SECURITY: Error messages are already sanitized by custom errorMap
                  // No need for regex replacement - values are never included in messages
                  message: e.message,
                  code: e.code,
                  // SECURITY: Do not log actual values - they may contain sensitive data
                  // Only log path and sanitized message, not the value that failed validation
                })),
              });

                    // Create serializable validation error with proper string representation
                    // SECURITY: Limit JSON.stringify output size to prevent huge error strings in production logs
                    // Only include essential error information (name, message, error count) for production
                    const isProduction = process.env.NODE_ENV === "production";
                    const originalErrorJson = isProduction
                      ? JSON.stringify({
                          name: validationError.name,
                          message: validationError.message,
                          errorCount: validationError.errors.length,
                        })
                      : JSON.stringify({
                          name: validationError.name,
                          message: validationError.message,
                          errors: validationError.errors.map((e) => ({
                            path: e.path,
                            message: e.message,
                            code: e.code,
                          })),
                        });
                    
                    const serializedError: ValidationError = {
                      message: errorMessage,
                      stack: validationError.stack,
                      name: "ValidationError",
                      originalError: originalErrorJson,
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
                const handlerArgs = isTuple ? validatedArgs : [validatedArgs[0]];

                // Execute handler
                const result = await handler(event, ...handlerArgs);
                log.debug(`[IPC] Request completed: ${channel}`);
                promiseResolve!(result);
              } catch (error) {
                promiseReject!(error);
              } finally {
                // Clean up collapse map after Promise resolves/rejects
                // MEMORY LEAK PREVENTION: Clear timeout and remove promise
                const entry = BaseController.requestCollapseMap.get(collapseKey);
                if (entry) {
                  clearTimeout(entry.timeoutId); // Clear individual timeout
                  BaseController.requestCollapseMap.delete(collapseKey);
                }
              }
              })();

              return promise;
            }
          }

          // Non-idempotent handlers: execute directly with throttling
          // Throttling: Only apply to non-idempotent requests
          const lastCall = BaseController.throttleMap.get(channel);
          const timeSinceLastCall =
            lastCall !== undefined ? now - lastCall : Infinity;

          if (
            lastCall !== undefined &&
            timeSinceLastCall < BaseController.THROTTLE_MS
          ) {
            const waitTime = BaseController.THROTTLE_MS - (now - lastCall);
            log.warn(
              `[IPC] Rate limit exceeded for channel "${channel}" - too frequent (must wait ${waitTime}ms)`
            );
            const rateLimitError: SerializableError = {
              message: `Rate limit exceeded. Please wait ${waitTime}ms before retrying.`,
              stack: undefined,
              name: "RateLimitError",
              originalError: undefined,
              code: ErrorCode.RATE_LIMIT, // Typed error code for reliable error handling
            };
            throw rateLimitError;
          }

          // Update throttle timestamp only if we're actually processing the request
          BaseController.throttleMap.set(channel, Date.now());

          // Continue with validation and execution (code continues below)

          // Security: Log only channel name and argument count, not actual arguments
          // This prevents leaking user data, file paths, or other sensitive information
          // Performance: Use debug level to avoid I/O overhead on high-frequency calls (e.g., scrolling)
          log.debug(
            `[IPC] Incoming request: ${channel} (${args.length} arg${
              args.length !== 1 ? "s" : ""
            })`
          );

          // Determine if schema is a tuple
          const isTuple = schema instanceof z.ZodTuple;

          // Strict validation: Check argument count BEFORE parsing
          // This prevents silent failures when Renderer sends wrong number of arguments
          if (isTuple) {
            // Use proper Zod type checking: ZodTuple has items property
            // Cast to z.AnyZodTuple for type-safe access to items.length
            const tupleSchema = schema as z.AnyZodTuple;
            const expectedCount = tupleSchema.items.length;
            if (args.length !== expectedCount) {
              const errorMessage = `Argument count mismatch: expected ${expectedCount}, got ${args.length}`;
              // Security: Log only error details, not sanitized args (may still leak info)
              log.error(
                `[IPC] Validation failed for channel "${channel}": ${errorMessage}`,
                {
                  expected: expectedCount,
                  received: args.length,
                }
              );

              const serializedError: ValidationError = {
                message: errorMessage,
                stack: undefined,
                name: "ValidationError",
                originalError: undefined,
                errors: [
                  {
                    path: [],
                    message: errorMessage,
                    code: "custom",
                  },
                ],
              };
              throw serializedError;
            }
          } else {
            // Single schema: must receive exactly 1 argument
            if (args.length !== 1) {
              const errorMessage = `Argument count mismatch: expected 1 (single object/primitive), got ${args.length}`;
              // Security: Log only error details, not sanitized args (may still leak info)
              log.error(
                `[IPC] Validation failed for channel "${channel}": ${errorMessage}`,
                {
                  expected: 1,
                  received: args.length,
                }
              );

              const serializedError: ValidationError = {
                message: errorMessage,
                stack: undefined,
                name: "ValidationError",
                originalError: undefined,
                errors: [
                  {
                    path: [],
                    message: errorMessage,
                    code: "custom",
                  },
                ],
              };
              throw serializedError;
            }
          }

          // Normalize schema: if single ZodType (not tuple), wrap in tuple for validation
          const normalizedSchema = isTuple
            ? schema
            : z.tuple([schema as z.ZodTypeAny]);

          // Use z.infer to extract types from schema instead of as unknown[]
          // This provides proper type safety without type assertions
          type ValidatedArgs = z.infer<typeof normalizedSchema>;
          let validatedArgs: ValidatedArgs;
          try {
            validatedArgs = normalizedSchema.parse(args) as ValidatedArgs;
          } catch (validationError) {
            if (validationError instanceof z.ZodError) {
              // Build detailed error message with path information
              // SECURITY: Sanitize error messages to prevent leaking sensitive data
              // Zod error messages may contain values like "Expected string, received 12345"
              // We must strip actual values and only keep type/format information
              const errorMessages = validationError.errors.map((e) => {
                const pathStr = e.path.length > 0 ? ` at path "${e.path.join(".")}"` : "";
                // SECURITY: Error messages are already sanitized by custom errorMap
                // No need for regex replacement - values are never included in messages
                return `${e.message}${pathStr}`;
              });
              const errorMessage = `Validation Error: ${errorMessages.join("; ")}`;
              
              // Security: Log only validation errors (paths and messages), not actual argument values
              // Mask sensitive data in error paths (e.g., paths containing "password", "token", "key")
              log.error(`[IPC] Validation failed for channel "${channel}":`, {
                errors: validationError.errors.map((e) => ({
                  path: e.path.map(segment => {
                    // Mask sensitive path segments
                    const segmentStr = String(segment);
                    if (/password|token|key|secret|api[_-]?key|auth|credential/i.test(segmentStr)) {
                      return "<masked>";
                    }
                    return segment;
                  }),
                  // SECURITY: Error messages are already sanitized by custom errorMap
                  // No need for regex replacement - values are never included in messages
                  message: e.message,
                  code: e.code,
                  // SECURITY: Do not log actual values - they may contain sensitive data
                  // Only log path and sanitized message, not the value that failed validation
                })),
              });

              // Create serializable validation error with proper string representation
              // Use JSON.stringify for originalError to prevent [object Object] output
              // SECURITY: Limit JSON.stringify output size to prevent huge error strings in production logs
              // Only include essential error information (name, message, error count) for production
              const isProduction = process.env.NODE_ENV === "production";
              const originalErrorJson = isProduction
                ? JSON.stringify({
                    name: validationError.name,
                    message: validationError.message,
                    errorCount: validationError.errors.length,
                  })
                : JSON.stringify({
                    name: validationError.name,
                    message: validationError.message,
                    errors: validationError.errors.map((e) => ({
                      path: e.path,
                      message: e.message,
                      code: e.code,
                    })),
                  });
              
              const serializedError: ValidationError = {
                message: errorMessage,
                stack: validationError.stack,
                name: "ValidationError",
                originalError: originalErrorJson,
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
          const handlerArgs = isTuple ? validatedArgs : [validatedArgs[0]];

          // Execute handler
          const result = await handler(event, ...handlerArgs);
          // Performance: Use debug level to avoid I/O overhead on high-frequency calls
          log.debug(`[IPC] Request completed: ${channel}`);
          return result;
        } catch (error: unknown) {
          // Skip error handling if it's already a serialized error (ValidationError, RateLimitError, etc.)
          // Check for SerializableError structure: has name, message, and code properties
          if (
            typeof error === "object" &&
            error !== null &&
            "name" in error &&
            "message" in error &&
            "code" in error
          ) {
            // Already serialized (ValidationError, RateLimitError, or other SerializableError)
            // Just re-throw it as-is without re-serialization
            throw error;
          }

          // Electron IPC quirk: pure Error objects don't serialize well via invoke
          // Serialize error to plain object, but hide sensitive details in production
          // Security: Never log stack traces in production - they may contain file paths
          const isProduction = process.env.NODE_ENV === "production";

          // Log error details for debugging (without sensitive argument data)
          log.error(`[IPC] Error in channel "${channel}":`, {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: isProduction
              ? undefined
              : error instanceof Error
              ? error.stack
              : undefined,
            // Security: Do not log args - they may contain sensitive data even after sanitization
          });

          // Determine error code based on error type/message
          let errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR;
          if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            if (
              errorMessage.includes("rate limit") ||
              errorMessage.includes("too frequent")
            ) {
              errorCode = ErrorCode.RATE_LIMIT;
            } else if (
              error.name === "ValidationError" ||
              error instanceof z.ZodError
            ) {
              errorCode = ErrorCode.VALIDATION_ERROR;
            } else if (
              errorMessage.includes("database") ||
              errorMessage.includes("sqlite")
            ) {
              errorCode = ErrorCode.DATABASE_ERROR;
            } else if (
              errorMessage.includes("network") ||
              errorMessage.includes("fetch")
            ) {
              errorCode = ErrorCode.NETWORK_ERROR;
            } else if (
              errorMessage.includes("auth") ||
              errorMessage.includes("unauthorized")
            ) {
              errorCode = ErrorCode.AUTH_ERROR;
            }
          }

          const serializedError: SerializableError =
            error instanceof Error
              ? {
                  message: error.message || "Unknown IPC error",
                  // Hide stack trace in production (potential security leak - file paths, structure)
                  stack: isProduction ? undefined : error.stack,
                  name: error.name,
                  // Hide originalError in production (may contain system details)
                  originalError: isProduction ? undefined : String(error),
                  code: errorCode, // Typed error code for reliable error handling
                }
              : {
                  message: String(error) || "Unknown IPC error",
                  stack: undefined,
                  name: "Error",
                  originalError: isProduction ? undefined : String(error),
                  code: errorCode,
                };

          throw serializedError;
        }
      }
    );

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
      if (typeof arg === "string") {
        // Mask file paths (preserve path structure, mask only username)
        if (/^[A-Za-z]:[\\/]|^\/|^~/.test(arg)) {
          // Preserve path for debugging, but mask username
          // Windows: C:\Users\Username\... -> C:\Users\<user>\...
          // Unix: /home/username/... -> /home/<user>/...
          // This allows debugging file operations while protecting user identity
          const maskedPath = arg
            // Windows user path: C:\Users\Username\... -> C:\Users\<user>\...
            .replace(
              /^([A-Za-z]:[\\/]Users[\\/])([^\\/]+)([\\/])/i,
              "$1<user>$3"
            )
            // Unix home path: /home/username/... -> /home/<user>/...
            .replace(/^(\/home\/)([^/]+)(\/)/, "$1<user>$3")
            // Tilde expansion: ~username/... -> ~<user>/...
            .replace(/^(~)([^/\\]+)([/\\])/, "$1<user>$3")
            // Generic user directory patterns
            .replace(/\/(Users|home)\/([^/\\]+)([/\\])/gi, "/$1/<user>$3");

          return maskedPath;
        }

        // Mask tokens and keys (any length if they match patterns)
        if (
          /(password|token|key|secret|api[_-]?key|auth|credential)/i.test(
            arg
          ) ||
          /^[A-Za-z0-9+/]{32,}={0,2}$/.test(arg) || // Base64-like strings (32+ chars)
          /^[a-f0-9]{32,}$/i.test(arg) // Hex strings (likely hashes/tokens)
        ) {
          return "<masked>";
        }

        // Mask long strings (likely tokens, keys, etc.)
        if (arg.length > 50) {
          return `<string:${arg.length}chars>`;
        }

        return arg;
      }

      // Mask objects that might contain sensitive data
      if (typeof arg === "object" && arg !== null) {
        if (Array.isArray(arg)) {
          return arg.map((item) => this.sanitizeArgs([item])[0]);
        }

        // Comprehensive list of sensitive keys to mask
        // Includes variations: apiKey, api_key, api-key, encryptedApiKey, etc.
        const sensitiveKeyPattern =
          /^(password|token|key|secret|api[_-]?key|encrypted[_-]?api[_-]?key|auth|credential|access[_-]?token|refresh[_-]?token|bearer|authorization)$/i;

        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(arg)) {
          // Check if key matches sensitive patterns
          if (sensitiveKeyPattern.test(key)) {
            // Always mask sensitive keys, regardless of value type
            sanitized[key] = "<masked>";
          } else if (typeof value === "string" && value.length > 0) {
            // Recursively sanitize string values (may contain nested sensitive data)
            const sanitizedValue = this.sanitizeArgs([value])[0];
            sanitized[key] = sanitizedValue;
          } else if (typeof value === "object" && value !== null) {
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
