import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { logger } from "../lib/logger";
import { selectBestPreview } from "../lib/media-utils";
import {
  REQUEST_TIMEOUT,
  AUTOCOMPLETE_TIMEOUT,
} from "../config/constants";
import {
  IBooruProvider,
  BooruPost,
  ProviderSettings,
  SearchResults,
} from "./types";
import type { ArtistType } from "../db/schema";
import { R34RawPostSchema, type R34RawPost } from "../../shared/schemas/booru";
import { normalizeRating } from "../../shared/utils/post-normalization";
import {
  sanitizeProviderTagQuery,
  sanitizeProviderTagToken,
} from "../../shared/utils/provider-tag-sanitize";
import { MAX_RANDOM_PAGES } from "../../shared/constants";
import { z } from "zod";
import { ProviderThrottle, pickRandomUA } from "./provider-throttle";
import { getProxyAgent } from "../lib/proxy";

interface R34AutocompleteItem {
  label: string;
  value: string;
  type: string;
}

export class Rule34Provider implements IBooruProvider {
  readonly id = "rule34";
  readonly name = "Rule34.xxx";
  readonly allowedDomains = [
    "rule34.xxx",
    "api.rule34.xxx",
    "img.rule34.xxx",
    "wimg.rule34.xxx",
    "us.rule34.xxx",
    "api-cdn.rule34.xxx",
  ];
  private readonly baseUrl = "https://api.rule34.xxx/index.php";
  private readonly throttle = new ProviderThrottle();
  private readonly sessionUA = pickRandomUA();

  /**
   * XML Parser with correct settings for Rule34 API
   * Rule34 stores all data in attributes, so we need to read them without prefix
   */
  private readonly parser = new XMLParser({
    ignoreAttributes: false,       // ВАЖНО: читать атрибуты (Rule34 хранит всё там)
    attributeNamePrefix: "",       // ВАЖНО: не добавлять префиксы типа "@_"
    parseAttributeValue: true,     // Парсить числа и булевы значения автоматически
    trimValues: true,              // Обрезать пробелы в значениях
    textNodeName: "text",          // На всякий случай, если есть текст внутри тегов
  });

  /**
   * Get standard headers for API requests
   * Prevents API blocking by using consistent User-Agent and headers
   */
  private getHeaders() {
    return {
      "User-Agent": this.sessionUA,
      "Accept": "application/json, application/xml, text/html, */*",
      "Accept-Encoding": "identity",
      "Connection": "keep-alive",
    };
  }

  getDefaultApiEndpoint(): string {
    return `${this.baseUrl}?page=dapi&s=post&q=index`;
  }

