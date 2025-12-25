/**
 * IPC Request/Response Types
 * 
 * Shared types for IPC communication between Main and Renderer processes.
 * 
 * Note: Request types are now exported directly from controller schemas
 * to ensure single source of truth. Re-export them here for convenience.
 */

// Re-export types from controllers (single source of truth)
export type { AddArtistRequest } from "../ipc/controllers/ArtistsController";
export type { GetPostsRequest, PostFilterRequest } from "../ipc/controllers/PostsController";

/**
 * Settings type for IPC (excluding sensitive data like encryptedApiKey)
 * This is the safe representation of settings that can be sent to Renderer process.
 */
export interface IpcSettings {
  userId: string;
  hasApiKey: boolean;
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
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
}

/**
 * Validation error structure
 */
export interface ValidationError extends SerializableError {
  name: 'ValidationError';
  errors?: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;
}

