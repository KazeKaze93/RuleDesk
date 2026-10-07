/**
 * IPC failure envelope returned (not thrown) from BaseController handlers.
 * Electron ``invoke`` strips custom fields from rejected Errors; a resolved
 * plain object survives Structured Clone, and preload rethrows with ``code``.
 */
export type IpcFailureErrorBody = {
  message: string;
  code: string;
  name?: string;
  stack?: string;
  originalError?: string;
  errors?: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;
  providerKind?: string;
  retryAfterMs?: number;
};

export type IpcFailureResult = {
  ok: false;
  error: IpcFailureErrorBody;
};

export function isIpcFailureResult(value: unknown): value is IpcFailureResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (Reflect.get(value, "ok") !== false) {
    return false;
  }
  const error = Reflect.get(value, "error");
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const message = Reflect.get(error, "message");
  const code = Reflect.get(error, "code");
  return typeof message === "string" && typeof code === "string";
}

export function toIpcFailureResult(
  message: string,
  code: string,
  extra?: Record<string, unknown>
): IpcFailureResult {
  return {
    ok: false,
    error: {
      message,
      code,
      ...extra,
    },
  };
}

/**
 * Rebuild a real Error (with ``code`` and other envelope fields) on the
 * preload/renderer side after a successful Structured Clone of the envelope.
 */
export function errorFromIpcFailure(result: IpcFailureResult): Error {
  const err = new Error(result.error.message);
  if (result.error.name) {
    err.name = result.error.name;
  }
  if (result.error.stack) {
    err.stack = result.error.stack;
  }
  Object.assign(err, result.error);
  return err;
}

/**
 * Preload helper: resolve success payloads; rethrow failure envelopes as Error.
 */
export function unwrapIpcInvokeResult(value: unknown): unknown {
  if (isIpcFailureResult(value)) {
    throw errorFromIpcFailure(value);
  }
  return value;
}
