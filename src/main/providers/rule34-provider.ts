import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { logger } from "../lib/logger";
import { selectBestPreview } from "../lib/media-utils";
import { isRecord } from "../../shared/utils/type-guards";
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
import {
  ProviderThrottle,
  pickRandomUA,
  ProviderRateLimitGateError,
  isAbortError,
} from "./provider-throttle";
import { ProviderSearchError, isProviderSearchError } from "./provider-search-errors";
import { getProxyAgent } from "../lib/proxy";
import { redactErrorForLog } from "../lib/redact-error";
import {
  assertRule34NotBlockedResponse,
  isAxiosTransportFailure,
  isRule34PostsXml,
  logRule34ResponseBodySnippet,
  toRule34HttpResponseFromAxiosError,
  toRule34HttpResponseFromAxiosSuccess,
  type Rule34HttpResponse,
} from "./rule34-post-response";
import { warnIfUnknownMediaHost } from "./warn-unknown-media-host";

/**
 * Live autocomplete.php (2026-08-13 probe: q=wlop / hatsune_miku / genshin_impact)
 * returns only `{ label, value }`. `type` is absent — not a tag category.
 * Do not use it for artist filtering; Add Artist uses DAPI second-pass instead.
 */
interface R34AutocompleteItem {
  label: string;
  value: string;
  type?: string;
}

export class Rule34Provider implements IBooruProvider {
  readonly id = "rule34";
  readonly name = "Rule34.xxx";
  /** Exact hosts for CSP (`getAllProviderDomains`); API + CDN, no suffix wildcard. */
  readonly allowedDomains = [
    "rule34.xxx",
    "api.rule34.xxx",
    "img.rule34.xxx",
    "wimg.rule34.xxx",
    "us.rule34.xxx",
    "api-cdn.rule34.xxx",
    "api-cdn-mp4.rule34.xxx",
  ];
  /** Media CDN hosts for video-proxy; excludes the API host. */
  readonly cdnDomains = [
    "rule34.xxx",
    "img.rule34.xxx",
    "wimg.rule34.xxx",
    "us.rule34.xxx",
    "api-cdn.rule34.xxx",
    "api-cdn-mp4.rule34.xxx",
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

  /** Shared throttle for post search and tag metadata lookups. */
  getRequestThrottle(): ProviderThrottle {
    return this.throttle;
  }

  getRequestHeaders(): Record<string, string> {
    return this.getHeaders();
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
      logger.error("[Rule34Provider] Auth check failed", redactErrorForLog(error));
      return false;
    }
  }

  private async waitForUserSlot(signal?: AbortSignal): Promise<void> {
    try {
      await this.throttle.wait("user", signal);
    } catch (error) {
      if (error instanceof ProviderRateLimitGateError) {
        throw new ProviderSearchError("rate_limit", undefined, error.retryAfterMs);
      }
      throw error;
    }
  }

  private notifyIfRateLimited(error: unknown): void {
    if (isProviderSearchError(error) && error.kind === "rate_limit") {
      this.throttle.notifyRateLimited(error.retryAfterMs);
    }
  }

