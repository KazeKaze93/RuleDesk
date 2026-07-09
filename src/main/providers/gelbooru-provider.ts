import axios from "axios";
import { logger } from "../lib/logger";
import { selectBestPreview } from "../lib/media-utils";
import { REQUEST_TIMEOUT } from "../config/constants";
import { IBooruProvider, BooruPost, ProviderSettings, SearchResults } from "./types";
import type { ArtistType } from "../db/schema";
import { GelbooruRawPostSchema, type GelbooruRawPost } from "../../shared/schemas/booru";
import { normalizeRating } from "../../shared/utils/post-normalization";
import {
  sanitizeProviderTagQuery,
  sanitizeProviderTagToken,
} from "../../shared/utils/provider-tag-sanitize";
import { MAX_RANDOM_PAGES } from "../../shared/constants";
import { z } from "zod";
import { ProviderThrottle, pickRandomUA } from "./provider-throttle";
import { getProxyAgent } from "../lib/proxy";

export class GelbooruProvider implements IBooruProvider {
  readonly id = "gelbooru";
  readonly name = "Gelbooru";
  readonly allowedDomains = [
    "gelbooru.com",
    "img1.gelbooru.com",
    "img2.gelbooru.com",
    "img3.gelbooru.com",
  ];
  private readonly baseUrl = "https://gelbooru.com/index.php";
  private readonly throttle = new ProviderThrottle();
  private readonly sessionUA = pickRandomUA();

  getDefaultApiEndpoint(): string {
    return `${this.baseUrl}?page=dapi&s=post&q=index`;
  }

  formatTag(tag: string, type: ArtistType): string {
    const safe = sanitizeProviderTagToken(tag);
    // Gelbooru format is mostly same as R34, usually lowercase with underscores
    const cleanTag = safe.trim().toLowerCase().replace(/ /g, "_");
    if (type === "uploader") return `user:${cleanTag}`; // Gelbooru mostly ignores user search in standard API, but we keep format
    return cleanTag;
  }

