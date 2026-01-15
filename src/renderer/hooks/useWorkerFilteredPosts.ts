import { useState, useEffect, useRef } from "react";
import { useWorkerProcessor, type WorkerFilterConfig } from "./useWorkerProcessor";
import { useDebounce } from "../lib/hooks/useDebounce";
import type { Post } from "../../main/db/schema";
import type { WorkerPost } from "../../shared/types/post";
import log from "electron-log/renderer";

/**
 * Custom hook for worker-based post filtering
 * 
 * Avoids cascade renders by managing state internally and returning
 * { data, isLoading } instead of using useEffect + setState pattern.
 * 
 * @param rawPosts - Raw posts array to filter
 * @param filters - Filter configuration
 * @param debounceDelay - Debounce delay in ms (default: 250)
 * @returns Filtered and sorted posts with loading state
 */
export function useWorkerFilteredPosts(
  rawPosts: Post[],
  filters: WorkerFilterConfig,
  debounceDelay: number = 250
) {
  const { processData, loading: workerLoading } = useWorkerProcessor();
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);

  // Debounce only filters to prevent worker spam on filter changes
  // rawPosts should be processed immediately to avoid UI lag during scrolling
  const debouncedFilters = useDebounce(filters, debounceDelay);

  // Process data when inputs change
  // Use rawPosts directly (no debounce) to avoid UI lag during scrolling
  // Only debounce filters to prevent spam on rapid filter changes
  useEffect(() => {
    cancelledRef.current = false;

    const processInWorker = async () => {
      if (rawPosts.length === 0) {
        if (!cancelledRef.current) {
          setFilteredPosts([]);
        }
        return;
      }

      try {
        // Convert Post[] to WorkerPost[] (structurally compatible)
        // Use type-safe mapping: Post and WorkerPost have compatible structures
        // This avoids manual field enumeration and ensures type safety
        const workerPosts: WorkerPost[] = rawPosts.map((post): WorkerPost => ({
          id: post.id,
          postId: post.postId,
          artistId: post.artistId,
          fileUrl: post.fileUrl,
          previewUrl: post.previewUrl,
          sampleUrl: post.sampleUrl,
          title: post.title ?? null,
          rating: post.rating ?? null,
          tags: post.tags,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          isViewed: post.isViewed,
          isFavorited: post.isFavorited,
        }));

        const result = await processData({
          posts: workerPosts,
          filters: debouncedFilters,
        });

        if (!cancelledRef.current) {
          // Convert WorkerPost[] back to Post[] using explicit mapping
          // This ensures type safety and handles any future schema changes
          // Worker returns dates as Date | number | null, but Post expects Date
          const mappedPosts: Post[] = result.map((workerPost): Post => {
            // Convert date values to Date objects if needed
            const publishedAt = workerPost.publishedAt instanceof Date 
              ? workerPost.publishedAt 
              : workerPost.publishedAt 
                ? new Date(workerPost.publishedAt) 
                : new Date();
            const createdAt = workerPost.createdAt instanceof Date 
              ? workerPost.createdAt 
              : workerPost.createdAt 
                ? new Date(workerPost.createdAt) 
                : new Date();

            return {
              id: workerPost.id,
              postId: workerPost.postId,
              artistId: workerPost.artistId,
              fileUrl: workerPost.fileUrl,
              previewUrl: workerPost.previewUrl,
              sampleUrl: workerPost.sampleUrl,
              title: workerPost.title ?? "",
              rating: workerPost.rating ?? "",
              tags: workerPost.tags,
              mediaType: null, // Worker doesn't process mediaType, will be inferred from fileUrl if needed
              publishedAt,
              createdAt,
              isViewed: workerPost.isViewed,
              isFavorited: workerPost.isFavorited,
            };
          });
          setFilteredPosts(mappedPosts);
          setError(null); // Clear error on success
        }
      } catch (error) {
        log.error("[useWorkerFilteredPosts] Worker processing error:", error);
        if (!cancelledRef.current) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          setError(errorObj);
          // Fallback: set empty array on error to prevent UI from showing stale data
          setFilteredPosts([]);
        }
      }
    };

    processInWorker();

    return () => {
      cancelledRef.current = true;
    };
  }, [rawPosts, debouncedFilters, processData]);

  return {
    data: filteredPosts,
    isLoading: workerLoading,
    error, // Expose error for UI feedback (Toast/Alert)
  };
}
