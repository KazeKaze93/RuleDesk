import { ErrorCode } from "../types/error-codes";

/**
 * Attach a typed ErrorCode to an Error so BaseController / preload preserve it
 * across the IPC envelope. Prefer this over matching English message text.
 */
export function withErrorCode(
  error: Error,
  code: ErrorCode,
  extra?: Record<string, unknown>
): Error {
  Object.assign(error, { code }, extra ?? {});
  return error;
}

export function createCodedError(
  message: string,
  code: ErrorCode,
  options?: {
    name?: string;
    stack?: string;
    extra?: Record<string, unknown>;
  }
): Error {
  const err = new Error(message);
  err.name = options?.name ?? "Error";
  if (options?.stack) {
    err.stack = options.stack;
  }
  return withErrorCode(err, code, options?.extra);
}
