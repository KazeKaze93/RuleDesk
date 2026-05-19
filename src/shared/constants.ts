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

/**
 * Maximum tracked artists returned by getTrackedArtists IPC.
 * Protects renderer memory when subscriptions/playlists grow large.
 */
export const MAX_TRACKED_ARTISTS = 5000;

/**
 * Maximum Random Pages
 *
 * Maximum number of pages to use for pseudo-random fallback when provider
 * doesn't support native randomization (order:random).
 * 
 * NOTE: This is a fallback approach. True randomization on large datasets in Booru APIs
 * should be done via API's native sort:random parameter if the provider supports it.
 * If the provider doesn't support native randomization, this pseudo-random approach
 * provides reasonable distribution across pages (1-MAX_RANDOM_PAGES) for better variety.
 * 
 * Value of 20 is conservative to avoid hitting API rate limits and to ensure
 * reasonable response times. Most Booru APIs have thousands of pages, but querying
 * random pages beyond 20 doesn't significantly improve randomization quality.
 */
export const MAX_RANDOM_PAGES = 20;

/**
 * Dangerous URL Protocols
 *
 * List of URL protocols that should be blocked for security reasons.
 * These protocols can execute code or access local files, posing security risks.
 * 
 * Used in:
 * - PostsController: validateUrlProtocol() for URL validation
 */
export const DANGEROUS_URL_PROTOCOLS = [
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "about:",
  "chrome:",
  "chrome-extension:",
  "moz-extension:",
  "ms-browser-extension:",
] as const;

/**
 * Browser window `CustomEvent` / `addEventListener` names used in the renderer
 * (not IPC; keep names aligned with Main when dispatching the same string).
 */
export const RENDERER_WINDOW_EVENTS = {
  OPEN_ONBOARDING: "app:open-onboarding",
} as const;

