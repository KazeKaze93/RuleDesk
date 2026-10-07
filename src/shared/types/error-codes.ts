/**
 * Typed IPC / provider error codes.
 * Callers must match these values — never English error message substrings.
 */
export enum ErrorCode {
  RATE_LIMIT = "RATE_LIMIT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTH_ERROR = "AUTH_ERROR",
  PARSE_ERROR = "PARSE_ERROR",
  CANCELLED = "CANCELLED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
