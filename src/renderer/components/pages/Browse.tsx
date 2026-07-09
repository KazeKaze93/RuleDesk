import React, { useMemo, forwardRef, useCallback, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { Search, Loader2, CheckSquare } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import { cn } from "../../lib/utils";
import { resolveErrorMessage } from "../../utils/error-message";
import {
  assertBrowseSearchError,
  getBrowseSearchErrorPresentation,
  getBrowseSearchRetryDelayMs,
  shouldRetryBrowseSearch,
  toBrowseSearchError,
} from "../../utils/provider-search-error";
import { useViewerStore } from "../../store/viewerStore";
import { buildBooruTagListForIpc, useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ExternalLink } from "lucide-react";
import { useGalleryInfiniteScroll } from "../../hooks/useGalleryInfiniteScroll";
import { useWorkerFilteredPosts } from "../../hooks/useWorkerFilteredPosts";
import type { WorkerFilterConfig } from "../../hooks/useWorkerProcessor";
import type { Post } from "../../../main/db/schema";
import { normalizePostToPostData } from "../../../shared/utils/post-normalization";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";
import type { SearchBooruPageResult, BrowseSearchPageParam } from "../../../shared/schemas/search";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";
import { useReleaseRadixModalLockOnMount } from "../../hooks/useReleaseRadixModalLockOnMount";
import { getSearchBrowseNextPageParam, isSearchGalleryPage } from "../../utils/react-query-cache";

const POSTS_PER_PAGE = 50;
const BROWSE_SEARCH_STALE_TIME_MS = 5 * 60 * 1000;
const BROWSE_SEARCH_GC_TIME_MS = 30 * 60 * 1000;

type BrowseGalleryPage = SearchBooruPageResult<Post>;

function isBrowseCursorPageParam(
  pageParam: BrowseSearchPageParam
): pageParam is { beforePostId: number } {
  return typeof pageParam === "object" && "beforePostId" in pageParam;
}

// --- Компоненты для виртуализации (Grid/Masonry Layout) ---

const GridContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { viewType?: "grid" | "masonry" }
>(({ className, viewType = "grid", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      viewType === "grid"
        ? "grid gap-4 p-4 pb-44 [grid-template-columns:repeat(var(--grid-cols,auto-fill),minmax(188px,1fr))]"
        : "columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 p-4 pb-44",
      className
    )}
    {...props}
  />
));
GridContainer.displayName = "GridContainer";

const GridItemContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full aspect-[2/3]", className)} {...props} />
  )
);
GridItemContainer.displayName = "BrowseGridItemContainer";

const MasonryItemContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-shrink-0 w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)] xl:w-[calc(20%-1rem)]",
        className
      )}
      {...props}
    />
  )
);
MasonryItemContainer.displayName = "BrowseMasonryItemContainer";

const GridVirtuosoList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { "aria-busy"?: boolean }
>(({ className, "aria-busy": ariaBusy, ...props }, ref) => (
  <GridContainer
    {...props}
    ref={ref}
    className={className}
    aria-busy={ariaBusy}
    viewType="grid"
  />
));
GridVirtuosoList.displayName = "BrowseGridVirtuosoList";

const MasonryVirtuosoList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { "aria-busy"?: boolean }
>(({ className, "aria-busy": ariaBusy, ...props }, ref) => (
  <GridContainer
    {...props}
    ref={ref}
    className={className}
    aria-busy={ariaBusy}
    viewType="masonry"
  />
));
MasonryVirtuosoList.displayName = "BrowseMasonryVirtuosoList";

// --- Основной компонент ---

