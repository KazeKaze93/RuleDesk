/**
 * Typed IPC / provider error codes.
 * Callers must match these values — never English error message substrings.
 */
export enum ErrorCode {
  RATE_LIMIT = "RATE_LIMIT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  /** DB file exists but open/read probe failed — never treat as empty or delete. */
  DATABASE_UNREADABLE = "DATABASE_UNREADABLE",
  /** better-sqlite3 native binding failed to load (ABI / NODE_MODULE_VERSION mismatch). */
  SQLITE_NATIVE_LOAD_FAILED = "SQLITE_NATIVE_LOAD_FAILED",
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTH_ERROR = "AUTH_ERROR",
  PARSE_ERROR = "PARSE_ERROR",
  CANCELLED = "CANCELLED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
