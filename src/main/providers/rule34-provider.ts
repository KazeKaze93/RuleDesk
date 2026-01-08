import axios from "axios";
import { logger } from "../lib/logger";
import { selectBestPreview } from "../lib/media-utils";
import { USER_AGENT, REQUEST_TIMEOUT, AUTOCOMPLETE_TIMEOUT } from "../config/constants";
import { IBooruProvider, BooruPost, ProviderSettings, SearchResults } from "./types";
import type { ArtistType } from "../db/schema";
import { R34RawPostSchema, type R34RawPost } from "../../shared/schemas/booru";
import { normalizeRating } from "../../shared/utils/post-normalization";
import { z } from "zod";

interface R34AutocompleteItem {
  label: string;
  value: string;
  type: string;
}

export class Rule34Provider implements IBooruProvider {
  readonly id = "rule34";
  readonly name = "Rule34.xxx";
  private readonly baseUrl = "https://api.rule34.xxx/index.php";

  getDefaultApiEndpoint(): string {
    return `${this.baseUrl}?page=dapi&s=post&q=index`;
  }

  formatTag(tag: string, type: ArtistType): string {
    const cleanTag = tag.trim().toLowerCase().replace(/ /g, "_");
    if (type === "uploader") return `user:${cleanTag}`;
    return cleanTag;
  }

  async checkAuth(settings: ProviderSettings): Promise<boolean> {
    if (!settings.userId || !settings.apiKey) return false;
    
    try {
      const params = new URLSearchParams({
        page: "dapi",
        s: "post",
        q: "index",
        limit: "1",
        json: "1",
        user_id: settings.userId,
        api_key: settings.apiKey,
      });

      const { data, status } = await axios.get(`${this.baseUrl}?${params}`, {
        timeout: AUTOCOMPLETE_TIMEOUT,
        headers: { 
          "User-Agent": USER_AGENT,
          "Accept-Encoding": "identity" 
        }
      });

      return status === 200 && Array.isArray(data);
    } catch (error) {
      logger.error("[Rule34Provider] Auth check failed", error);
      return false;
    }
  }

  async searchTags(query: string, signal?: AbortSignal): Promise<SearchResults[]> {
    if (query.length < 2) return [];
    try {
      const { data } = await axios.get<R34AutocompleteItem[]>(
        `https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(query)}`,
        { signal }
      );
      if (Array.isArray(data)) {
        return data.map((item) => ({
          id: item.value,
          label: item.label,
          value: item.value,
          type: item.type
        }));
      }
      return [];
    } catch (error) {
      if (axios.isCancel(error)) {
        return []; // Request was cancelled, return empty array
      }
      logger.error("[Rule34Provider] Autocomplete failed", error);
      return [];
    }
  }

