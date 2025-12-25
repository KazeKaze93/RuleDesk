import axios from "axios";
import { logger } from "../lib/logger";
import { IBooruProvider, BooruPost, ProviderSettings, SearchResults } from "./types";

interface GelbooruRawPost {
  id: number;
  file_url: string;
  sample_url?: string;
  preview_url?: string;
  tags: string;
  rating: string;
  score: number;
  width: number;
  height: number;
  created_at: string; // Gelbooru returns formatted date string usually
}

export class GelbooruProvider implements IBooruProvider {
  readonly id = "gelbooru";
  readonly name = "Gelbooru";
  private readonly baseUrl = "https://gelbooru.com/index.php";

  formatTag(tag: string, type: "tag" | "uploader" | "query"): string {
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
        timeout: 10000,
        headers: { "User-Agent": "RuleDesk/1.5.0" }
      });

      // Gelbooru sometimes returns empty array or object with post array
      return status === 200 && (Array.isArray(data) || !!data?.post);
    } catch (error) {
      logger.error("[GelbooruProvider] Auth check failed", error);
      return false;
    }
  }

  async searchTags(query: string): Promise<SearchResults[]> {
    if (query.length < 2) return [];
    try {
      // Gelbooru uses specific autocomplete endpoint
      const { data } = await axios.get(`https://gelbooru.com/index.php?page=autocomplete2&term=${encodeURIComponent(query)}&type=tag_query&limit=20`);
      
      if (Array.isArray(data)) {
        // Gelbooru format: [{"value":"tag_name","label":"tag_name (123)","type":"0"}]
        const results: SearchResults[] = [];
        for (const item of data) {
          if (typeof item === "object" && item !== null && "value" in item && "label" in item) {
            const typed = item as { value: string; label: string; category?: string; type?: string };
            results.push({
              id: typed.value,
              label: typed.label,
              value: typed.value,
              type: typed.category || typed.type
            });
          }
        }
        return results;
      }
      return [];
    } catch (error) {
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
      const { data } = await axios.get(`${this.baseUrl}?${params}`, {
        timeout: 15000,
        headers: { "User-Agent": "RuleDesk/1.5.0" }
      });

      let rawPosts: GelbooruRawPost[] = [];
      
      // Gelbooru JSON API is inconsistent. It might return:
      // 1. Array of objects directly
      // 2. Object { post: [...] }
      // 3. Object { post: { ... } } (if single result)
      
      if (Array.isArray(data)) {
        rawPosts = data as GelbooruRawPost[];
      } else if (data && typeof data === "object" && "post" in data) {
        const postData = (data as { post: unknown }).post;
        if (Array.isArray(postData)) {
          rawPosts = postData as GelbooruRawPost[];
        } else if (postData && typeof postData === "object") {
          rawPosts = [postData as GelbooruRawPost];
        }
      }

      return rawPosts.map(raw => this.mapToBooruPost(raw));
    } catch (error) {
       logger.error(`[Gelbooru] Error fetching page ${page}`, error);
       return [];
    }
  }

  private mapToBooruPost(raw: GelbooruRawPost): BooruPost {
    // Safely extract fields as Gelbooru types are loose
    const id = Number(raw.id);
    const fileUrl = raw.file_url || "";
    const previewUrl = raw.preview_url || raw.file_url || "";
    const sampleUrl = raw.sample_url || raw.file_url || "";
    
    // Date parsing
    const date = raw.created_at ? new Date(raw.created_at) : new Date();

    // Validate rating - Gelbooru uses "safe", "questionable", "explicit" or "s", "q", "e"
    let rating: "s" | "q" | "e" = "q";
    if (raw.rating) {
      const firstChar = raw.rating.charAt(0).toLowerCase();
      if (firstChar === "s" || firstChar === "q" || firstChar === "e") {
        rating = firstChar;
      }
    }

    return {
      id: id,
      fileUrl: fileUrl,
      sampleUrl: sampleUrl,
      previewUrl: previewUrl,
      tags: raw.tags ? raw.tags.split(" ").filter(Boolean) : [],
      rating: rating,
      score: Number(raw.score) || 0,
      source: "Gelbooru",
      width: Number(raw.width) || 0,
      height: Number(raw.height) || 0,
      createdAt: date,
    };
  }
}

