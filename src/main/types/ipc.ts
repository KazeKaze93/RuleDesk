/**
 * IPC Request/Response Types
 *
 * Shared types for IPC communication between Main and Renderer processes.
 *
 * Note: Request types are now exported directly from controller schemas
 * to ensure single source of truth. Re-export them here for convenience.
 */

// Re-export types from shared schemas (single source of truth)
export type { AddArtistRequest } from "../../shared/schemas/artist";
export type {
  GetPostsRequest,
  PostFilterRequest,
} from "../../shared/schemas/post";

/**
 * Re-export IpcSettings from shared schema for backward compatibility.
 * New code should import directly from @shared/schemas/settings.
 *
 * @deprecated Use IpcSettings from @shared/schemas/settings instead
 */
export type { IpcSettings } from "../../shared/schemas/settings";

/**
 * Error codes for typed error handling
 * Prevents brittle string matching in error handling
 */
export enum ErrorCode {
  RATE_LIMIT = "RATE_LIMIT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTH_ERROR = "AUTH_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Serializable error structure for IPC communication
 * Electron IPC cannot serialize Error objects properly, so we use plain objects
 */
export interface SerializableError {
  message: string;
  stack?: string;
  name: string;
  originalError?: string;
  code?: ErrorCode; // Typed error code for reliable error handling
}

/**
 * Validation error structure
 */
export interface ValidationError extends SerializableError {
  name: "ValidationError";
  errors?: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;
}
