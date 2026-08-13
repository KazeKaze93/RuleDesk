import { useCallback, useEffect, useRef } from "react";

export const MASONRY_LOAD_MORE_THRESHOLD_PX = 300;
export const MASONRY_SCROLL_DEBOUNCE_MS = 150;

export type MasonryScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

export type MasonryScrollEvent = {
  currentTarget: MasonryScrollMetrics;
};

type UseMasonryInfiniteScrollOptions = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  thresholdPx?: number;
  debounceMs?: number;
};

/**
 * Overflow-auto masonry load-more. Independent of Virtuoso atBottom/endReached:
 * CSS multi-column scrollHeight is unstable, so a pinned-at-bottom ref would
 * cascade fetchNextPage whenever the list grows.
 *
 * Guard re-arms only after the user leaves the threshold (a real scroll), not
 * when isFetchingNextPage flips false.
 */
export function useMasonryInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  thresholdPx = MASONRY_LOAD_MORE_THRESHOLD_PX,
  debounceMs = MASONRY_SCROLL_DEBOUNCE_MS,
}: UseMasonryInfiniteScrollOptions): (event: MasonryScrollEvent) => void {
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const onLoadMoreRef = useRef(onLoadMore);
  const loadRequestedRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (event: MasonryScrollEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const nearBottom =
        scrollHeight - (scrollTop + clientHeight) <= thresholdPx;

      if (!nearBottom) {
        loadRequestedRef.current = false;
        if (debounceTimeoutRef.current !== null) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
        return;
      }

      if (
        !hasNextPageRef.current ||
        isFetchingNextPageRef.current ||
        loadRequestedRef.current
      ) {
        return;
      }

      if (debounceTimeoutRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        debounceTimeoutRef.current = null;
        if (
          !hasNextPageRef.current ||
          isFetchingNextPageRef.current ||
          loadRequestedRef.current
        ) {
          return;
        }
        loadRequestedRef.current = true;
        void onLoadMoreRef.current();
      }, debounceMs);
    },
    [thresholdPx, debounceMs]
  );
}