  async checkAuth(settings: ProviderSettings): Promise<boolean> {
    // Gelbooru allows anonymous access for basic stuff, but lets check if creds work
    // Note: Gelbooru uses &api_key=...&user_id=... similar to R34
    if (!settings.userId || !settings.apiKey) return true; // Anonymous is OK for Gelbooru check

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

      const { status, data } = await axios.get(`${this.baseUrl}?${params}`, {
        timeout: REQUEST_TIMEOUT,
        headers: { "User-Agent": this.sessionUA },
        httpsAgent: getProxyAgent(),
      });

      // Gelbooru sometimes returns empty array or object with post array
      return status === 200 && (Array.isArray(data) || !!data?.post);
    } catch (error) {
      logger.error("[GelbooruProvider] Auth check failed", error);
      return false;
    }
  }

  async searchTags(query: string, signal?: AbortSignal): Promise<SearchResults[]> {
    const safeQuery = sanitizeProviderTagQuery(query);
    if (safeQuery.length < 2) return [];
    try {
      const params = new URLSearchParams({
        page: "autocomplete2",
        term: safeQuery,
        type: "tag_query",
        limit: "20",
      });
      const { data } = await axios.get(
        `https://gelbooru.com/index.php?${params.toString()}`,
        {
          signal,
          headers: { "User-Agent": this.sessionUA },
          httpsAgent: getProxyAgent(),
        }
      );
      
      if (Array.isArray(data)) {
        // Gelbooru format: [{"value":"tag_name","label":"tag_name (123)","type":"0"}]
        const results: SearchResults[] = [];
        for (const item of data) {
          if (
            typeof item === "object" &&
            item !== null &&
            "value" in item &&
            "label" in item &&
            typeof (item as { value: unknown }).value === "string" &&
            typeof (item as { label: unknown }).label === "string"
          ) {
            const typed = item as {
              value: string;
              label: string;
              category?: string;
              type?: string;
            };
            results.push({
              id: typed.value,
              label: typed.label,
              value: typed.value,
              type: typed.category || typed.type,
            });
          }
        }
        return results;
      }
      return [];
    } catch (error) {
      if (axios.isCancel(error)) {
        return []; // Request was cancelled, return empty array
      }
      logger.error("[GelbooruProvider] Autocomplete failed", error);
      return [];
    }
  }

  async fetchPosts(
    tags: string,
    page: number,
    settings: ProviderSettings,
    isRandom: boolean = false,
    limit: number = 100
  ): Promise<BooruPost[]> {
    await this.throttle.wait();

    // Pseudo-random fallback: If isRandom is true, use a random page number (1-MAX_RANDOM_PAGES) for better randomization
    // NOTE: This is a fallback approach. True randomization on large datasets in Booru APIs
    // should be done via API's native sort:random parameter if the provider supports it.
    // If the provider doesn't support native randomization, this pseudo-random approach
    // provides reasonable distribution across pages (1-MAX_RANDOM_PAGES) for better variety.
    const apiPage = isRandom ? Math.floor(Math.random() * MAX_RANDOM_PAGES) + 1 : page;
    const pageLimit = Math.min(1000, Math.max(1, limit));

    const safeTags = sanitizeProviderTagQuery(tags);
    // Gelbooru pages are 0-indexed usually, but let's stick to pid logic
    const params = new URLSearchParams({
      page: "dapi",
      s: "post",
      q: "index",
      limit: String(pageLimit),
      pid: apiPage.toString(),
      tags: safeTags,
      json: "1",
    });

    if (settings.userId && settings.apiKey) {
      params.append("user_id", settings.userId);
      params.append("api_key", settings.apiKey);
    }

    try {
      const response = await axios.get(`${this.baseUrl}?${params}`, {
        timeout: REQUEST_TIMEOUT,
        headers: { "User-Agent": this.sessionUA },
        validateStatus: (status) => status === 200,
        httpsAgent: getProxyAgent(),
      });

      // Gelbooru sometimes returns XML instead of JSON when API fails
      const rawContentType = response.headers["content-type"];
      const contentType =
        typeof rawContentType === "string" ? rawContentType : "";
      if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
        logger.warn(`[Gelbooru] Unexpected Content-Type: ${contentType}. Expected JSON.`);
        return [];
      }

      const { data } = response;
      let rawPosts: unknown[] = [];
      
      // Gelbooru JSON API is inconsistent. It might return:
      // 1. Array of objects directly
      // 2. Object { post: [...] }
      // 3. Object { post: { ... } } (if single result)
      
      if (Array.isArray(data)) {
        rawPosts = data;
      } else if (data && typeof data === "object" && data !== null && "post" in data) {
        // Type guard: check if data has 'post' property
        const dataWithPost = data as { post: unknown };
        const postData = dataWithPost.post;
        if (Array.isArray(postData)) {
          rawPosts = postData;
        } else if (postData && typeof postData === "object") {
          rawPosts = [postData];
        }
      }

      // Validate posts individually to handle partial failures gracefully
      // If we use z.array() and one post fails, the entire array fails
      // Instead, we validate each post and collect valid ones
      const validatedPosts: GelbooruRawPost[] = [];
      const validationErrors: z.ZodError[] = [];

      for (const raw of rawPosts) {
        const result = GelbooruRawPostSchema.safeParse(raw);
        if (result.success) {
          validatedPosts.push(result.data);
        } else {
          validationErrors.push(result.error);
        }
      }

      // Log validation errors if any, but continue with valid posts
      if (validationErrors.length > 0) {
        logger.warn(
          `[GelbooruProvider] ${validationErrors.length} posts failed validation out of ${rawPosts.length} total`,
          { 
            totalPosts: rawPosts.length,
            validPosts: validatedPosts.length,
            invalidPosts: validationErrors.length,
            sampleErrors: validationErrors.slice(0, 3).map(e => e.errors)
          }
        );
      }

      const posts = validatedPosts
        .map((raw) => this.mapToBooruPost(raw))
        .filter((post): post is BooruPost => post !== null);
      
      // If isRandom is true, shuffle the results array
      if (isRandom && posts.length > 1) {
        for (let i = posts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [posts[i], posts[j]] = [posts[j], posts[i]];
        }
      }
      
      return posts;
    } catch (error) {
       logger.error(`[Gelbooru] Error fetching page ${page}`, error);
       return [];
    }
  }

  private mapToBooruPost(raw: GelbooruRawPost): BooruPost | null {
    // Data is already validated through Zod schema, but we still need to handle edge cases
    const fileUrl = raw.file_url.trim();
    if (!fileUrl) {
      logger.warn("[GelbooruProvider] Skipping post with empty file_url", { id: raw.id });
      return null;
    }

    const sampleUrl = raw.sample_url?.trim() || fileUrl;
    
    // Select best preview using shared utility
    const previewUrl = selectBestPreview({
      preview: raw.preview_url,
      sample: raw.sample_url,
      file: raw.file_url,
    });
    
    // Date parsing with validation
    let date = new Date();
    if (raw.created_at) {
      const parsedDate = new Date(raw.created_at);
      // Check if date is valid (Invalid Date returns NaN for getTime())
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate;
      } else {
        logger.warn(`[GelbooruProvider] Invalid date for post ${raw.id}: ${raw.created_at}`);
      }
    }

    // Normalize rating using shared utility (removes need for manual validation)
    const rating = normalizeRating(raw.rating);

    return {
      id: raw.id,
      fileUrl: fileUrl,
      sampleUrl: sampleUrl,
      previewUrl: previewUrl,
      tags: raw.tags ? raw.tags.split(" ").filter(Boolean) : [],
      rating: rating,
      score: raw.score ?? 0,
      source: "Gelbooru",
      width: raw.width ?? 0,
      height: raw.height ?? 0,
      createdAt: date,
    };
  }
}


