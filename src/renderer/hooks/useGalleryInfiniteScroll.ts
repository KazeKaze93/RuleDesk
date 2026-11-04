import { useCallback, useEffect, useRef, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { POSTS_PAGE_SIZE } from "../../shared/constants";

const DEBOUNCE_DELAY_MS = 150;

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
 * Generic hook for infinite scroll with pagination.
 *
 * `flattenPage` is intentionally omitted from the `allPosts` `useMemo`
 * dependency list (see exhaustive-deps disable). Callers may pass an inline
 * lambda without causing a new `allPosts` array identity on every render.
 *
 * Constraint: `flattenPage` must be a pure projection of `page`. Changing
 * `flattenPage` without a corresponding `data` change does **not** recompute
 * `allPosts` until the next query-data update. The memo reads `flattenPage`
 * from the render that last invalidated `data` (latest-callback-via-closure).
 *
 * `handleEndReached` is gated by in-flight fetch / exhausted pages so a pinned
 * Virtuoso `endReached` cannot schedule overlapping `fetchNextPage` calls.
 * `loadMoreNow` uses the same ref gate without debounce (viewer / masonry paths
 * that must `await` the new page for `appendQueueIds`).
 * Optional `prefetchItems`: Virtuoso `rangeChanged` can call `handleRangeChanged`
 * to schedule the same debounced path before `endReached` (slow-page galleries).
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
  postsPerPage = POSTS_PAGE_SIZE,
  debounceDelay = DEBOUNCE_DELAY_MS,
  prefetchItems,
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
  /**
   * When set, `handleRangeChanged` schedules load-more once
   * `endIndex >= loadedCount - prefetchItems`. Undefined = off (other galleries).
   */
  prefetchItems?: number;
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
  // Latest-ref for default getNextPageParam (runs outside render).
  const flattenPageRef = useRef(flattenPage);
  useEffect(() => {
    flattenPageRef.current = flattenPage;
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: TanStack Query generic inference
      return await fetchFn(pageParam as TPageParam);
    },
    getNextPageParam:
      getNextPageParam ??
      ((lastPage, allPages) => {
        const flatten = flattenPageRef.current;
        const items = flatten
          ? flatten(lastPage)
          : Array.isArray(lastPage)
            ? // boundary: TanStack Query generic inference — default path assumes TPage is TItem[]
              // eslint-disable-next-line no-restricted-syntax -- boundary: TanStack Query generic inference
              (lastPage as TItem[])
            : [];
        // Default pagination uses sequential numeric page indices.
        // boundary: TanStack Query generic inference — default TPageParam is number
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: TanStack Query generic inference
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
    if (!hasNextPageRef.current || isFetchingNextPageRef.current) {
      return;
    }
    scheduleLoadMore();
  }, [scheduleLoadMore]);

  /**
   * Virtuoso `rangeChanged` prefetch. Same ref-gate + debounce as `handleEndReached`
   * so rapid range updates coalesce; debounce kept because rangeChanged fires every
   * scroll frame (unlike a single endReached edge).
   */
  const handleRangeChanged = useCallback(
    (range: { endIndex: number }, loadedCount: number) => {
      if (prefetchItems === undefined) {
        return;
      }
      if (loadedCount <= 0) {
        return;
      }
      if (range.endIndex < loadedCount - prefetchItems) {
        return;
      }
      handleEndReached();
    },
    [prefetchItems, handleEndReached]
  );

  const loadMoreNow = useCallback(async (): Promise<TPage | undefined> => {
    if (!hasNextPageRef.current || isFetchingNextPageRef.current) {
      return undefined;
    }
    if (endReachedTimeoutRef.current) {
      clearTimeout(endReachedTimeoutRef.current);
      endReachedTimeoutRef.current = null;
    }
    // Optimistic gate: close the race before React Query flips isFetchingNextPage.
    isFetchingNextPageRef.current = true;
    try {
      const result = await fetchNextPage();
      const pages = result.data?.pages;
      if (!pages || pages.length === 0) {
        return undefined;
      }
      return pages[pages.length - 1];
    } catch (error: unknown) {
      isFetchingNextPageRef.current = false;
      throw error;
    }
  }, [fetchNextPage]);

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
            // eslint-disable-next-line no-restricted-syntax -- boundary: TanStack Query generic inference
            (page as TItem[])
          : []
    );
    // flattenPage identity must not invalidate this memo — see hook JSDoc constraint.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- latest flattenPage via render closure when data changes
  }, [data]);

  return {
    data,
    allPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    isFetching,
    isRefetching,
    isError,
    error,
    refetch,
    handleEndReached,
    handleRangeChanged,
    loadMoreNow,
  };
}
