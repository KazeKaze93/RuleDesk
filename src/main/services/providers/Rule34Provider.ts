import log from "electron-log";
import type { IBooruProvider, TagResult } from "./IBooruProvider";

/**
 * Rule34 Provider
 *
 * Implements IBooruProvider for Rule34.xxx API.
 * Handles tag autocomplete search via public API endpoint.
 */
export class Rule34Provider implements IBooruProvider {
  private readonly autocompleteUrl = "https://api.rule34.xxx/autocomplete.php";

  /**
   * Search for tags using Rule34 autocomplete API
   *
   * @param query - Search query string (minimum 2 characters recommended)
   * @returns Array of tag search results, empty array on error
   */
  async searchTags(query: string): Promise<TagResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `${this.autocompleteUrl}?q=${encodedQuery}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = (await response.json()) as Array<{
        label: string;
        value: string;
      }>;

      // Map to TagResult format
      return data.map((item) => ({
        id: item.value, // value is the tag itself
        label: item.label, // label is "tag (count)"
      }));
    } catch (error) {
      log.error("[Rule34Provider] Tag search failed:", error);
      return [];
    }
  }
}

