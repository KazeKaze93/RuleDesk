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
    
    if (options.tags && options.tags.trim() !== "" && options.tags.trim().toLowerCase() !== "all") {
      params.append("tags", options.tags);
    }
    
    params.append("limit", "1000");
    params.append("pid", options.page.toString());

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
          sampleErrors: validationErrors.slice(0, 3).map(e => e.errors)
        }
      );
    }

    return validatedPosts
      .map((raw) => this.mapToBooruPost(raw))
      .filter((post): post is BooruPost => post !== null);
  }

  async fetchPosts(tags: string, page: number, settings: ProviderSettings): Promise<BooruPost[]> {
    // Step 1: Try JSON first
    const jsonUrl = this.buildUrl({ tags, page, settings, json: 1 });
    
    try {
      const response = await axios.get<string>(jsonUrl, {
        timeout: REQUEST_TIMEOUT,
        headers: { 
          "User-Agent": USER_AGENT,
          "Accept-Encoding": "identity"
        },
        responseType: 'text',
        validateStatus: (status) => status < 500
      });
      
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
      
      return this.normalizePosts(json);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`[Rule34Provider] JSON API failed for tags "${tags}". Error: ${errorMessage}. Retrying with XML...`);
      
      // Step 2: FALLBACK TO XML
      try {
        const xmlUrl = this.buildUrl({ tags, page, settings, json: 0 });
        const xmlResponse = await axios.get<string>(xmlUrl, {
          timeout: REQUEST_TIMEOUT,
          headers: { 
            "User-Agent": USER_AGENT,
            "Accept-Encoding": "identity"
          },
          responseType: 'text',
          validateStatus: (status) => status < 500
        });
        
        const xmlText = xmlResponse.data;
        const posts = this.parsePostXml(xmlText);
        logger.warn(`[Rule34Provider] Recovered ${posts.length} posts via XML fallback.`);
        return posts;
      } catch (xmlError) {
        logger.error("[Rule34Provider] XML Fallback failed:", xmlError);
        return [];
      }
    }
  }

  /**
   * Parse XML response from Rule34 API using regex to extract post attributes
   * Uses regex pattern to match <post ... /> tags and extract attributes
   * Returns BooruPost[] with strict camelCase field mapping for UI compatibility
   * 
   * @param xml - Raw XML response text
   * @returns Array of parsed BooruPost objects
   */
  private parsePostXml(xml: string): BooruPost[] {
    const posts: BooruPost[] = [];
    
    try {
      // Match all <post ... /> tags using regex
      // Pattern: <post followed by attributes, then >
      const postRegex = /<post\s+([^>]+)>/g;
      const matches = Array.from(xml.matchAll(postRegex));
      
      for (const match of matches) {
        if (!match[1]) continue;
        
        const attributes = match[1];
        
        // Extract attribute values using regex
        // Pattern: attribute_name="value" or attribute_name='value'
        const attrRegex = /(\w+)="([^"]*)"|(\w+)='([^']*)'/g;
        const attrs: Record<string, string> = {};
        
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
          const key = attrMatch[1] || attrMatch[3];
          const value = attrMatch[2] || attrMatch[4];
          if (key && value !== undefined) {
            attrs[key] = value;
          }
        }
        
        // Parse and validate required fields
        const id = attrs.id ? parseInt(attrs.id, 10) : null;
        if (!id || isNaN(id) || id <= 0) continue;
        
        const fileUrl = (attrs.file_url || '').trim();
        if (!fileUrl) continue;
        
        // Map XML attributes directly to BooruPost format (camelCase)
        // Use selectBestPreview for previewUrl (fallback to fileUrl if preview_url missing)
        const previewUrl = selectBestPreview({
          preview: attrs.preview_url,
          sample: attrs.sample_url,
          file: fileUrl,
        }) || fileUrl; // Fallback to fileUrl if selectBestPreview returns empty
        
        const sampleUrl = (attrs.sample_url || fileUrl).trim();
        
        // Ensure previewUrl is never empty (critical for UI display)
        const finalPreviewUrl = previewUrl.trim() || fileUrl;
        if (!finalPreviewUrl) continue; // Skip if still empty
        
        // Parse tags: split by space and filter empty strings
        const tags = (attrs.tags || '').split(' ').filter(Boolean);
        
        // Normalize rating using shared utility
        const rating = normalizeRating(attrs.rating || 'q');
        
        // Parse numeric fields with fallbacks
        const score = attrs.score ? parseInt(attrs.score, 10) : 0;
        const width = attrs.width ? parseInt(attrs.width, 10) : 0;
        const height = attrs.height ? parseInt(attrs.height, 10) : 0;
        
        // Date handling: XML may have created_at (string) or change (Unix timestamp)
        let createdAt = new Date();
        if (attrs.created_at) {
          const parsedDate = new Date(attrs.created_at);
          if (!isNaN(parsedDate.getTime())) {
            createdAt = parsedDate;
          }
        } else if (attrs.change) {
          const timestamp = parseInt(attrs.change, 10);
          if (timestamp > 0) {
            const parsedDate = new Date(timestamp * 1000);
            if (!isNaN(parsedDate.getTime())) {
              createdAt = parsedDate;
            }
          }
        }
        
        // Build BooruPost object with strict camelCase mapping
        const post: BooruPost = {
          id: id,
          fileUrl: fileUrl,
          previewUrl: finalPreviewUrl,
          sampleUrl: sampleUrl,
          tags: tags,
          rating: rating,
          score: score,
          source: (attrs.source || '').trim(),
          width: width,
          height: height,
          createdAt: createdAt,
        };
        
        posts.push(post);
      }
    } catch (error) {
      logger.error(`[Rule34Provider] Failed to parse XML posts:`, error);
    }
    
    return posts;
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
