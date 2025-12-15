/**
 * Type definitions for communication between Main process and DB Worker
 */

/**
 * All available database service methods
 */
export type DbMethod =
  // Database Maintenance
  | "fixDatabaseSchema"
  | "repairArtistTags"
  | "runDeferredMaintenance"
  // Artist Management
  | "getTrackedArtists"
  | "addArtist"
  | "updateArtistLastChecked"
  | "updateArtistProgress"
  | "savePostsForArtist"
  | "getPostsByArtist"
  | "getArtistById"
  | "searchArtists"
  | "deleteArtist"
  | "markPostAsViewed"
  | "togglePostFavorite"
  // Settings & Security
  | "getSettings"
  | "saveSettings"
  | "getSettingsStatus"
  | "getApiKeyDecrypted"
  // Backup
  | "backup";

/**
 * Request message sent from Main process to DB Worker
 */
export interface WorkerRequest {
  id: string;
  type: DbMethod;
  payload: unknown;
}

/**
 * Response message sent from DB Worker to Main process
 */
export interface WorkerResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
