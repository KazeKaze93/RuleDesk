/**
 * Data Processor Web Worker
 * 
 * Offloads heavy data processing (filtering, sorting) from the Renderer UI thread.
 * This worker handles client-side post processing for the Browse tab and provides
 * a foundation for future Smart Collections features.
 * 
 * IMPORTANT: This worker runs in a separate thread and cannot access:
 * - Node.js modules (fs, path, etc.)
 * - DOM APIs
 * - Electron APIs (window.api, etc.)
 * - Browser storage (localStorage, etc.)
 * 
 * Reserved action types for future implementation:
 * - 'ANALYZE_TAG_FREQUENCY' - Analyze tag frequency for Smart Collections
 * - 'GROUP_BY_CLUSTER' - Group posts by visual/content similarity
 * - 'EXTRACT_FEATURES' - Extract features for ML-based recommendations
 * - 'CALCULATE_SIMILARITY' - Calculate similarity scores between posts
 */

// Worker cannot use path aliases, use relative path
import type { WorkerPost } from "../../shared/types/post";
import { WorkerPostArraySchema } from "../../shared/types/post";
import { z } from "zod";

// Worker message types
interface WorkerRequest {
  id: string;
  action: string;
  payload: unknown;
}

interface WorkerResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}

// Filter configuration type
interface FilterConfig {
  aiFilter: "all" | "hide" | "only";
  mediaType: "all" | "images" | "videos";
  source: "all" | "favorites" | "subscriptions";
  sortOrder: "asc" | "desc";
  trackedTagsSet?: string[]; // Array of tracked tag strings (lowercase)
  tags?: string[]; // Active search tags for source filter
}

// Filter and sort request payload
interface FilterAndSortPayload {
  posts: WorkerPost[];
  filters: FilterConfig;
}

// AI tag patterns (compiled once for reuse)
const AI_TAG_PATTERNS = [
  "ai_generated",
  "ai generated",
  "ai-generated",
  "ai_generation",
  "ai generation",
  "ai-generated_content",
  "ai generated content",
];

/**
 * Check if post has AI generated tag
 * Optimized for worker context (no external dependencies)
 */
function hasAiGeneratedTag(tags: string | undefined | null): boolean {
  if (!tags) return false;
  
  const tagArray = tags
    .toLowerCase()
    .split(/\s+/)
    .filter((tag) => tag.length > 0);
  
  return AI_TAG_PATTERNS.some((aiTag) => tagArray.includes(aiTag));
}

/**
 * Check if post is a video based on file URL
 * Optimized: fast path for simple URLs, URL parsing only when needed
 */
const VIDEO_EXTENSION_REGEX = /\.(mp4|webm|mov)$/i;

function isVideoPost(fileUrl: string | undefined | null): boolean {
  if (!fileUrl) return false;
  
  // Extract pathname: everything before ? or # (query params/hash)
  // Use regex to extract pathname without creating URL object
  const pathMatch = fileUrl.match(/^[^?#]+/);
  const pathname = pathMatch ? pathMatch[0] : fileUrl;
  
  // Check if pathname ends with video extension (case-insensitive)
  return VIDEO_EXTENSION_REGEX.test(pathname);
}

/**
 * Extract timestamp from publishedAt (handles Date, number, or undefined)
 */
function getTimestamp(publishedAt: Date | number | null | undefined): number {
  if (publishedAt instanceof Date) return publishedAt.getTime();
  if (typeof publishedAt === "number") return publishedAt;
  return 0;
}

/**
 * Filter and sort posts in a single efficient pass
 * Uses single-pass filter + sort for optimal performance
 */
function filterAndSortPosts(
  posts: WorkerPost[],
  filters: FilterConfig
): WorkerPost[] {
  const { aiFilter, mediaType, source, sortOrder, trackedTagsSet, tags } = filters;
  
  // Build tracked tags set for efficient lookup
  const trackedSet = trackedTagsSet ? new Set(trackedTagsSet) : new Set<string>();
  const hasActiveSearch = tags && tags.length > 0;
  
  // Single-pass filter: combine all filter conditions
  const filtered = posts.filter((post) => {
    // AI filter
    if (aiFilter === "hide" && hasAiGeneratedTag(post.tags)) return false;
    if (aiFilter === "only" && !hasAiGeneratedTag(post.tags)) return false;
    
    // Media type filter
    if (mediaType !== "all") {
      const isVideo = isVideoPost(post.fileUrl);
      if (mediaType === "videos" && !isVideo) return false;
      if (mediaType === "images" && isVideo) return false;
    }
    
    // Source filter - only apply if there's an active search
    if (hasActiveSearch) {
      if (source === "favorites" && !post.isFavorited) return false;
        if (source === "subscriptions") {
          if (trackedSet.size === 0) return false;
          if (!post.tags) return false;
          // PERFORMANCE: Split once and use Set.has() for O(1) lookup
          // This is faster than creating RegExp on each iteration (20k+ times)
          // Split creates one array per post, but Set.has() is O(1) vs RegExp.test() which is O(n)
          const postTags = post.tags.toLowerCase().split(/\s+/).filter(Boolean);
          const hasTrackedTag = postTags.some((tag) => trackedSet.has(tag));
          if (!hasTrackedTag) return false;
        }
    }
    
    return true;
  });
  
  // Sort by publishedAt
  return filtered.sort((a, b) => {
    const dateA = getTimestamp(a.publishedAt);
    const dateB = getTimestamp(b.publishedAt);
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });
}

// Message handler
self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const { id, action, payload } = event.data;

  try {
    switch (action) {
      case "FILTER_AND_SORT": {
        const { posts, filters } = payload as FilterAndSortPayload;
        
        // PERFORMANCE: Validate posts in Worker thread (not Renderer)
        // This prevents UI blocking - validation happens in background thread
        // Zod.parse() on 10k+ posts can take 100-200ms, but in Worker it won't freeze UI
        let validatedPosts: WorkerPost[];
        try {
          validatedPosts = WorkerPostArraySchema.parse(posts);
        } catch (validationError) {
          const response: WorkerResponse = {
            id,
            success: false,
            error: validationError instanceof z.ZodError
              ? `Validation failed: ${validationError.errors.map(e => e.message).join(", ")}`
              : validationError instanceof Error
              ? validationError.message
              : String(validationError),
          };
          self.postMessage(response);
          break;
        }
        
        const result = filterAndSortPosts(validatedPosts, filters);
        
        const response: WorkerResponse<WorkerPost[]> = {
          id,
          success: true,
          data: result,
        };
        self.postMessage(response);
        break;
      }

      default: {
        const response: WorkerResponse = {
          id,
          success: false,
          error: `Unknown action: ${action}`,
        };
        self.postMessage(response);
      }
    }
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
});
