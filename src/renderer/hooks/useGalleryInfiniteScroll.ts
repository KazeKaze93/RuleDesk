import { useCallback, useEffect, useRef, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

// Constants
const POSTS_PER_PAGE = 50;
const DEBOUNCE_DELAY = 150; // ms

/**
 * Generic hook for infinite scroll with pagination
 * 
 * @template TPost - The post type
 * @template TQueryKey - The query key type for react-query
 * 
 * @param options - Configuration options
 * @param options.queryKey - React Query key array
 * @param options.fetchFn - Function to fetch a page of posts
 * @param options.enabled - Whether the query should be enabled (default: true)
 * @param options.postsPerPage - Number of posts per page (default: 50)
 * @param options.debounceDelay - Debounce delay in ms (default: 150)
 * 
 * @returns Object containing query data and handlers
 */
export function useGalleryInfiniteScroll<TPost, TQueryKey extends unknown[] = unknown[]>({
  queryKey,
  fetchFn,
  enabled = true,
  postsPerPage = POSTS_PER_PAGE,
  debounceDelay = DEBOUNCE_DELAY,
  getNextPageParam,
}: {
  queryKey: TQueryKey;
  fetchFn: (pageParam: number) => Promise<TPost[]>;
  enabled?: boolean;
  postsPerPage?: number;
  debounceDelay?: number;
  getNextPageParam?: (lastPage: TPost[], allPages: TPost[][]) => number | undefined;
}) {
  // Debounce ref to prevent duplicate fetch calls
  const endReachedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const endReachedInFlightRef = useRef(false);

  // Infinite query with proper pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      return await fetchFn(pageParam);
    },
    getNextPageParam: getNextPageParam || ((lastPage, allPages) => {
      // Default: Return next page number only if last page returned full limit
      return lastPage.length === postsPerPage ? allPages.length + 1 : undefined;
    }),
    initialPageParam: 1,
    enabled,
  });

  // Handle end reached with debounce to prevent rate limit errors
  const handleEndReached = useCallback(() => {
    if (endReachedInFlightRef.current) {
      return;
    }

    // Clear any pending timeout
    if (endReachedTimeoutRef.current) {
      clearTimeout(endReachedTimeoutRef.current);
    }

    endReachedInFlightRef.current = true;

    // Debounce the fetch to prevent duplicate calls
    endReachedTimeoutRef.current = setTimeout(() => {
      endReachedTimeoutRef.current = null;
      if (hasNextPage && !isFetchingNextPage) {
        void fetchNextPage().finally(() => {
          endReachedInFlightRef.current = false;
        });
        return;
      }
      endReachedInFlightRef.current = false;
    }, debounceDelay);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, debounceDelay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      endReachedInFlightRef.current = false;
      if (endReachedTimeoutRef.current) {
        clearTimeout(endReachedTimeoutRef.current);
      }
    };
  }, []);

  // Flatten all pages into a single array
  // CRITICAL: Wrap in useMemo to prevent recalculation on every render
  // For large datasets (100+ pages), flatMap can be expensive
  const allPosts = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  return {
    data,
    allPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    handleEndReached,
  };
}
