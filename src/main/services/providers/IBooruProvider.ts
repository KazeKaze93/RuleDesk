/**
 * Tag search result from Booru provider
 */
export interface TagResult {
  /** The raw tag value */
  id: string;
  /** Display string (e.g. "tag (123)") */
  label: string;
}

/**
 * Booru Provider Interface
 *
 * Defines the contract for external Booru API providers.
 * This interface focuses on tag search functionality and can be extended
 * in the future with additional methods (getPosts, getArtist, etc.).
 */
export interface IBooruProvider {
  /**
   * Search for tags using provider's autocomplete API
   *
   * @param query - Search query string (minimum 2 characters)
   * @returns Array of tag search results
   */
  searchTags(query: string): Promise<TagResult[]>;
  // В будущем сюда добавим getPosts, getArtist и т.д.
}

