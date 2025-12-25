/**
 * IPC Request/Response Types
 * 
 * Shared types for IPC communication between Main and Renderer processes.
 * These types are exported from controllers but should be used through this module
 * to avoid leaking implementation details.
 */

// Re-export types from controllers (but controllers should not be imported directly)
export type { GetPostsParams, PostFilterParams } from '../ipc/controllers/PostsController';
export type { AddArtistParams } from '../ipc/controllers/ArtistsController';

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

