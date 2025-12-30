import axios from "axios";
import { logger } from "../lib/logger";
import { selectBestPreview } from "../lib/media-utils";
import { USER_AGENT, REQUEST_TIMEOUT, AUTOCOMPLETE_TIMEOUT } from "../config/constants";
import { IBooruProvider, BooruPost, ProviderSettings, SearchResults } from "./types";
import type { ArtistType } from "../db/schema";

interface R34RawPost {
  id: number;
  file_url: string;
  sample_url: string;
  preview_url: string;
  tags: string;
  rating: string;
  change: number;
  score: number;
  source: string;
  width: number;
  height: number;
}

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

    const { data } = await axios.get<R34RawPost[]>(`${this.baseUrl}?${params}`, {
      timeout: REQUEST_TIMEOUT,
      headers: { 
        "User-Agent": USER_AGENT,
        "Accept-Encoding": "identity"
      }
    });

    if (!Array.isArray(data)) return [];

    return data.map(raw => this.mapToBooruPost(raw)).filter((post): post is BooruPost => post !== null);
  }

  private mapToBooruPost(raw: R34RawPost): BooruPost | null {
    // Validate critical fields before creating post object
    if (!raw.file_url || typeof raw.file_url !== "string" || raw.file_url.trim() === "") {
      logger.warn("[Rule34Provider] Skipping post with missing file_url", { id: raw.id });
      return null;
    }

    if (!raw.id || isNaN(Number(raw.id))) {
      logger.warn("[Rule34Provider] Skipping post with invalid id", { raw });
      return null;
    }

    const preview = selectBestPreview({
      preview: raw.preview_url,
      sample: raw.sample_url,
      file: raw.file_url,
    });

    // Date parsing with validation (Rule34 uses Unix timestamp in 'change' field)
    let createdAt = new Date();
    if (raw.change && typeof raw.change === "number" && raw.change > 0) {
      const parsedDate = new Date(raw.change * 1000);
      if (!isNaN(parsedDate.getTime())) {
        createdAt = parsedDate;
      } else {
        logger.warn(`[Rule34Provider] Invalid timestamp for post ${raw.id}: ${raw.change}`);
      }
    }

    return {
      id: Number(raw.id),
      fileUrl: raw.file_url.trim(),
      sampleUrl: (raw.sample_url || raw.file_url).trim(),
      previewUrl: preview,
      tags: raw.tags.split(" ").filter(Boolean),
      rating: raw.rating as "s" | "q" | "e",
      score: raw.score,
      source: raw.source,
      width: raw.width,
      height: raw.height,
      createdAt: createdAt,
    };
  }
}