  async fetchPosts(tags: string, page: number, settings: ProviderSettings): Promise<BooruPost[]> {
    const params = new URLSearchParams();
    
    // Add required parameters first
    params.append("page", "dapi");
    params.append("s", "post");
    params.append("q", "index");
    params.append("json", "1");
    
    // Add tags parameter early (before limit/pid) - some APIs are sensitive to parameter order
    // Only add tags parameter if provided and not empty
    // Empty tags or "all" means show all posts (omit tags parameter)
    if (tags && tags.trim() !== "" && tags.trim().toLowerCase() !== "all") {
      params.append("tags", tags);
    }
    
    // Add pagination parameters
    // Maximum limit is 1000 per API documentation
    params.append("limit", "1000");
    params.append("pid", page.toString());

    // Add authentication last (some APIs prefer auth params at the end)
    if (settings.userId && settings.apiKey) {
      params.append("user_id", settings.userId);
      params.append("api_key", settings.apiKey);
    }

    const url = `${this.baseUrl}?${params}`;
    const safeUrl = url.replace(/api_key=[^&]+/, 'api_key=***').replace(/user_id=[^&]+/, 'user_id=***');
    logger.info(`[Rule34Provider] Fetching posts: ${safeUrl}`);
    logger.info(`[Rule34Provider] Tags parameter value: "${tags}"`);
    logger.info(`[Rule34Provider] Tags parameter after URL encoding: "${params.get('tags') || 'N/A'}"`);
    
    let responseData: unknown;
    try {
      const response = await axios.get<unknown>(url, {
        timeout: REQUEST_TIMEOUT,
        headers: { 
          "User-Agent": USER_AGENT,
          "Accept-Encoding": "identity"
        }
      });
      responseData = response.data;
      
      // Log raw response for debugging empty results
      if (tags && (!Array.isArray(responseData) || (Array.isArray(responseData) && responseData.length === 0))) {
        logger.warn(`[Rule34Provider] Raw API response for tags "${tags}":`, {
          type: typeof responseData,
          isArray: Array.isArray(responseData),
          length: Array.isArray(responseData) ? responseData.length : 'N/A',
          preview: typeof responseData === 'object' && responseData !== null 
            ? JSON.stringify(responseData).substring(0, 500)
            : String(responseData).substring(0, 200)
        });
      }
    } catch (error) {
      logger.error(`[Rule34Provider] API request failed for tags "${tags}":`, error);
      throw error;
    }

    if (!Array.isArray(responseData)) {
      logger.warn(`[Rule34Provider] API returned non-array response for tags "${tags}":`, typeof responseData);
      if (typeof responseData === 'object' && responseData !== null) {
        logger.warn(`[Rule34Provider] Response object:`, JSON.stringify(responseData).substring(0, 500));
      }
      return [];
    }
    
    logger.info(`[Rule34Provider] API returned ${responseData.length} posts for tags "${tags}" (page ${page})`);
    
    if (responseData.length === 0 && tags) {
      // Log full URL for debugging (credentials already masked)
      logger.warn(
        `[Rule34Provider] ⚠️ Empty result for tags "${tags}". ` +
        `URL was: ${safeUrl}. ` +
        `This may indicate: 1) Tag doesn't exist in API (but exists on website), 2) Tag format issue, 3) API rate limiting, 4) API key/user_id issue. ` +
        `Note: Some tags may exist on the website but not be available via API yet. ` +
        `Try testing the URL directly in browser (replace api.rule34.xxx with rule34.xxx and use page=post&s=list instead of page=dapi&s=post&q=index)`
      );
      
      // Try to verify if tag exists in API by checking tag metadata endpoint
      // This is a diagnostic check, not a fix
      if (settings.apiKey && settings.userId) {
        try {
          const tagCheckParams = new URLSearchParams({
            page: 'dapi',
            s: 'tag',
            q: 'index',
            json: '1',
            name: tags.split(' ')[0], // Check first tag only
          });
          tagCheckParams.append('api_key', settings.apiKey);
          tagCheckParams.append('user_id', settings.userId);
          
          const tagCheckUrl = `https://api.rule34.xxx/index.php?${tagCheckParams.toString()}`;
          const tagResponse = await axios.get<unknown>(tagCheckUrl, {
            timeout: 5000,
            headers: { 
              "User-Agent": USER_AGENT,
              "Accept-Encoding": "identity"
            }
          });
          
          if (Array.isArray(tagResponse.data) && tagResponse.data.length > 0) {
            logger.info(`[Rule34Provider] Tag "${tags.split(' ')[0]}" exists in API tag metadata, but no posts found. This may indicate a sync issue between website and API.`);
          } else {
            logger.warn(
              `[Rule34Provider] Tag "${tags.split(' ')[0]}" not found in API tag metadata. ` +
              `This tag exists on the website but is not yet synced to the API. ` +
              `This is a limitation of the Rule34 API - some tags may appear on the website before they are available via API. ` +
              `You can view posts with this tag directly on the website: https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(tags.split(' ')[0])}`
            );
          }
        } catch (tagCheckError) {
          logger.debug(`[Rule34Provider] Could not verify tag existence:`, tagCheckError);
        }
      }
    }
    
    const data = responseData;

    // Validate posts individually to handle partial failures gracefully
    // If we use z.array() and one post fails, the entire array fails
    // Instead, we validate each post and collect valid ones
    const validatedPosts: R34RawPost[] = [];
    const validationErrors: z.ZodError[] = [];

    for (const raw of data) {
      const result = R34RawPostSchema.safeParse(raw);
      if (result.success) {
        validatedPosts.push(result.data);
      } else {
        validationErrors.push(result.error);
      }
    }

    // Log validation errors if any, but continue with valid posts
    if (validationErrors.length > 0) {
      logger.warn(
        `[Rule34Provider] ${validationErrors.length} posts failed validation out of ${data.length} total`,
        { 
          totalPosts: data.length,
          validPosts: validatedPosts.length,
          invalidPosts: validationErrors.length,
          sampleErrors: validationErrors.slice(0, 3).map(e => e.errors)
        }
      );
    }

    return validatedPosts
      .map((raw) => this.mapToBooruPost(raw))
      .filter((post): post is BooruPost => post !== null);
  }

  private mapToBooruPost(raw: R34RawPost): BooruPost | null {
    // Data is already validated through Zod schema, but we still need to handle edge cases
    const fileUrl = raw.file_url.trim();
    if (!fileUrl) {
      logger.warn("[Rule34Provider] Skipping post with empty file_url", { id: raw.id });
      return null;
    }

    const preview = selectBestPreview({
      preview: raw.preview_url,
      sample: raw.sample_url,
      file: raw.file_url,
    });

    // selectBestPreview should always return a valid URL if file_url exists
    // But we check anyway for safety - if empty, use file_url as fallback
    const finalPreview = (preview && preview.trim() !== "") ? preview : fileUrl;
    
    if (!finalPreview || finalPreview.trim() === "") {
      logger.warn("[Rule34Provider] Skipping post with empty previewUrl and file_url", { id: raw.id });
      return null;
    }

    // Date parsing with validation (Rule34 uses Unix timestamp in 'change' field)
    let createdAt = new Date();
    if (raw.change && raw.change > 0) {
      const parsedDate = new Date(raw.change * 1000);
      if (!isNaN(parsedDate.getTime())) {
        createdAt = parsedDate;
      } else {
        logger.warn(`[Rule34Provider] Invalid timestamp for post ${raw.id}: ${raw.change}`);
      }
    }

    // Normalize rating using shared utility (removes need for 'as' casting)
    const rating = normalizeRating(raw.rating);

    return {
      id: raw.id,
      fileUrl: fileUrl,
      sampleUrl: (raw.sample_url || raw.file_url).trim(),
      previewUrl: finalPreview,
      tags: raw.tags.split(" ").filter(Boolean),
      rating: rating,
      score: raw.score ?? 0,
      source: raw.source ?? "",
      width: raw.width ?? 0,
      height: raw.height ?? 0,
      createdAt: createdAt,
    };
  }
}