  formatTag(tag: string, type: ArtistType): string {
    const safe = sanitizeProviderTagToken(tag);
    const cleanTag = safe.trim().toLowerCase().replace(/ /g, "_");
    
    // CRITICAL: Rule34 specific logic
    // 'uploader' -> search by who uploaded the file (requires 'user:' prefix)
    // 'artist' -> search by tag (NO prefix)
    if (type === "uploader") {
      return `user:${cleanTag}`;
    }
    
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
        headers: this.getHeaders(),
        httpsAgent: getProxyAgent(),
      });

      return status === 200 && Array.isArray(data);
    } catch (error) {
      logger.error("[Rule34Provider] Auth check failed", error);
      return false;
    }
  }

  async searchTags(
    query: string,
    signal?: AbortSignal
  ): Promise<SearchResults[]> {
    const safeQuery = sanitizeProviderTagQuery(query);
    if (safeQuery.length < 2) return [];
    try {
      await this.throttle.wait();
      const params = new URLSearchParams({ q: safeQuery });
      const { data } = await axios.get<R34AutocompleteItem[]>(
        `https://api.rule34.xxx/autocomplete.php?${params.toString()}`,
        {
          signal,
          timeout: AUTOCOMPLETE_TIMEOUT,
          headers: this.getHeaders(),
          httpsAgent: getProxyAgent(),
        }
      );
      if (Array.isArray(data)) {
        return data.map((item) => ({
          id: item.value,
          label: item.label,
          value: item.value,
          type: item.type,
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

  /**
   * Build URL for API request
   */
  private buildUrl(options: {
    tags: string;
    page: number;
    settings: ProviderSettings;
    json: 0 | 1;
  }): string {
    const params = new URLSearchParams();

    params.append("page", "dapi");
    params.append("s", "post");
    params.append("q", "index");
    params.append("json", options.json.toString());

    const tagQuery = sanitizeProviderTagQuery(options.tags);
    if (
      tagQuery &&
      tagQuery.trim() !== "" &&
      tagQuery.trim().toLowerCase() !== "all"
    ) {
      params.append("tags", tagQuery);
    }

    // FIX: Rule34 uses 0-based pagination for 'pid'.
    // If UI sends page 1, we must send pid=0.
    const pid = options.page > 0 ? options.page - 1 : 0;
    
    // Rule34 LIMIT is hardcapped at 1000 for standard API,
    // but typical browsing is lower. API ignores 'limit' param in some endpoints
    // if not strictly passed, but we keep it for consistency.
    params.append("limit", "1000");
    params.append("pid", pid.toString());

    if (options.settings.userId && options.settings.apiKey) {
      params.append("user_id", options.settings.userId);
      params.append("api_key", options.settings.apiKey);
    }

    return `${this.baseUrl}?${params}`;
  }

  /**
   * Normalize JSON posts to BooruPost format
   */
  private normalizePosts(json: unknown[]): BooruPost[] {
    const validatedPosts: R34RawPost[] = [];
    const validationErrors: z.ZodError[] = [];

    for (const raw of json) {
      const result = R34RawPostSchema.safeParse(raw);
      if (result.success) {
        validatedPosts.push(result.data);
      } else {
        validationErrors.push(result.error);
      }
    }

    if (validationErrors.length > 0) {
      logger.warn(
        `[Rule34Provider] ${validationErrors.length} posts failed validation out of ${json.length} total`,
        {
          totalPosts: json.length,
          validPosts: validatedPosts.length,
          invalidPosts: validationErrors.length,
          sampleErrors: validationErrors.slice(0, 3).map((e) => e.errors),
        }
      );
    }

    return validatedPosts
      .map((raw) => this.mapToBooruPost(raw))
      .filter((post): post is BooruPost => post !== null);
  }

  async fetchPosts(
    tags: string,
    page: number,
    settings: ProviderSettings,
    isRandom: boolean = false
  ): Promise<BooruPost[]> {
    await this.throttle.wait();

    // Pseudo-random fallback: If isRandom is true, use a random page number (1-MAX_RANDOM_PAGES) for better randomization
    // NOTE: This is a fallback approach. True randomization on large datasets in Booru APIs
    // should be done via API's native sort:random parameter if the provider supports it.
    // If the provider doesn't support native randomization, this pseudo-random approach
    // provides reasonable distribution across pages (1-MAX_RANDOM_PAGES) for better variety.
    const apiPage = isRandom ? Math.floor(Math.random() * MAX_RANDOM_PAGES) + 1 : page;
    
    // Step 1: Try JSON first
    const jsonUrl = this.buildUrl({ tags, page: apiPage, settings, json: 1 });

    try {
      const response = await axios
        .get<string>(jsonUrl, {
          timeout: REQUEST_TIMEOUT,
          headers: this.getHeaders(),
          responseType: "text",
          validateStatus: (status) => status < 500,
          httpsAgent: getProxyAgent(),
        })
        .then((result) => result);

      const text = response.data;

      // CRITICAL: Check for "Empty Response" bug
      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from JSON API");
      }

      // Try parsing JSON
      const json = JSON.parse(text);
      if (!Array.isArray(json)) {
        throw new Error("API returned non-array JSON");
      }

      const posts = this.normalizePosts(json);
      
      // If isRandom is true, shuffle the results array
      if (isRandom && posts.length > 1) {
        for (let i = posts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [posts[i], posts[j]] = [posts[j], posts[i]];
        }
      }
      
      return posts;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn(
        `[Rule34Provider] JSON API failed for tags "${tags}". Error: ${errorMessage}. Retrying with XML...`
      );

      // Step 2: FALLBACK TO XML
      try {
        const xmlUrl = this.buildUrl({ tags, page: apiPage, settings, json: 0 });
        const xmlResponse = await axios
          .get<string>(xmlUrl, {
            timeout: REQUEST_TIMEOUT,
            headers: this.getHeaders(),
            responseType: "text",
            validateStatus: (status) => status < 500,
            httpsAgent: getProxyAgent(),
          })
          .then((result) => result);

        const xmlText = xmlResponse.data;
        const posts = this.parsePostXml(xmlText);
        
        // If isRandom is true, shuffle the results array
        if (isRandom && posts.length > 1) {
          for (let i = posts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [posts[i], posts[j]] = [posts[j], posts[i]];
          }
        }
        
        logger.warn(
          `[Rule34Provider] Recovered ${posts.length} posts via XML fallback.`
        );
        return posts;
      } catch (xmlError) {
        logger.error("[Rule34Provider] XML Fallback failed:", xmlError);
        return [];
      }
    }
  }

  /**
   * Parse XML response from Rule34 API using fast-xml-parser
   * Returns BooruPost[] with strict camelCase field mapping for UI compatibility
   *
   * @param xml - Raw XML response text
   * @returns Array of parsed BooruPost objects
   */
  private parsePostXml(xml: string): BooruPost[] {
    try {
      const parsed = this.parser.parse(xml);

      // Handle different XML structures: <posts><post .../></posts> or <post .../>
      // Rule34 API returns: <posts count="..."><post id="..." file_url="..." .../></posts>
      // With attributeNamePrefix: "", parser returns: { posts: { post: [...] } }
      // Attributes are accessible directly: post.id, post.file_url, etc.
      let postsRaw = parsed.posts?.post;

      if (!postsRaw) {
        logger.warn("[Rule34Provider] No posts found in response (parsed.posts.post is undefined)");
        return [];
      }

      // If post is only one, parser returns object instead of array -> normalize
      if (!Array.isArray(postsRaw)) {
        postsRaw = [postsRaw];
      }

      // Map each raw post to BooruPost format
      const mappedPosts = postsRaw
        .map((raw: unknown) => this.mapPostFromXml(raw))
        .filter((p: BooruPost | null) => p !== null) as BooruPost[];

      return mappedPosts;
    } catch (error) {
      logger.error(`[Rule34Provider] Failed to parse XML posts:`, error);
      return [];
    }
  }

  /**
   * Map raw XML post object to BooruPost format
   * With attributeNamePrefix: "", attributes are accessible directly (raw.id, raw.file_url, etc.)
   *
   * @param raw - Raw post object from XML parser
   * @returns BooruPost object or null if invalid
   */
  private mapPostFromXml(raw: unknown): BooruPost | null {
    if (!raw || typeof raw !== "object") return null;

    // Type guard: ensure raw is a record with string keys
    const post = raw as Record<string, unknown>;

    // With attributeNamePrefix: "", attributes are accessible directly
    // No need for "@_" prefix - access post.id, post.file_url, etc.
    const id = post.id
      ? typeof post.id === "number"
        ? post.id
        : parseInt(String(post.id), 10)
      : null;
    
    if (!id || isNaN(id) || id <= 0) return null;

    const fileUrl = String(post.file_url || "").trim();
    if (!fileUrl) return null;

    // Map XML attributes directly to BooruPost format (camelCase)
    // Use selectBestPreview for previewUrl (fallback to fileUrl if preview_url missing)
    const previewUrl =
      selectBestPreview({
        preview: String(post.preview_url || ""),
        sample: String(post.sample_url || ""),
        file: fileUrl,
      }) || fileUrl; // Fallback to fileUrl if selectBestPreview returns empty

    const sampleUrl = String(post.sample_url || fileUrl).trim();
    // Ensure previewUrl is never empty (critical for UI display)
    const finalPreviewUrl = previewUrl.trim() || fileUrl;
    if (!finalPreviewUrl) return null; // Skip if still empty

    // Parse tags: split by space and filter empty strings
    const tags = String(post.tags || "")
      .split(" ")
      .filter(Boolean);

    // Normalize rating using shared utility
    const rating = normalizeRating(String(post.rating || "q"));

    // Parse numeric fields with fallbacks (parser may already parse them as numbers)
    const score = post.score
      ? typeof post.score === "number"
        ? post.score
        : parseInt(String(post.score), 10)
      : 0;
    const width = post.width
      ? typeof post.width === "number"
        ? post.width
        : parseInt(String(post.width), 10)
      : 0;
    const height = post.height
      ? typeof post.height === "number"
        ? post.height
        : parseInt(String(post.height), 10)
      : 0;

    // Date handling: XML may have created_at (string) or change (Unix timestamp)
    let createdAt = new Date();
    if (post.created_at) {
      const parsedDate = new Date(String(post.created_at));
      if (!isNaN(parsedDate.getTime())) {
        createdAt = parsedDate;
      }
    } else if (post.change) {
      const timestamp =
        typeof post.change === "number"
          ? post.change
          : parseInt(String(post.change), 10);
      if (timestamp > 0) {
        const parsedDate = new Date(timestamp * 1000);
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate;
        }
      }
    }

    // Build BooruPost object with strict camelCase mapping
    return {
      id: id,
      fileUrl: fileUrl,
      previewUrl: finalPreviewUrl,
      sampleUrl: sampleUrl,
      tags: tags,
      rating: rating,
      score: isNaN(score) ? 0 : score,
      source: String(post.source || "").trim(),
      width: isNaN(width) ? 0 : width,
      height: isNaN(height) ? 0 : height,
      createdAt: createdAt,
    };
  }

  private mapToBooruPost(raw: R34RawPost): BooruPost | null {
    // Data is already validated through Zod schema, but we still need to handle edge cases
    const fileUrl = raw.file_url.trim();
    if (!fileUrl) {
      logger.warn("[Rule34Provider] Skipping post with empty file_url", {
        id: raw.id,
      });
      return null;
    }

    const preview = selectBestPreview({
      preview: raw.preview_url,
      sample: raw.sample_url,
      file: raw.file_url,
    });

    // selectBestPreview should always return a valid URL if file_url exists
    // But we check anyway for safety - if empty, use file_url as fallback
    const finalPreview = preview && preview.trim() !== "" ? preview : fileUrl;
    const sampleUrl = (raw.sample_url || raw.file_url).trim();
    if (!finalPreview || finalPreview.trim() === "") {
      logger.warn(
        "[Rule34Provider] Skipping post with empty previewUrl and file_url",
        { id: raw.id }
      );
      return null;
    }

    // Date parsing with validation (Rule34 uses Unix timestamp in 'change' field)
    let createdAt = new Date();
    if (raw.change && raw.change > 0) {
      const parsedDate = new Date(raw.change * 1000);
      if (!isNaN(parsedDate.getTime())) {
        createdAt = parsedDate;
      } else {
        logger.warn(
          `[Rule34Provider] Invalid timestamp for post ${raw.id}: ${raw.change}`
        );
      }
    }

    // Normalize rating using shared utility (removes need for 'as' casting)
    const rating = normalizeRating(raw.rating);

    return {
      id: raw.id,
      fileUrl: fileUrl,
      sampleUrl: sampleUrl,
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
