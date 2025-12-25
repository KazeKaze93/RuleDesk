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

      // Critical: Add timeout to prevent Main Process hang
      // Default fetch has no timeout - if API hangs, IPC handler blocks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
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
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Handle abort (timeout) specifically
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          log.warn("[Rule34Provider] Request timeout (10s) - API may be slow or unreachable");
          throw new Error("Request timeout: API did not respond within 10 seconds");
        }
        throw fetchError;
      }
    } catch (error) {
      log.error("[Rule34Provider] Tag search failed:", error);
      return [];
    }
  }
}