export const Browse = () => {
  useReleaseRadixModalLockOnMount();
  const queryClient = useQueryClient();
  const includeTags = useSearchStore((state) => state.includeTags);
  const excludeTags = useSearchStore((state) => state.excludeTags);
  const openViewer = useViewerStore((state) => state.open);
  const appendQueueIds = useViewerStore((state) => state.appendQueueIds);
  const isBulkMode = useBulkSelect((state) => state.isBulkMode);
  const activateBulkMode = useBulkSelect((state) => state.activateBulkMode);
  const deactivateBulkMode = useBulkSelect((state) => state.deactivate);
  const selectedIds = useBulkSelect((state) => state.selectedIds);
  const selectAll = useBulkSelect((state) => state.selectAll);
  const clearSelection = useBulkSelect((state) => state.clearSelection);

  useEffect(() => {
    return () => {
      deactivateBulkMode();
    };
  }, [deactivateBulkMode]);

  const tags = useMemo(
    () => buildBooruTagListForIpc(includeTags, excludeTags),
    [includeTags, excludeTags]
  );

  // Fetch tracked artists for subscriptions filter
  const { data: trackedArtists } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  // Use atomic selectors to prevent unnecessary re-renders
  // Each field is selected independently, so changing viewType won't trigger
  // re-render if only filters change, and vice versa
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const viewType = useSearchStore((state) => state.viewType);
  // Use atomic selectors - faster than useShallow for 3 fields
  // Each selector only re-renders when its specific field changes
  const aiFilter = useSearchStore((state) => state.filters.aiFilter);
  const rating = useSearchStore((state) => state.filters.rating);
  const mediaType = useSearchStore((state) => state.filters.mediaType);
  const source = useSearchStore((state) => state.filters.source);
  const dateFrom = useSearchStore((state) => state.filters.dateFrom);
  const dateTo = useSearchStore((state) => state.filters.dateTo);

  const isRemoteBrowseSource = source === "all";
  const usesDefaultRemoteFilters =
    isRemoteBrowseSource &&
    tags.length === 0 &&
    aiFilter === "all" &&
    rating === "all" &&
    mediaType === "all" &&
    !dateFrom &&
    !dateTo;

  // Use the new infinite scroll hook
  // For external API (Browse), we need custom getNextPageParam logic
  // because API may return less than 50 posts but still have more pages
  const {
    allPosts: rawPostsFromQuery,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError: isSearchError,
    error: searchError,
    refetch: refetchSearch,
    handleEndReached,
    handleAtBottomStateChange,
  } = useGalleryInfiniteScroll<
    BrowseGalleryPage,
    Post,
    unknown[],
    BrowseSearchPageParam
  >({
    queryKey: ["search", tags, source],
    flattenPage: (page) => page.posts,
    fetchFn: async (pageParam) => {
      if (source === "favorites") {
        const page =
          typeof pageParam === "number" ? pageParam : 1;
        const posts = await window.api.getArtistPosts({
          page,
          filters: {
            isFavorited: true,
            tags: tags.length > 0 ? tags.join(" ") : undefined,
          },
        });
        return {
          posts,
          hasMore: posts.length >= POSTS_PER_PAGE,
        };
      }

      if (source === "subscriptions") {
        const page =
          typeof pageParam === "number" ? pageParam : 1;
        const posts = await window.api.getArtistPosts({
          page,
          filters: {
            sinceTracking: true,
            tags: tags.length > 0 ? tags.join(" ") : undefined,
          },
        });
        return {
          posts,
          hasMore: posts.length >= POSTS_PER_PAGE,
        };
      }

      try {
        if (isBrowseCursorPageParam(pageParam)) {
          return await window.api.searchBooru({
            tags,
            page: 1,
            beforePostId: pageParam.beforePostId,
            limit: POSTS_PER_PAGE,
          });
        }

        return await window.api.searchBooru({
          tags,
          page: pageParam,
          limit: POSTS_PER_PAGE,
        });
      } catch (error) {
        assertBrowseSearchError(error);
      }
    },
    getNextPageParam: (lastPage, allPages) =>
      getSearchBrowseNextPageParam(lastPage, allPages, POSTS_PER_PAGE),
    staleTime: BROWSE_SEARCH_STALE_TIME_MS,
    gcTime: BROWSE_SEARCH_GC_TIME_MS,
    refetchOnReconnect: false,
    retry: isRemoteBrowseSource ? shouldRetryBrowseSearch : undefined,
    retryDelay: isRemoteBrowseSource ? getBrowseSearchRetryDelayMs : undefined,
  });

  const rawPosts = useMemo(() => {
    const seenPostIds = new Set<number>();
    return rawPostsFromQuery.filter((post) => {
      if (seenPostIds.has(post.postId)) {
        return false;
      }
      seenPostIds.add(post.postId);
      return true;
    });
  }, [rawPostsFromQuery]);

  // Build tracked tags array for subscriptions filter (worker needs array, not Set)
  const trackedTagsArray = useMemo(() => {
    if (!trackedArtists || trackedArtists.length === 0) return [];
    
    const tagsSet = new Set<string>();
    trackedArtists.forEach((artist) => {
      const tagLower = artist.tag.toLowerCase();
      tagsSet.add(tagLower);
      
      // For uploader type (user:username), also check without "user:" prefix
      if (tagLower.startsWith("user:")) {
        const username = tagLower.replace("user:", "");
        tagsSet.add(username);
        // Also check with underscore (some APIs use underscores)
        tagsSet.add(username.replace(/_/g, ""));
      }
      // Also check with "user:" prefix for tags that might not have it
      if (!tagLower.startsWith("user:")) {
        tagsSet.add(`user:${tagLower}`);
      }
    });
    
    return Array.from(tagsSet);
  }, [trackedArtists]);

  // Worker-based processing with custom hook to avoid cascade renders
  const filterConfig: WorkerFilterConfig = useMemo(() => ({
    aiFilter,
    rating,
    mediaType,
    source,
    dateFrom,
    dateTo,
    sortOrder,
    trackedTagsSet: trackedTagsArray,
    tags,
  }), [aiFilter, rating, mediaType, source, dateFrom, dateTo, sortOrder, trackedTagsArray, tags]);

  const {
    data: workerPosts = [],
    isLoading: workerLoading,
    error: workerError,
  } = useWorkerFilteredPosts(
    rawPosts,
    filterConfig,
    250,
    !usesDefaultRemoteFilters
  );

  const displayPosts = useMemo(() => {
    if (usesDefaultRemoteFilters) {
      return rawPosts;
    }
    if (workerPosts.length > 0) {
      return workerPosts;
    }
    if ((workerLoading || workerError) && rawPosts.length > 0) {
      return rawPosts;
    }
    return workerPosts;
  }, [
    usesDefaultRemoteFilters,
    rawPosts,
    workerPosts,
    workerLoading,
    workerError,
  ]);

  const selectedPosts = useMemo(
    () => displayPosts.filter((post) => selectedIds.has(getBulkSelectId(post))),
    [displayPosts, selectedIds]
  );
  const hasFilteredOutResults =
    rawPosts.length > 0 && displayPosts.length === 0 && !usesDefaultRemoteFilters;
  const isFatalSearchError = isSearchError && rawPosts.length === 0;
  const browseSearchError = toBrowseSearchError(searchError);
  const browseSearchErrorPresentation = browseSearchError
    ? getBrowseSearchErrorPresentation(browseSearchError.kind)
    : null;
  const searchErrorMessage = browseSearchErrorPresentation
    ? browseSearchErrorPresentation.description
    : resolveErrorMessage(searchError, "Failed to load posts.");
  const searchErrorTitle = browseSearchErrorPresentation
    ? browseSearchErrorPresentation.title
    : "Could not load Browse";
  const showSearchRetryButton =
    browseSearchErrorPresentation?.showRetry ?? true;

  const listAriaBusy = isLoading || isFetchingNextPage || workerLoading;
  const ListComponent = viewType === "masonry" ? MasonryVirtuosoList : GridVirtuosoList;
  const ItemComponent = viewType === "masonry" ? MasonryItemContainer : GridItemContainer;

  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      const result = await fetchNextPage();

      if (result.data) {
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && isSearchGalleryPage(newPage) && newPage.posts.length > 0) {
          const existingPostIds = new Set(rawPosts.map((p) => p.id));

          const newIds = newPage.posts
            .map((p) => p.id)
            .filter((id) => !existingPostIds.has(id));

          if (newIds.length > 0) {
            appendQueueIds(newIds);
          }
        }
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rawPosts, appendQueueIds]);

  const handleMasonryScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!hasNextPage || isFetchingNextPage) return;

      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const LOAD_MORE_THRESHOLD_PX = 300;
      const nearBottom =
        scrollHeight - (scrollTop + clientHeight) <= LOAD_MORE_THRESHOLD_PX;
      handleAtBottomStateChange(nearBottom);
      if (nearBottom) {
        handleEndReached();
      }
    },
    [
      hasNextPage,
      isFetchingNextPage,
      handleEndReached,
      handleAtBottomStateChange,
    ]
  );

  const viewMutation = useMutation({
    mutationFn: async (post: Post) => {
      const postData =
        post.artistId === EXTERNAL_ARTIST_ID
          ? normalizePostToPostData(post)
          : undefined;
      await window.api.markPostAsViewed(post.id, postData);
      return post.id;
    },
    onSuccess: (postId) => {
      queryClient.setQueryData<InfiniteData<BrowseGalleryPage>>(
        ["search", tags, source],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.id === postId ? { ...post, isViewed: true } : post
              ),
            })),
          };
        }
      );
    },
    onError: (err) => {
      const errorCode = (err as { code?: string })?.code;
      if (errorCode === "RATE_LIMIT") {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[Browse] Failed to mark post as viewed:", errorMessage);
    },
  });

  const handlePostClick = (index: number) => {
    const postIds = displayPosts.map((p) => p.id);
    const post = displayPosts[index];

    if (!post) {
      log.warn("[Browse] handlePostClick: post not found at index", index);
      return;
    }

    if (!post.isViewed) {
      viewMutation.mutate(post);
    }

    // Open viewer with search origin
    // listKey and origin must match queryKey ["search", tags, source] used in ViewerDialog
    openViewer({
      origin: { kind: "search", tags, source },
      ids: postIds,
      initialIndex: index,
      listKey: `search-${source}`,
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
      posts: displayPosts,
    });
  };

  return (
    <div className="flex flex-col -m-6 h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex z-[5] flex-col gap-4 px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex items-center">
          <h2 className="flex gap-2 items-center text-xl font-bold">
            <Search className="w-5 h-5 text-primary" />
            Browse
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isBulkMode ? "default" : "outline"}
                    size="icon"
                    aria-label="Toggle bulk selection mode"
                    onClick={() => {
                      if (isBulkMode) {
                        deactivateBulkMode();
                        return;
                      }
                      activateBulkMode();
                    }}
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk selection</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex flex-col flex-1 min-h-0">
        {isFatalSearchError ? (
          <Alert variant="destructive" className="mx-6 mt-4 shrink-0">
            <AlertTitle>{searchErrorTitle}</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{searchErrorMessage}</p>
              {showSearchRetryButton ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void refetchSearch()}>
                  Retry
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        {isSearchError && !isFatalSearchError ? (
          <Alert className="mx-6 mt-4 shrink-0">
            <AlertTitle>Could not refresh results</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{searchErrorMessage}. Showing previously loaded posts.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetchSearch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {workerError && !usesDefaultRemoteFilters ? (
          <Alert variant="destructive" className="mx-6 mt-4 shrink-0">
            <AlertTitle>Could not filter posts</AlertTitle>
            <AlertDescription>
              {workerError.message}. Showing unfiltered results when available.
            </AlertDescription>
          </Alert>
        ) : null}
        {(isLoading ||
          isFetching ||
          (!usesDefaultRemoteFilters && workerLoading)) &&
        displayPosts.length === 0 &&
        !isFatalSearchError ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : displayPosts.length === 0 && !isFatalSearchError && !isFetching ? (
          <div className="flex flex-col gap-4 justify-center items-center h-full px-6">
            {hasFilteredOutResults ? (
              <div className="flex flex-col gap-4 items-center max-w-md text-center">
                <Search className="w-16 h-16 opacity-50 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">
                    No posts match current filters
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Source or media filters excluded all loaded API results. Try switching Source to All.
                  </p>
                </div>
              </div>
            ) : tags.length > 0 && isRemoteBrowseSource ? (
              <div className="flex flex-col gap-4 items-center max-w-md text-center">
                <Search className="w-16 h-16 opacity-50 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">
                    API returned no results
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No posts matched this tag in the API. Try the website link or
                    check spelling — some artist tags use a different name on Rule34.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const tagString = tags.join("+");
                    const url = `https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(tagString)}`;
                    window.api.openExternal(url);
                  }}
                  variant="default"
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open {tags[0]} on Rule34.xxx
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 justify-center items-center text-muted-foreground">
                <Search className="w-16 h-16 opacity-50" />
                <div className="text-center">
                  <p className="mb-2 text-lg font-semibold">No posts found</p>
                  <p className="text-sm">
                    {source !== "all"
                      ? `Source is "${source}". Open Filters and set Source to "All" for live API Browse.`
                      : "Try different tags or change the current filters."}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : viewType === "masonry" ? (
            <div className="overflow-auto h-full" onScroll={handleMasonryScroll}>
              <GridContainer viewType="masonry">
                {displayPosts.map((post, index) => (
                  <div key={getPostCardKey(post)} className="w-full mb-4 break-inside-avoid">
                    <PostCard
                      post={post}
                      onClick={() => handlePostClick(index)}
                      preserveAspect={false}
                    />
                  </div>
                ))}
              </GridContainer>
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          ) : (
            <VirtuosoGrid
              className="h-full"
              aria-busy={listAriaBusy}
              totalCount={displayPosts.length}
              endReached={handleEndReached}
              atBottomStateChange={handleAtBottomStateChange}
              increaseViewportBy={600}
              components={{
                List: ListComponent,
                Item: ItemComponent,
                Footer: () =>
                  isFetchingNextPage ? (
                    <div className="flex col-span-full justify-center py-4 w-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : null,
              }}
              itemContent={(index) => {
                const post = displayPosts[index];
                if (!post) return null;

                return (
                  <PostCard
                    key={getPostCardKey(post)}
                    post={post}
                    onClick={() => handlePostClick(index)}
                  />
                );
              }}
            />
          )}
      </div>
      <BulkActionBar
        selectedPosts={selectedPosts}
        onSelectAll={
          tags.length > 0
            ? () => {
                const selectableIds = displayPosts.map((post) => getBulkSelectId(post));
                const isAllSelected =
                  selectableIds.length > 0 &&
                  selectableIds.every((id) => selectedIds.has(id));
                if (isAllSelected) {
                  clearSelection();
                  return;
                }
                selectAll(selectableIds);
              }
            : undefined
        }
      />
    </div>
  );
};
