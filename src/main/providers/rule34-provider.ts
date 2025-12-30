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
    const params = new URLSearchParams({
      page: "dapi",
      s: "post",
      q: "index",
      limit: "100",
      pid: page.toString(),
      json: "1",
    });
    
    // Only add tags parameter if provided and not empty
    // Empty tags or "all" means show all posts (omit tags parameter)
    if (tags && tags.trim() !== "" && tags.trim().toLowerCase() !== "all") {
      params.append("tags", tags);
    }

    if (settings.userId && settings.apiKey) {
      params.append("user_id", settings.userId);
      params.append("api_key", settings.apiKey);
    }

    const { data } = await axios.get<unknown>(`${this.baseUrl}?${params}`, {
      timeout: REQUEST_TIMEOUT,
      headers: { 
        "User-Agent": USER_AGENT,
        "Accept-Encoding": "identity"
      }
    });

    if (!Array.isArray(data)) return [];

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