  async searchTags(
    query: string,
    signal?: AbortSignal
  ): Promise<SearchResults[]> {
    const safeQuery = sanitizeProviderTagQuery(query);
    if (safeQuery.length < 2) return [];
    try {
      await this.waitForUserSlot(signal);
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
          ...(typeof item.type === "string" && item.type.length > 0
            ? { type: item.type }
            : {}),
        }));
      }
      return [];
    } catch (error) {
      if (axios.isCancel(error) || isAbortError(error)) {
        return [];
      }
      if (error instanceof ProviderSearchError) {
        throw error;
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
    limit: number;
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
    
    params.append("limit", String(Math.min(1000, Math.max(1, options.limit))));
    params.append("pid", pid.toString());

    if (options.settings.userId && options.settings.apiKey) {
      params.append("user_id", options.settings.userId);
      params.append("api_key", options.settings.apiKey);
    }
    logger.debug("[Rule34Provider] buildUrl auth params", {
      hasApiKey: (options.settings.apiKey ?? "").trim().length > 0,
      hasUserId: (options.settings.userId ?? "").trim().length > 0,
      includesApiKeyParam: params.has("api_key"),
      includesUserIdParam: params.has("user_id"),
    });

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
    isRandom: boolean,
    limit: number
  ): Promise<BooruPost[]> {
    await this.waitForUserSlot();

    const apiPage = isRandom
      ? Math.floor(Math.random() * MAX_RANDOM_PAGES) + 1
      : page;
    const pageLimit = Math.min(1000, Math.max(1, limit));

    let jsonFailure: ProviderSearchError | null = null;

    try {
      const jsonResponse = await this.requestPostSearchResponse({
        tags,
        page: apiPage,
        settings,
        json: 1,
        limit: pageLimit,
      });
      assertRule34NotBlockedResponse(jsonResponse);
      const posts = this.parseJsonPostSearchResponse(jsonResponse.text, tags);
      return this.maybeShufflePosts(posts, isRandom);
    } catch (error) {
      this.notifyIfRateLimited(error);
      if (isProviderSearchError(error)) {
        if (
          error.kind === "rate_limit" ||
          error.kind === "auth" ||
          error.kind === "network"
        ) {
          throw error;
        }
        jsonFailure = error;
      } else if (isAxiosTransportFailure(error)) {
        throw new ProviderSearchError("network");
      } else {
        jsonFailure = new ProviderSearchError("parse");
      }
    }

    logger.warn(
      `[Rule34Provider] JSON API failed for tags "${tags}"${
        jsonFailure ? ` (${jsonFailure.message})` : ""
      }. Retrying with XML...`
    );

    try {
      const xmlResponse = await this.requestPostSearchResponse({
        tags,
        page: apiPage,
        settings,
        json: 0,
        limit: pageLimit,
      });
      assertRule34NotBlockedResponse(xmlResponse);
      const posts = this.parseXmlPostSearchResponse(xmlResponse.text);
      logger.warn(
        `[Rule34Provider] Recovered ${posts.length} posts via XML fallback.`
      );
      return this.maybeShufflePosts(posts, isRandom);
    } catch (error) {
      this.notifyIfRateLimited(error);
      if (isProviderSearchError(error)) {
        throw error;
      }
      if (isAxiosTransportFailure(error)) {
        throw new ProviderSearchError("network");
      }
      throw jsonFailure ?? new ProviderSearchError("parse");
    }
  }

  private maybeShufflePosts(
    posts: BooruPost[],
    isRandom: boolean
  ): BooruPost[] {
    if (!isRandom || posts.length <= 1) {
      return posts;
    }
    const shuffled = [...posts];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async requestPostSearchResponse(options: {
    tags: string;
    page: number;
    settings: ProviderSettings;
    json: 0 | 1;
    limit: number;
  }): Promise<Rule34HttpResponse> {
    const url = this.buildUrl(options);
    try {
      const response = await axios.get<string>(url, {
        timeout: REQUEST_TIMEOUT,
        headers: this.getHeaders(),
        responseType: "text",
        validateStatus: (status) => status < 500,
        httpsAgent: getProxyAgent(),
      });
      return toRule34HttpResponseFromAxiosSuccess({
        status: response.status,
        headers: response.headers,
        data: response.data ?? "",
      });
    } catch (error) {
      const httpResponse = toRule34HttpResponseFromAxiosError(error);
      if (httpResponse) {
        return httpResponse;
      }
      throw error;
    }
  }

  private parseJsonPostSearchResponse(text: string, tags: string): BooruPost[] {
    if (!text || text.trim().length === 0) {
      logRule34ResponseBodySnippet(
        `Empty JSON response for tags "${tags}"`,
        text
      );
      throw new ProviderSearchError("parse");
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      logRule34ResponseBodySnippet(
        `Invalid JSON for tags "${tags}"`,
        text
      );
      logger.warn("[Rule34Provider] JSON parse failed:", parseError);
      throw new ProviderSearchError("parse");
    }

    if (!Array.isArray(json)) {
      logRule34ResponseBodySnippet(
        `Non-array JSON for tags "${tags}"`,
        text
      );
      throw new ProviderSearchError("parse");
    }

    return this.normalizePosts(json);
  }

  private parseXmlPostSearchResponse(text: string): BooruPost[] {
    if (!text || text.trim().length === 0) {
      logRule34ResponseBodySnippet("Empty XML response", text);
      throw new ProviderSearchError("parse");
    }

    const posts = this.parsePostXml(text);
    if (posts.length === 0 && !isRule34PostsXml(text)) {
      logRule34ResponseBodySnippet("Unrecognized XML/HTML response", text);
      throw new ProviderSearchError("parse");
    }
    return posts;
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
        .filter((p: BooruPost | null): p is BooruPost => p !== null);

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
    if (!isRecord(raw)) return null;
    const post = raw;

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
    warnIfUnknownMediaHost(fileUrl, this);

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
    warnIfUnknownMediaHost(fileUrl, this);

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
