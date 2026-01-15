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
  const cancelledRef = useRef(false);

  // Debounce inputs to prevent worker spam
  const debouncedRawPosts = useDebounce(rawPosts, debounceDelay);
  const debouncedFilters = useDebounce(filters, debounceDelay);

  // Process data when debounced inputs change
  useEffect(() => {
    cancelledRef.current = false;

    const processInWorker = async () => {
      if (debouncedRawPosts.length === 0) {
        if (!cancelledRef.current) {
          setFilteredPosts([]);
        }
        return;
      }

      try {
        // Convert Post[] to WorkerPost[] (structurally compatible)
        const workerPosts: WorkerPost[] = debouncedRawPosts.map((post) => ({
          id: post.id,
          postId: post.postId,
          artistId: post.artistId,
          fileUrl: post.fileUrl,
          previewUrl: post.previewUrl,
          sampleUrl: post.sampleUrl,
          title: post.title,
          rating: post.rating,
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
          // Convert WorkerPost[] back to Post[] (structurally compatible)
          setFilteredPosts(result as Post[]);
        }
      } catch (error) {
        log.error("[useWorkerFilteredPosts] Worker processing error:", error);
        if (!cancelledRef.current) {
          // Fallback: set empty array on error
          setFilteredPosts([]);
        }
      }
    };

    processInWorker();

    return () => {
      cancelledRef.current = true;
    };
  }, [debouncedRawPosts, debouncedFilters, processData]);

  return {
    data: filteredPosts,
    isLoading: workerLoading,
  };
}
