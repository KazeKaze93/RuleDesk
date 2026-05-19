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
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";

const POSTS_PER_PAGE = 50;

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

  // Use the new infinite scroll hook
  // For external API (Browse), we need custom getNextPageParam logic
  // because API may return less than 50 posts but still have more pages
  const {
    allPosts: rawPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    handleEndReached,
  } = useGalleryInfiniteScroll({
    queryKey: ["search", tags, source],
    fetchFn: async (pageParam) => {
      if (source === "favorites") {
        return await window.api.getArtistPosts({
          page: pageParam,
          filters: {
            isFavorited: true,
            tags: tags.length > 0 ? tags.join(" ") : undefined,
          },
        });
      }

      if (source === "subscriptions") {
        return await window.api.getArtistPosts({
          page: pageParam,
          filters: {
            sinceTracking: true,
            tags: tags.length > 0 ? tags.join(" ") : undefined,
          },
        });
      }

      // source === "all": external API search
      return await window.api.searchBooru({
        tags,
        page: pageParam,
      });
    },
    // Custom getNextPageParam for external API: continue loading until empty array
    // Unlike local DB, external API doesn't tell us total count, so we load until empty
    getNextPageParam: (lastPage, allPages) => {
      if (!isRemoteBrowseSource) {
        return lastPage.length === POSTS_PER_PAGE ? allPages.length + 1 : undefined;
      }
      if (lastPage.length === 0) {
        return undefined;
      }
      return allPages.length + 1;
    },
  });

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
    source: "all",
    dateFrom,
    dateTo,
    sortOrder,
    trackedTagsSet: trackedTagsArray,
    tags,
  }), [aiFilter, rating, mediaType, dateFrom, dateTo, sortOrder, trackedTagsArray, tags]);

  const {
    data: allPosts = [],
    isLoading: workerLoading,
    error: workerError,
  } = useWorkerFilteredPosts(
    rawPosts,
    filterConfig,
    250 // Debounce delay
  );
  const selectedPosts = useMemo(
    () => allPosts.filter((post) => selectedIds.has(getBulkSelectId(post))),
    [allPosts, selectedIds]
  );
  const hasFilteredOutResults = rawPosts.length > 0 && allPosts.length === 0;


  const listAriaBusy = isLoading || isFetchingNextPage || workerLoading;
  const ListComponent = viewType === "masonry" ? MasonryVirtuosoList : GridVirtuosoList;
  const ItemComponent = viewType === "masonry" ? MasonryItemContainer : GridItemContainer;

  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      const result = await fetchNextPage();

      if (result.data) {
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && newPage.length > 0) {
          // Get existing post IDs to avoid duplicates
          const existingPostIds = new Set(rawPosts.map((p) => p.id));

          // Filter out posts that are already in the list
          const newIds = newPage
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
      if (scrollHeight - (scrollTop + clientHeight) <= LOAD_MORE_THRESHOLD_PX) {
        void fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
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
      queryClient.setQueryData<InfiniteData<Post[]>>(
        ["search", tags],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((post) =>
                post.id === postId ? { ...post, isViewed: true } : post
              )
            ),
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
    const postIds = allPosts.map((p) => p.id);
    const post = allPosts[index];

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
        {workerError ? (
          <Alert variant="destructive" className="mx-6 mt-4 shrink-0">
            <AlertTitle>Could not filter posts</AlertTitle>
            <AlertDescription>
              {workerError.message}. Try reloading the page or reducing the number of loaded posts.
            </AlertDescription>
          </Alert>
        ) : null}
        {(isLoading || workerLoading) && allPosts.length === 0 && !workerError ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
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
                    This tag likely exists on the website but is not yet available in the API.
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
                    Try different tags or change the current source filter.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : viewType === "masonry" ? (
            <div className="overflow-auto h-full" onScroll={handleMasonryScroll}>
              <GridContainer viewType="masonry">
                {allPosts.map((post, index) => (
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
              totalCount={allPosts.length}
              endReached={handleEndReached}
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
                const post = allPosts[index];
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
                const selectableIds = allPosts.map((post) => getBulkSelectId(post));
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
