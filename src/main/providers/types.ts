import type { ArtistType } from "../db/schema";
import type { BooruPost } from "../../shared/schemas/booru";

// Re-export BooruPost from shared schema for backward compatibility
export type { BooruPost };
export const PAGE_SIZE = 100;

export interface SearchResults {
  id: string;
  label: string;
  value: string;
  type?: string;
}

export interface ProviderSettings {
  userId?: string;
  apiKey?: string;
}

export interface IBooruProvider {
  id: string;
  name: string;
  /**
   * Exact hostnames this provider may load media/connect from.
   * Single source for CSP (`getAllProviderDomains`) and video-proxy `isAllowedCdnUrl`.
   */
  readonly allowedDomains: string[];
  /** Validates provided credentials against the API */
  checkAuth(settings: ProviderSettings): Promise<boolean>;
  /** Fetches posts based on tags and page. Callers must pass an explicit page size. */
  fetchPosts(
    tags: string,
    page: number,
    settings: ProviderSettings,
    isRandom: boolean,
    limit: number
  ): Promise<BooruPost[]>;
  /** Search for tags (autocomplete) with optional AbortSignal for cancellation */
  searchTags(query: string, signal?: AbortSignal): Promise<SearchResults[]>;
  /** Formats a tag based on artist type (e.g. adding 'user:' prefix) */
  formatTag(tag: string, type: ArtistType): string;
  /** Returns the default API endpoint for this provider */
  getDefaultApiEndpoint(): string;
}


