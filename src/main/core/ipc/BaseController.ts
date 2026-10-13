import { app, ipcMain, type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z, type ZodErrorMap, type ZodTypeAny } from "zod";
import { ErrorCode } from "../../../shared/types/error-codes";
import { createCodedError } from "../../../shared/utils/coded-error";
import {
  isIpcFailureResult,
  toIpcFailureResult,
  type IpcFailureResult,
} from "../../../shared/utils/ipc-result";

type IpcHandlerSchema =
  | z.ZodTuple<[ZodTypeAny, ...ZodTypeAny[]] | [], ZodTypeAny | null>
  | ZodTypeAny;

/** Rest args for a handler registered with `schema` (tuple → tuple; else single arg). */
type HandlerArgsOf<TSchema extends IpcHandlerSchema> = TSchema extends z.ZodTuple
  ? z.infer<TSchema>
  : [z.infer<TSchema>];

type TypedIpcHandler<TSchema extends IpcHandlerSchema> = (
  event: IpcMainInvokeEvent,
  ...args: HandlerArgsOf<TSchema> extends infer A
    ? A extends unknown[]
      ? A
      : never
    : never
) => Promise<unknown> | unknown;

/** Packaged Electron build — omit stacks from IPC failure envelopes. */
function isProductionBuild(): boolean {
  return app.isPackaged;
}

/** Local alias — BaseController never rejects; envelope carries the code. */
function createIpcError(
  message: string,
  code: ErrorCode,
  options?: {
    name?: string;
    stack?: string;
    extra?: Record<string, unknown>;
  }
): Error {
  return createCodedError(message, code, options);
}

function throwArgumentCountMismatch(
  channel: string,
  expectedCount: number,
  receivedCount: number
): never {
  const errorMessage =
    expectedCount === 1
      ? `Argument count mismatch: expected 1 (single object/primitive), got ${receivedCount}`
      : `Argument count mismatch: expected ${expectedCount}, got ${receivedCount}`;
  log.error(`[IPC] Validation failed for channel "${channel}": ${errorMessage}`, {
    expected: expectedCount,
    received: receivedCount,
  });
  throw createIpcError(errorMessage, ErrorCode.VALIDATION_ERROR, {
    name: "ValidationError",
    extra: {
      errors: [
        {
          path: [],
          message: errorMessage,
          code: "custom",
        },
      ],
    },
  });
}

function throwZodValidationError(
  channel: string,
  validationError: z.ZodError
): never {
  const errorMessages = validationError.errors.map((e) => {
    const pathStr =
      e.path.length > 0 ? ` at path "${e.path.join(".")}"` : "";
    return `${e.message}${pathStr}`;
  });
  const errorMessage = `Validation Error: ${errorMessages.join("; ")}`;

  log.error(`[IPC] Validation failed for channel "${channel}":`, {
    errors: validationError.errors.map((e) => ({
      path: e.path.map((segment) => {
        const segmentStr = String(segment);
        if (
          /password|token|key|secret|api[_-]?key|auth|credential/i.test(
            segmentStr
          )
        ) {
          return "<masked>";
        }
        return segment;
      }),
      message: e.message,
      code: e.code,
    })),
  });

  const isProduction = isProductionBuild();
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

  throw createIpcError(errorMessage, ErrorCode.VALIDATION_ERROR, {
    name: "ValidationError",
    stack: validationError.stack,
    extra: {
      originalError: originalErrorJson,
      errors: validationError.errors.map((e) => ({
        path: e.path,
        message: e.message,
        code: e.code,
      })),
    },
  });
}

function hasIpcErrorCode(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof Reflect.get(error, "code") === "string"
  );
}

function ipcFailureFromUnknown(
  error: unknown,
  isProduction: boolean
): IpcFailureResult {
  if (isIpcFailureResult(error)) {
    return error;
  }

  if (error instanceof Error) {
    const code = hasIpcErrorCode(error)
      ? String(Reflect.get(error, "code"))
      : inferErrorCode(error);
    const extras: Record<string, unknown> = {};
    for (const key of Object.keys(error)) {
      if (key === "message" || key === "name" || key === "stack") {
        continue;
      }
      const value = Reflect.get(error, key);
      if (
        value === undefined ||
        typeof value === "function" ||
        typeof value === "symbol"
      ) {
        continue;
      }
      extras[key] = value;
    }
    return toIpcFailureResult(error.message || "Unknown IPC error", code, {
      name: error.name,
      stack: isProduction ? undefined : error.stack,
      ...extras,
    });
  }

  return toIpcFailureResult("Unknown IPC error", ErrorCode.UNKNOWN_ERROR, {
    originalError: isProduction ? undefined : String(error),
  });
}

