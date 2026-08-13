/**
 * Data Processor Web Worker
 *
 * Offloads AI/media filter + sort from the Renderer UI thread for Browse
 * remote results (source=all). Local Favorites/Subscriptions apply those
 * filters in SQL before LIMIT/OFFSET and do not use this worker.
 *
 * AI filter path:
 * - Rule34: prefer API tag injection in Browse (exclude / OR-group); worker AI
 *   is skipped when injection succeeds (aiFilter passed as "all").
 * - Gelbooru (and Rule34 conflict fallback): worker AI remains the filter path.
 * - Media type + sort still run here for remote Browse when enabled.
 *
 * This worker runs in a separate thread and cannot access:
 * - Node.js modules (fs, path, etc.)
 * - DOM APIs
 * - Electron APIs (window.api, etc.)
 * - Browser storage (localStorage, etc.)
 */

// Worker cannot use path aliases, use relative path
import type { WorkerPost } from "../../shared/types/post";

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

// Filter configuration type (remote Browse only: AI, media, sort)
interface FilterConfig {
  aiFilter: "all" | "hide" | "only";
  mediaType: "all" | "images" | "videos";
  sortOrder: "asc" | "desc";
}

// Filter and sort request payload
interface FilterAndSortPayload {
  posts: WorkerPost[];
  filters: FilterConfig;
}

// Exact booru tokens (`_` / `-`). Keep in sync with PostsController AI_FILTER_TAGS
// and BOORU_AI_FILTER_TAGS. Space phrases cannot match after split(/\s+/).
const AI_TAG_PATTERNS = [
  "ai_generated",
  "ai-generated",
  "ai_generation",
  "ai-generated_content",
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
  const { aiFilter, mediaType, sortOrder } = filters;

  const filtered = posts.filter((post) => {
    if (aiFilter === "hide" && hasAiGeneratedTag(post.tags)) return false;
    if (aiFilter === "only" && !hasAiGeneratedTag(post.tags)) return false;

    if (mediaType !== "all") {
      const isVideo = isVideoPost(post.fileUrl);
      if (mediaType === "videos" && !isVideo) return false;
      if (mediaType === "images" && isVideo) return false;
    }

    return true;
  });

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
        // boundary: worker message
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: worker message
        const { posts, filters } = payload as FilterAndSortPayload;
        
        // PERFORMANCE: Skip Zod validation in Worker - data comes from trusted Main process
        // Zod.parse() on 20k+ posts wastes 80% of Worker time on redundant validation
        // Main process already validates data before sending to Renderer
        // Trust your own IPC layer - don't validate twice
        const result = filterAndSortPosts(posts, filters);
        
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
