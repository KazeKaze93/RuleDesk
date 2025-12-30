import axios from "axios";
import { logger } from "../lib/logger";
import { selectBestPreview } from "../lib/media-utils";
import { USER_AGENT, REQUEST_TIMEOUT } from "../config/constants";
import { IBooruProvider, BooruPost, ProviderSettings, SearchResults } from "./types";
import type { ArtistType } from "../db/schema";
import { GelbooruRawPostSchema, type GelbooruRawPost } from "../../shared/schemas/booru";
import { normalizeRating } from "../../shared/utils/post-normalization";
import { z } from "zod";

export class GelbooruProvider implements IBooruProvider {
  readonly id = "gelbooru";
  readonly name = "Gelbooru";
  private readonly baseUrl = "https://gelbooru.com/index.php";

  getDefaultApiEndpoint(): string {
    return `${this.baseUrl}?page=dapi&s=post&q=index`;
  }

  formatTag(tag: string, type: ArtistType): string {
    // Gelbooru format is mostly same as R34, usually lowercase with underscores
    const cleanTag = tag.trim().toLowerCase().replace(/ /g, "_");
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
        headers: { "User-Agent": USER_AGENT }
      });

      // Gelbooru sometimes returns empty array or object with post array
      return status === 200 && (Array.isArray(data) || !!data?.post);
    } catch (error) {
      logger.error("[GelbooruProvider] Auth check failed", error);
      return false;
    }
  }

  async searchTags(query: string, signal?: AbortSignal): Promise<SearchResults[]> {
    if (query.length < 2) return [];
    try {
      // Gelbooru uses specific autocomplete endpoint
      const { data } = await axios.get(
        `https://gelbooru.com/index.php?page=autocomplete2&term=${encodeURIComponent(query)}&type=tag_query&limit=20`,
        { signal }
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

  async fetchPosts(tags: string, page: number, settings: ProviderSettings): Promise<BooruPost[]> {
    // Gelbooru pages are 0-indexed usually, but let's stick to pid logic
    const params = new URLSearchParams({
      page: "dapi",
      s: "post",
      q: "index",
      limit: "100",
      pid: page.toString(),
      tags: tags,
      json: "1",
    });

    if (settings.userId && settings.apiKey) {
      params.append("user_id", settings.userId);
      params.append("api_key", settings.apiKey);
    }

    try {
      const response = await axios.get(`${this.baseUrl}?${params}`, {
        timeout: REQUEST_TIMEOUT,
        headers: { "User-Agent": USER_AGENT },
        validateStatus: (status) => status === 200,
      });

      // Gelbooru sometimes returns XML instead of JSON when API fails
      const contentType = response.headers["content-type"] || "";
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

      return validatedPosts
        .map((raw) => this.mapToBooruPost(raw))
        .filter((post): post is BooruPost => post !== null);
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