/**
 * Infer a code only from typed error identity — never from English message text.
 * Throw sites that need a specific code must attach ErrorCode via createCodedError /
 * withErrorCode (or throwProviderSearchIpcError).
 */
function inferErrorCode(error: Error): ErrorCode {
  if (error.name === "ValidationError" || error instanceof z.ZodError) {
    return ErrorCode.VALIDATION_ERROR;
  }
  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Custom Zod error map that sanitizes error messages to prevent leaking sensitive data
 * 
 * SECURITY: Never includes actual values in error messages.
 * Instead of "Expected string, received 12345", returns "Expected string, received <value>"
 * 
 * This is more robust than regex replacement because it prevents values from appearing
 * in error messages at the source, rather than sanitizing them after the fact.
 * 
 * NOTE: This is used locally in BaseController validation, not as a global error map.
 * This prevents side effects on other parts of the application that may need detailed error messages.
 */
const sanitizedErrorMap: ZodErrorMap = (_issue, ctx) => {
  const defaultMessage = ctx.defaultError;
  
  // SECURITY: Replace any value patterns in default messages
  // Patterns like "received 12345", "Expected number, received string", etc.
  const sanitized = defaultMessage.replace(/received\s+[^\s,;]+/gi, "received <value>");
  
  return { message: sanitized };
};

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
   * Channel → Zod schema for every successful `handle()` registration.
   * Inventory tests assert every production channel has an entry here.
   */
  private static readonly channelSchemas = new Map<string, IpcHandlerSchema>();

  /**
   * Read-only inventory of channel → schema from `handle()` registrations.
   */
  public static getRegisteredChannelSchemas(): ReadonlyMap<string, IpcHandlerSchema> {
    return BaseController.channelSchemas;
  }

  /** Clear schema inventory (unit tests only). */
  public static clearRegisteredChannelSchemasForTests(): void {
    BaseController.channelSchemas.clear();
  }

  // Throttling: Track last call time per channel to prevent DoS attacks
  // Map<channel, lastCallTimestamp>
  private static readonly throttleMap = new Map<string, number>();

  // Request Collapsing: For idempotent handlers, reuse in-flight Promise to prevent duplicate work
  // Key = channel + stableStringify(args) so different payloads never share a Promise
  // MEMORY LEAK PREVENTION: Each promise has its own setTimeout; timeout also settles the
  // Promise (failure envelope) so awaiters / Vitest do not hang forever on a stuck handler.
  private static readonly requestCollapseMap = new Map<
    string,
    {
      promise: Promise<unknown>;
      settle: (value: unknown) => void;
      createdAt: number;
      timeoutId: NodeJS.Timeout;
    }
  >();

  // Timeout for request collapsing: settle + remove stuck promises after 30 seconds
  private static readonly REQUEST_COLLAPSE_TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Canonical JSON with sorted object keys (arrays keep order).
   * Returns null for values that cannot be represented safely (undefined, NaN, functions, etc.).
   */
  private static stableStringify(value: unknown): string | null {
    if (value === undefined) {
      return null;
    }
    if (value === null) {
      return "null";
    }

    const valueType = typeof value;
    if (valueType === "string") {
      return JSON.stringify(value);
    }
    if (valueType === "boolean") {
      return value ? "true" : "false";
    }
    if (valueType === "number") {
      if (!Number.isFinite(value)) {
        return null;
      }
      return JSON.stringify(value);
    }
    if (
      valueType === "bigint" ||
      valueType === "symbol" ||
      valueType === "function"
    ) {
      return null;
    }

    if (Array.isArray(value)) {
      const parts: string[] = [];
      for (const item of value) {
        const itemJson = this.stableStringify(item);
        if (itemJson === null) {
          return null;
        }
        parts.push(itemJson);
      }
      return `[${parts.join(",")}]`;
    }

    if (valueType === "object") {
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) {
        return null;
      }

      const keys = Object.keys(value).sort();
      const parts: string[] = [];
      for (const key of keys) {
        const propJson = this.stableStringify(Reflect.get(value, key));
        if (propJson === null) {
          return null;
        }
        parts.push(`${JSON.stringify(key)}:${propJson}`);
      }
      return `{${parts.join(",")}}`;
    }

    return null;
  }

  /**
   * Collapse key from channel + full canonical JSON args.
   * Returns null when args cannot be serialized (collapsing disabled, no warn).
   */
  private static getCollapseKey(channel: string, args: unknown[]): string | null {
    const canonical = this.stableStringify(args);
    if (canonical === null) {
      return null;
    }
    return `${channel}:${canonical}`;
  }

  // Minimum spacing between non-idempotent calls on the same channel (delay, never reject)
  private static readonly THROTTLE_MS = 100;

  /**
   * Shared validation + handler execution for both collapsed (idempotent) and
   * throttled registration paths. Throws typed validation errors; callers own
   * the failure-envelope catch.
   */
  private async runValidatedHandler<TSchema extends IpcHandlerSchema>(
    channel: string,
    schema: TSchema,
    handler: TypedIpcHandler<TSchema>,
    event: IpcMainInvokeEvent,
    args: unknown[]
  ): Promise<unknown> {
    log.debug(
      `[IPC] Incoming request: ${channel} (${args.length} arg${
        args.length !== 1 ? "s" : ""
      })`
    );

    const isTuple = schema instanceof z.ZodTuple;

    if (isTuple) {
      const expectedCount = schema.items.length;
      if (args.length !== expectedCount) {
        throwArgumentCountMismatch(channel, expectedCount, args.length);
      }
    } else if (args.length !== 1) {
      throwArgumentCountMismatch(channel, 1, args.length);
    }

    const normalizedSchema = isTuple ? schema : z.tuple([schema]);
    let validatedArgs: unknown;
    try {
      validatedArgs = normalizedSchema.parse(args, {
        errorMap: sanitizedErrorMap,
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throwZodValidationError(channel, validationError);
      }
      throw validationError;
    }

    if (!Array.isArray(validatedArgs)) {
      throw createIpcError(
        `Internal validation error: expected tuple result for channel "${channel}"`,
        ErrorCode.VALIDATION_ERROR,
        { name: "ValidationError" }
      );
    }

    // Forward Zod-validated args into the typed handler. Function.prototype.apply
    // is the call boundary (no `as`); args were validated above.
    const callArgs: unknown[] = [event, ...validatedArgs];
    const invoked: unknown = await Function.prototype.apply.call(
      handler,
      undefined,
      callArgs
    );
    log.debug(`[IPC] Request completed: ${channel}`);
    return invoked;
  }

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
  protected handle<TSchema extends IpcHandlerSchema>(
    channel: string,
    schema: TSchema,
    handler: TypedIpcHandler<TSchema>,
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

    BaseController.channelSchemas.set(channel, schema);

    ipcMain.handle(
      channel,
      async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
        try {
          const isIdempotent = options?.isIdempotent === true;

          // Request Collapsing: reuse in-flight Promise for identical (channel + args) on idempotent handlers
          // Collapsing replaces per-call throttling for idempotent channels
          if (isIdempotent) {
            const collapseKey = BaseController.getCollapseKey(channel, args);

            // Unserializable args → no collapsing; fall through to throttled execution
            if (collapseKey === null) {
              log.debug(
                `[IPC] Request collapsing disabled for idempotent channel "${channel}" - args not serializable`
              );
            } else {
              // Check for existing Promise FIRST (before creating new one)
              const existingEntry =
                BaseController.requestCollapseMap.get(collapseKey);
              if (existingEntry) {
                // MEMORY LEAK PREVENTION: Check if promise is stuck (>30s)
                const age = Date.now() - existingEntry.createdAt;
                if (age >= BaseController.REQUEST_COLLAPSE_TIMEOUT_MS) {
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
              // Failures resolve with an IpcFailureResult envelope (never reject).
              const promise = new Promise<unknown>((resolve) => {
                promiseResolve = resolve;
              });
              let settled = false;
              const settle = (value: unknown): void => {
                if (settled) {
                  return;
                }
                settled = true;
                const entry = BaseController.requestCollapseMap.get(collapseKey);
                if (entry) {
                  clearTimeout(entry.timeoutId);
                  BaseController.requestCollapseMap.delete(collapseKey);
                }
                promiseResolve!(value);
              };

              // Store Promise in collapse map IMMEDIATELY (synchronously)
              // This prevents race condition where second call arrives before Promise is stored
              const createdAt = Date.now();
              const timeoutId = setTimeout(() => {
                const entry = BaseController.requestCollapseMap.get(collapseKey);
                if (
                  entry &&
                  Date.now() - entry.createdAt >=
                    BaseController.REQUEST_COLLAPSE_TIMEOUT_MS
                ) {
                  log.warn(
                    `[IPC] Timeout cleanup: removing stuck promise for channel "${channel}" ` +
                      `with key "${collapseKey}" (age: ${Date.now() - entry.createdAt}ms)`
                  );
                  entry.settle(
                    toIpcFailureResult(
                      `IPC request timed out for channel "${channel}"`,
                      ErrorCode.UNKNOWN_ERROR
                    )
                  );
                }
              }, BaseController.REQUEST_COLLAPSE_TIMEOUT_MS);

              BaseController.requestCollapseMap.set(collapseKey, {
                promise,
                settle,
                createdAt,
                timeoutId,
              });

              // NOTE: No throttling for idempotent handlers with Request Collapsing
              // Request Collapsing already prevents duplicate work, so throttling is redundant
              // If handler has internal cache (like SettingsController.getSettings), rapid calls are safe

              // Execute shared validation + handler asynchronously
              void (async () => {
                try {
                  const result = await this.runValidatedHandler(
                    channel,
                    schema,
                    handler,
                    event,
                    args
                  );
                  settle(result);
                } catch (error: unknown) {
                  // Resolve with failure envelope (do not reject — Electron drops Error.code).
                  const isProduction = isProductionBuild();
                  if (!hasIpcErrorCode(error)) {
                    log.error(`[IPC] Error in channel "${channel}":`, {
                      message:
                        error instanceof Error
                          ? error.message
                          : "Unknown error",
                      stack: isProduction
                        ? undefined
                        : error instanceof Error
                          ? error.stack
                          : undefined,
                    });
                  }
                  settle(ipcFailureFromUnknown(error, isProduction));
                }
              })().catch((error: unknown) => {
                log.error(
                  `[IPC] Collapsed handler failed for channel "${channel}":`,
                  error
                );
              });

              return promise;
            }
          }

          // Spacing for non-idempotent (and unserializable idempotent) calls: delay, never reject.
          // Reserve the slot synchronously before await so parallel callers cannot share one slot.
          const now = Date.now();
          const lastCall = BaseController.throttleMap.get(channel);
          const wait =
            lastCall === undefined
              ? 0
              : Math.max(0, lastCall + BaseController.THROTTLE_MS - now);
          BaseController.throttleMap.set(channel, now + wait);
          if (wait > 0) {
            log.debug(
              `[IPC] Throttling channel "${channel}" - waiting ${wait}ms`
            );
            await new Promise<void>((resolve) => {
              setTimeout(resolve, wait);
            });
          }

          return await this.runValidatedHandler(
            channel,
            schema,
            handler,
            event,
            args
          );
        } catch (error: unknown) {
          // Never reject the handle Promise — return a clone-safe failure envelope.
          // Preload ``invokeIpc`` rethrows as Error with ``code`` on the renderer side.
          const isProduction = isProductionBuild();
          if (!hasIpcErrorCode(error)) {
            log.error(`[IPC] Error in channel "${channel}":`, {
              message:
                error instanceof Error ? error.message : "Unknown error",
              stack: isProduction
                ? undefined
                : error instanceof Error
                  ? error.stack
                  : undefined,
            });
          }
          return ipcFailureFromUnknown(error, isProduction);
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
}
