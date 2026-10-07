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
  GetPostsCountRequest,
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
 * Error codes for typed error handling.
 * Canonical definition lives in shared — re-export for Main callers.
 */
import { ErrorCode } from "../../shared/types/error-codes";
export { ErrorCode };

/**
 * Fields carried inside the BaseController failure envelope
 * (``{ ok: false, error }``) and restored onto a real ``Error`` by preload.
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
