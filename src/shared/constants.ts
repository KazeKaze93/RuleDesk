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

/**
 * External Artist Tag Prefix
 *
 * Prefix used for placeholder artists created for external posts from Browse.
 * These placeholder artists are created to satisfy FOREIGN KEY constraints when
 * external posts are saved to the database (e.g., when marked as viewed or favorited).
 *
 * Used in:
 * - PostsController: Creating placeholder artists with tag `external_${artistId}`
 * - ArtistsController: Filtering out placeholder artists with `notLike(artists.tag, "external_%")`
 */
export const EXTERNAL_ARTIST_TAG_PREFIX = "external_";

/**
 * Provider IDs
 *
 * Supported Booru provider identifiers.
 * Shared between Main and Renderer processes for type safety.
 */
export const PROVIDER_IDS = ["rule34", "gelbooru"] as const;
export type ProviderId = typeof PROVIDER_IDS[number];

/**
 * Artist Types
 *
 * Supported artist tracking types.
 * Shared between Main and Renderer processes for type safety.
 */
export const ARTIST_TYPES = ["tag", "uploader", "query"] as const;
export type ArtistType = typeof ARTIST_TYPES[number];

