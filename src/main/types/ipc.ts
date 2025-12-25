/**
 * IPC Request/Response Types
 * 
 * Shared types for IPC communication between Main and Renderer processes.
 * These DTOs are owned by the IPC layer and should not leak controller implementation details.
 */

/**
 * Get Posts Request DTO
 * Owned by IPC layer, not controllers
 */
export interface GetPostsRequest {
  artistId: number;
  page?: number;
  filters?: PostFilterRequest;
  limit?: number;
}

/**
 * Post Filter Request DTO
 */
export interface PostFilterRequest {
  tags?: string;
  rating?: "s" | "q" | "e";
  isFavorited?: boolean;
  isViewed?: boolean;
}

/**
 * Add Artist Request DTO
 * Owned by IPC layer, not controllers
 */
export interface AddArtistRequest {
  name: string;
  tag: string;
  provider?: "rule34" | "gelbooru";
  type: "tag" | "uploader" | "query";
  apiEndpoint?: string;
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

