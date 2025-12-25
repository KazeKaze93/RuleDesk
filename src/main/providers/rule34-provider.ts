import axios from "axios";
import { logger } from "../lib/logger";
import { IBooruProvider, BooruPost, ProviderSettings, SearchResults } from "./types";

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

export class Rule34Provider implements IBooruProvider {
  readonly id = "rule34";
  readonly name = "Rule34.xxx";
  private readonly baseUrl = "https://api.rule34.xxx/index.php";

  formatTag(tag: string, type: "tag" | "uploader" | "query"): string {
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
        timeout: 10000,
        headers: { 
          "User-Agent": "RuleDesk/1.5.0",
          "Accept-Encoding": "identity" 
        }
      });

      return status === 200 && Array.isArray(data);
    } catch (error) {
      logger.error("[Rule34Provider] Auth check failed", error);
      return false;
    }
  }

  async searchTags(query: string): Promise<SearchResults[]> {
    if (query.length < 2) return [];
    try {
      const { data } = await axios.get(`https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(query)}`);
      if (Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((item: any) => ({
          id: item.value,
          label: item.label,
          value: item.value,
          type: item.type
        }));
      }
      return [];
    } catch (error) {
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
      tags: tags,
      json: "1",
    });

    if (settings.userId && settings.apiKey) {
      params.append("user_id", settings.userId);
      params.append("api_key", settings.apiKey);
    }

    const { data } = await axios.get<R34RawPost[]>(`${this.baseUrl}?${params}`, {
      timeout: 15000,
      headers: { 
        "User-Agent": "RuleDesk/1.5.0",
        "Accept-Encoding": "identity"
      }
    });

    if (!Array.isArray(data)) return [];

    return data.map(raw => this.mapToBooruPost(raw));
  }

  private mapToBooruPost(raw: R34RawPost): BooruPost {
    const isVideo = (url?: string) => !!url && /\.(webm|mp4|mov)(\?|$)/i.test(url);
    
    // Logic to pick best preview
    let preview = raw.preview_url;
    if (!preview || isVideo(preview)) {
       if (raw.sample_url && !isVideo(raw.sample_url)) preview = raw.sample_url;
       else if (raw.file_url && !isVideo(raw.file_url)) preview = raw.file_url;
       else preview = "";
    }

    return {
      id: Number(raw.id),
      fileUrl: raw.file_url,
      sampleUrl: raw.sample_url || raw.file_url,
      previewUrl: preview,
      tags: raw.tags.split(" ").filter(Boolean),
      rating: raw.rating as "s" | "q" | "e",
      score: raw.score,
      source: raw.source,
      width: raw.width,
      height: raw.height,
      createdAt: new Date((raw.change || 0) * 1000),
    };
  }
}
