// @vitest-environment happy-dom
import {
  createElement,
  act,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGalleryInfiniteScroll } from "@/renderer/hooks/useGalleryInfiniteScroll";
import { getSearchBrowseNextPageParam } from "@/renderer/utils/react-query-cache";
import type { SearchBooruPageResult } from "@/shared/schemas/search";

const POSTS_PER_PAGE = 50;
const DEFAULT_DEBOUNCE_MS = 150;

type PostItem = { id: number };

type BrowsePage = SearchBooruPageResult<PostItem>;

function makeItems(count: number, startId = 1): PostItem[] {
  return Array.from({ length: count }, (_, index) => ({ id: startId + index }));
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

async function flushAct(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

async function waitForCondition(
  assertion: () => void,
  maxTicks = 80
): Promise<void> {
  let lastError: unknown;
  for (let tick = 0; tick < maxTicks; tick += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await flushAct();
    }
  }
  throw lastError;
}

type MountedHook<TApi> = {
  result: { current: TApi | null };
  unmount: () => void;
};

function mountHook<TApi>(
  queryClient: QueryClient,
  renderHook: () => TApi
): MountedHook<TApi> {
  const result: { current: TApi | null } = { current: null };
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  function Harness(): ReactNode {
    result.current = renderHook();
    return null;
  }

  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Harness)
      )
    );
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("useGalleryInfiniteScroll", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  });

  afterEach(() => {
    vi.useRealTimers();
    queryClient.clear();
  });

  describe("default pagination (local DB page size)", () => {
    it("sets hasNextPage when the last page has exactly POSTS_PER_PAGE items", async () => {
      const fetchFn = vi.fn(async () => makeItems(POSTS_PER_PAGE));
      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll({
          queryKey: ["gallery-default-full"],
          fetchFn,
          initialPageParam: 1,
        })
      );

      await waitForCondition(() => {
        expect(result.current?.allPosts).toHaveLength(POSTS_PER_PAGE);
        expect(result.current?.hasNextPage).toBe(true);
      });

      unmount();
    });

    it("clears hasNextPage when the last page is shorter than POSTS_PER_PAGE", async () => {
      const fetchFn = vi.fn(async () => makeItems(30));
      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll({
          queryKey: ["gallery-default-partial"],
          fetchFn,
          initialPageParam: 1,
        })
      );

      await waitForCondition(() => {
        expect(result.current?.allPosts).toHaveLength(30);
        expect(result.current?.hasNextPage).toBe(false);
      });

      unmount();
    });

    it("clears hasNextPage when the last page is empty", async () => {
      const fetchFn = vi.fn(async (): Promise<PostItem[]> => []);
      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll({
          queryKey: ["gallery-default-empty"],
          fetchFn,
          initialPageParam: 1,
        })
      );

      await waitForCondition(() => {
        expect(result.current?.allPosts).toEqual([]);
        expect(result.current?.hasNextPage).toBe(false);
      });

      unmount();
    });
  });

  describe("Browse pagination via getSearchBrowseNextPageParam", () => {
    it("keeps hasNextPage when the API reports hasMore on a partial visible page", async () => {
      const fetchFn = vi.fn(
        async (): Promise<BrowsePage> => ({
          posts: makeItems(30),
          hasMore: true,
          apiFetchedCount: POSTS_PER_PAGE,
          nextBeforePostId: 100,
        })
      );
      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll<BrowsePage, PostItem, unknown[], number>({
          queryKey: ["gallery-browse-has-more"],
          fetchFn,
          initialPageParam: 1,
          flattenPage: (page) => page.posts,
          getNextPageParam: (lastPage, allPages) =>
            getSearchBrowseNextPageParam(lastPage, allPages, POSTS_PER_PAGE),
        })
      );

      await waitForCondition(() => {
        expect(result.current?.allPosts).toHaveLength(30);
        expect(result.current?.hasNextPage).toBe(true);
      });

      unmount();
    });

    it("clears hasNextPage when the API returned zero rows", async () => {
      const fetchFn = vi.fn(
        async (): Promise<BrowsePage> => ({
          posts: [],
          hasMore: false,
          apiFetchedCount: 0,
        })
      );
      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll<BrowsePage, PostItem, unknown[], number>({
          queryKey: ["gallery-browse-empty"],
          fetchFn,
          initialPageParam: 1,
          flattenPage: (page) => page.posts,
          getNextPageParam: (lastPage, allPages) =>
            getSearchBrowseNextPageParam(lastPage, allPages, POSTS_PER_PAGE),
        })
      );

      await waitForCondition(() => {
        expect(result.current?.allPosts).toEqual([]);
        expect(result.current?.hasNextPage).toBe(false);
      });

      unmount();
    });
  });

  describe("debounce and unmount cleanup", () => {
    it("does not fetch the next page until the default 150ms debounce elapses", async () => {
      const fetchFn = vi.fn(async (page: number) =>
        makeItems(POSTS_PER_PAGE, (page - 1) * POSTS_PER_PAGE + 1)
      );
      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll({
          queryKey: ["gallery-debounce"],
          fetchFn,
          initialPageParam: 1,
        })
      );

      await waitForCondition(() => {
        expect(result.current?.allPosts).toHaveLength(POSTS_PER_PAGE);
        expect(result.current?.hasNextPage).toBe(true);
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Do not call waitForCondition/act-without-advance under fake timers:
      // React 18 act() waits for scheduled timeouts and deadlocks the suite.
      vi.useFakeTimers();
      try {
        act(() => {
          result.current?.handleEndReached();
        });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_MS - 1);
        });
        expect(fetchFn).toHaveBeenCalledTimes(1);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(1);
        });
        await act(async () => {
          await vi.runOnlyPendingTimersAsync();
        });
        expect(fetchFn).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }

      unmount();
    });

    it("resets the debounce window on rapid handleEndReached calls", async () => {
      const fetchFn = vi.fn(async (page: number) =>
        makeItems(POSTS_PER_PAGE, (page - 1) * POSTS_PER_PAGE + 1)
      );
      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll({
          queryKey: ["gallery-debounce-reset"],
          fetchFn,
          initialPageParam: 1,
        })
      );

      await waitForCondition(() => {
        expect(result.current?.hasNextPage).toBe(true);
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);

      vi.useFakeTimers();
      try {
        act(() => {
          result.current?.handleEndReached();
        });
        await act(async () => {
          await vi.advanceTimersByTimeAsync(100);
        });
        act(() => {
          result.current?.handleEndReached();
        });
        await act(async () => {
          await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_MS - 1);
        });
        expect(fetchFn).toHaveBeenCalledTimes(1);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(1);
        });
        await act(async () => {
          await vi.runOnlyPendingTimersAsync();
        });
        expect(fetchFn).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }

      unmount();
    });

    it("clears the pending debounce timer on unmount", async () => {
      const fetchFn = vi.fn(async (page: number) =>
        makeItems(POSTS_PER_PAGE, (page - 1) * POSTS_PER_PAGE + 1)
      );
      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll({
          queryKey: ["gallery-unmount-cleanup"],
          fetchFn,
          initialPageParam: 1,
        })
      );

      await waitForCondition(() => {
        expect(result.current?.hasNextPage).toBe(true);
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);

      vi.useFakeTimers();
      try {
        act(() => {
          result.current?.handleEndReached();
        });
        unmount();

        await act(async () => {
          await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_MS + 50);
        });
        expect(fetchFn).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("flattenPage identity and endReached in-flight guard", () => {
    it("keeps allPosts referentially stable across re-renders when flattenPage is inline", async () => {
      type Api = ReturnType<
        typeof useGalleryInfiniteScroll<BrowsePage, PostItem, unknown[], number>
      >;
      const apiRef: { current: Api | null } = { current: null };
      const forceRenderRef: { current: (() => void) | null } = { current: null };
      const effectRunsRef: { current: number } = { current: 0 };

      const fetchFn = vi.fn(
        async (): Promise<BrowsePage> => ({
          posts: makeItems(12),
          hasMore: false,
          apiFetchedCount: 12,
        })
      );

      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      function Harness(): ReactNode {
        const [, setTick] = useState(0);
        const gallery = useGalleryInfiniteScroll<
          BrowsePage,
          PostItem,
          unknown[],
          number
        >({
          queryKey: ["gallery-inline-flatten-stable"],
          fetchFn,
          initialPageParam: 1,
          // Inline lambda every render — must not churn allPosts identity.
          flattenPage: (page) => page.posts,
          getNextPageParam: (lastPage, allPages) =>
            getSearchBrowseNextPageParam(lastPage, allPages, POSTS_PER_PAGE),
        });
        useEffect(() => {
          forceRenderRef.current = () => {
            setTick((tick) => tick + 1);
          };
          apiRef.current = gallery;
        });
        useEffect(() => {
          effectRunsRef.current += 1;
        }, [gallery.allPosts]);
        return null;
      }

      act(() => {
        root.render(
          createElement(
            QueryClientProvider,
            { client: queryClient },
            createElement(Harness)
          )
        );
      });

      await waitForCondition(() => {
        expect(apiRef.current?.allPosts).toHaveLength(12);
      });

      const firstAllPosts = apiRef.current?.allPosts;
      const runsAfterLoad = effectRunsRef.current;

      act(() => {
        forceRenderRef.current?.();
      });
      act(() => {
        forceRenderRef.current?.();
      });
      act(() => {
        forceRenderRef.current?.();
      });
      await flushAct();

      expect(apiRef.current?.allPosts).toBe(firstAllPosts);
      expect(effectRunsRef.current).toBe(runsAfterLoad);

      act(() => {
        root.unmount();
      });
      container.remove();
    });

    it("does not call fetchNextPage again while a next-page request is in flight", async () => {
      let resolvePage2: (() => void) | null = null;
      const fetchFn = vi.fn(async (page: number) => {
        if (page === 1) {
          return makeItems(POSTS_PER_PAGE);
        }
        await new Promise<void>((resolve) => {
          resolvePage2 = resolve;
        });
        return makeItems(POSTS_PER_PAGE, POSTS_PER_PAGE + 1);
      });

      const { result, unmount } = mountHook(queryClient, () =>
        useGalleryInfiniteScroll({
          queryKey: ["gallery-inflight-guard"],
          fetchFn,
          initialPageParam: 1,
          debounceDelay: 20,
        })
      );

      await waitForCondition(() => {
        expect(result.current?.hasNextPage).toBe(true);
        expect(result.current?.isFetchingNextPage).toBe(false);
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);

      act(() => {
        result.current?.handleEndReached();
      });
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 30);
        });
      });

      await waitForCondition(() => {
        expect(fetchFn).toHaveBeenCalledTimes(2);
        expect(result.current?.isFetchingNextPage).toBe(true);
      });

      act(() => {
        result.current?.handleEndReached();
        result.current?.handleEndReached();
      });
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 40);
        });
      });
      expect(fetchFn).toHaveBeenCalledTimes(2);

      await act(async () => {
        resolvePage2?.();
        await Promise.resolve();
      });
      await waitForCondition(() => {
        expect(result.current?.isFetchingNextPage).toBe(false);
      });

      unmount();
    });
  });
});
