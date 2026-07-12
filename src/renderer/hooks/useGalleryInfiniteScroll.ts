import { useCallback, useEffect, useRef, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

// Constants
const POSTS_PER_PAGE = 50;
const DEBOUNCE_DELAY = 150; // ms

type GalleryInfiniteScrollQueryOptions = {
  staleTime?: number;
  gcTime?: number;
  refetchOnMount?: boolean | "always";
  refetchOnReconnect?: boolean;
  refetchOnWindowFocus?: boolean;
  retry?: boolean | number | ((failureCount: number, error: unknown) => boolean);
  retryDelay?: number | ((attempt: number, error: unknown) => number);
};

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
export function useGalleryInfiniteScroll<
  TPage,
  TItem = TPage extends (infer U)[] ? U : never,
  TQueryKey extends unknown[] = unknown[],
  TPageParam = number,
>({
  queryKey,
  fetchFn,
  enabled = true,
  postsPerPage = POSTS_PER_PAGE,
  debounceDelay = DEBOUNCE_DELAY,
  getNextPageParam,
  flattenPage,
  initialPageParam,
  staleTime,
  gcTime,
  refetchOnMount,
  refetchOnReconnect,
  refetchOnWindowFocus,
  retry,
  retryDelay,
}: {
  queryKey: TQueryKey;
  fetchFn: (pageParam: TPageParam) => Promise<TPage>;
  enabled?: boolean;
  postsPerPage?: number;
  debounceDelay?: number;
  getNextPageParam?: (
    lastPage: TPage,
    allPages: TPage[]
  ) => TPageParam | undefined;
  flattenPage?: (page: TPage) => TItem[];
  initialPageParam: TPageParam;
} & GalleryInfiniteScrollQueryOptions) {
  const endReachedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasNextPageRef = useRef(false);
  const isFetchingNextPageRef = useRef(false);
  const atBottomRef = useRef(false);
  const allPostsLengthRef = useRef(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isRefetching,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      // boundary: TanStack Query generic inference — pageParam is unknown for unresolved TPageParam
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- boundary: TanStack Query generic inference
      return await fetchFn(pageParam as TPageParam);
    },
    getNextPageParam:
      getNextPageParam ??
      ((lastPage, allPages) => {
        const items = flattenPage
          ? flattenPage(lastPage)
          : Array.isArray(lastPage)
            ? // boundary: TanStack Query generic inference — default path assumes TPage is TItem[]
              (lastPage as TItem[])
            : [];
        // Default pagination uses sequential numeric page indices.
        // boundary: TanStack Query generic inference — default TPageParam is number
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- boundary: TanStack Query generic inference
        return (
          items.length === postsPerPage ? allPages.length + 1 : undefined
        ) as TPageParam | undefined;
      }),
    initialPageParam,
    enabled,
    staleTime,
    gcTime,
    refetchOnMount,
    refetchOnReconnect,
    refetchOnWindowFocus,
    retry,
    retryDelay,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    hasNextPageRef.current = Boolean(hasNextPage);
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  const scheduleLoadMore = useCallback(() => {
    if (endReachedTimeoutRef.current) {
      clearTimeout(endReachedTimeoutRef.current);
    }

    endReachedTimeoutRef.current = setTimeout(() => {
      endReachedTimeoutRef.current = null;
      if (hasNextPageRef.current && !isFetchingNextPageRef.current) {
        void fetchNextPage();
      }
    }, debounceDelay);
  }, [fetchNextPage, debounceDelay]);

  const handleEndReached = useCallback(() => {
    scheduleLoadMore();
  }, [scheduleLoadMore]);

  const handleAtBottomStateChange = useCallback(
    (atBottom: boolean) => {
      atBottomRef.current = atBottom;
      if (atBottom) {
        scheduleLoadMore();
      }
    },
    [scheduleLoadMore]
  );

  useEffect(() => {
    return () => {
      if (endReachedTimeoutRef.current) {
        clearTimeout(endReachedTimeoutRef.current);
      }
    };
  }, []);

  const allPosts = useMemo((): TItem[] => {
    if (!data?.pages) {
      return [];
    }
    return data.pages.flatMap((page) =>
      flattenPage
        ? flattenPage(page)
        : Array.isArray(page)
          ? // boundary: TanStack Query generic inference — default path assumes TPage is TItem[]
            (page as TItem[])
          : []
    );
  }, [data, flattenPage]);

  // Virtuoso endReached does not always refire when totalCount grows while pinned at bottom.
  useEffect(() => {
    const prevLength = allPostsLengthRef.current;
    const nextLength = allPosts.length;
    allPostsLengthRef.current = nextLength;

    if (
      nextLength > prevLength &&
      atBottomRef.current &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      scheduleLoadMore();
    }
  }, [allPosts.length, hasNextPage, isFetchingNextPage, scheduleLoadMore]);

  return {
    data,
    allPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isRefetching,
    isError,
    error,
    refetch,
    handleEndReached,
    handleAtBottomStateChange,
  };
}
