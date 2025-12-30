/**
 * Shared Constants
 *
 * Application-wide constants that are used across Main and Renderer processes.
 * These constants define sentinel values, magic numbers, and configuration values.
 */

/**
 * External Artist ID
 *
 * Sentinel value used to indicate that a post comes from an external source (Browse tab)
 * and is not associated with any tracked artist in the local database.
 *
 * This value is used as artistId for posts fetched from external Booru APIs.
 * It cannot conflict with real artist IDs since artist IDs are auto-incremented starting from 1.
 */
export const EXTERNAL_ARTIST_ID = 0;

