import { useMemo, useCallback, useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { Search, Loader2, CheckSquare } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import { resolveErrorMessage } from "../../utils/error-message";
import {
  assertBrowseSearchError,
  getBrowseSearchErrorPresentation,
  getBrowseSearchRetryDelayMs,
  shouldRetryBrowseSearch,
  toBrowseSearchError,
} from "../../utils/provider-search-error";
import { BrowseErrorState } from "../browse/BrowseErrorState";
import { useViewerStore } from "../../store/viewerStore";
import {
  buildBooruTagListForIpc,
  buildRemoteBooruTagListForIpc,
  useSearchStore,
} from "../../store/searchStore";
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
import { useMasonryInfiniteScroll } from "../../hooks/useMasonryInfiniteScroll";
import { useWorkerFilteredPosts } from "../../hooks/useWorkerFilteredPosts";
import type { WorkerFilterConfig } from "../../hooks/useWorkerProcessor";
import type { Post } from "@shared/types/db";
import { normalizePostToPostData } from "../../../shared/utils/post-normalization";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";
import { getErrorCode } from "../../../shared/utils/type-guards";
import type { SearchBooruPageResult, BrowseSearchPageParam } from "../../../shared/schemas/search";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";
import { useReleaseRadixModalLockOnMount } from "../../hooks/useReleaseRadixModalLockOnMount";
import {
  buildBrowseSearchQueryKey,
  getSearchBrowseNextPageParam,
  isSearchGalleryPage,
} from "../../utils/react-query-cache";
import { createVirtuosoGridFactories } from "../gallery/virtuoso-factories";

const POSTS_PER_PAGE = 50;
const BROWSE_SEARCH_STALE_TIME_MS = 5 * 60 * 1000;
const BROWSE_SEARCH_GC_TIME_MS = 30 * 60 * 1000;

type BrowseGalleryPage = SearchBooruPageResult<Post>;

function isBrowseCursorPageParam(
  pageParam: BrowseSearchPageParam
): pageParam is { beforePostId: number } {
  return typeof pageParam === "object" && "beforePostId" in pageParam;
}

const {
  GridContainer,
  GridItemContainer,
  MasonryItemContainer,
  GridVirtuosoList,
  MasonryVirtuosoList,
} = createVirtuosoGridFactories("Browse");

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

  // Chip tags for queryKey / viewer origin (must stay isomorphic with cache helpers).
  const tags = useMemo(
    () => buildBooruTagListForIpc(includeTags, excludeTags),
    [includeTags, excludeTags]
  );

  // Use atomic selectors to prevent unnecessary re-renders
  // Each field is selected independently, so changing viewType won't trigger
  // re-render if only filters change, and vice versa
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const viewType = useSearchStore((state) => state.viewType);
  // Use atomic selectors - faster than useShallow for 3 fields
  // Each selector only re-renders when its specific field changes
  const aiFilter = useSearchStore((state) => state.filters.aiFilter);
  const mediaType = useSearchStore((state) => state.filters.mediaType);
  const source = useSearchStore((state) => state.filters.source);

  // App seeds ["settings"]; Browse reads provider for remote AI / media tag injection.
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => window.api.getSettings(),
  });
  const provider = settings?.provider ?? "rule34";

  const { tags: remoteSearchTags, aiInjected, mediaInjected } = useMemo(
    () =>
      buildRemoteBooruTagListForIpc({
        includeTags,
        excludeTags,
        provider,
        aiFilter,
        mediaType,
      }),
    [includeTags, excludeTags, provider, aiFilter, mediaType]
  );

  const isRemoteBrowseSource = source === "all";
  // When injection succeeds, worker skips that axis; conflict / unverified keep the worker path.
  const workerAiFilter = aiInjected ? "all" : aiFilter;
  const workerMediaType = mediaInjected ? "all" : mediaType;
  const usesDefaultRemoteFilters =
    isRemoteBrowseSource &&
    tags.length === 0 &&
    workerAiFilter === "all" &&
    workerMediaType === "all";
  const workerEnabled = isRemoteBrowseSource && !usesDefaultRemoteFilters;
  // queryKey keeps chip tags + aiFilter (not injected tokens); aiFilter change still refetches.
  const browseSearchQueryKey = buildBrowseSearchQueryKey({
    tags,
    source,
    aiFilter,
    mediaType,
    sortOrder,
  });
  const sqlOptionalFilters = {
    aiFilter: aiFilter === "all" ? undefined : aiFilter,
    mediaType: mediaType === "all" ? undefined : mediaType,
    tags: tags.length > 0 ? tags.join(" ") : undefined,
  };

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
  } = useGalleryInfiniteScroll<
    BrowseGalleryPage,
    Post,
    unknown[],
    BrowseSearchPageParam
  >({
    queryKey: [...browseSearchQueryKey],
    initialPageParam: 1,
    flattenPage: (page) => page.posts,
    fetchFn: async (pageParam) => {
      if (source === "favorites") {
        const page =
          typeof pageParam === "number" ? pageParam : 1;
        const posts = await window.api.getArtistPosts({
          page,
          sortOrder,
          filters: {
            isFavorited: true,
            ...sqlOptionalFilters,
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
          sortOrder,
          filters: {
            sinceTracking: true,
            ...sqlOptionalFilters,
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
            tags: remoteSearchTags,
            page: 1,
            beforePostId: pageParam.beforePostId,
            limit: POSTS_PER_PAGE,
          });
        }

        return await window.api.searchBooru({
          tags: remoteSearchTags,
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

  // Worker is remote-only (source=all with non-default AI/media or an active tag search).
  // Favorites/Subscriptions apply aiFilter/mediaType in SQL before LIMIT/OFFSET.
  // Successful remote injection: workerAiFilter / workerMediaType are "all".
  const filterConfig: WorkerFilterConfig = useMemo(() => ({
    aiFilter: workerAiFilter,
    mediaType: workerMediaType,
    sortOrder,
  }), [workerAiFilter, workerMediaType, sortOrder]);

  const {
    data: workerPosts = [],
    isLoading: workerLoading,
    error: workerError,
  } = useWorkerFilteredPosts(
    rawPosts,
    filterConfig,
    250,
    workerEnabled
  );

  const displayPosts = useMemo(() => {
    if (!workerEnabled) {
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
    workerEnabled,
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
    workerEnabled && rawPosts.length > 0 && displayPosts.length === 0;
  const isFatalSearchError = isSearchError && rawPosts.length === 0;
  const browseSearchError = toBrowseSearchError(searchError);
  const browseSearchErrorPresentation = browseSearchError
    ? getBrowseSearchErrorPresentation(
        browseSearchError.kind,
        browseSearchError.retryAfterMs
      )
    : null;
  const partialSearchErrorMessage = browseSearchErrorPresentation
    ? browseSearchErrorPresentation.description
    : resolveErrorMessage(searchError, "Failed to load posts.");

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

  const handleMasonryScroll = useMasonryInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore: handleLoadMore,
  });

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
        browseSearchQueryKey,
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
      const errorCode = getErrorCode(err);
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

    // listKey and origin must match Browse queryKey (buildBrowseSearchQueryKey)
    openViewer({
      origin: { kind: "search", tags, source, aiFilter, mediaType, sortOrder },
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
          <BrowseErrorState
            kind={browseSearchError?.kind ?? "generic"}
            retryAfterMs={browseSearchError?.retryAfterMs}
            genericDescription={partialSearchErrorMessage}
            onRetry={() => void refetchSearch()}
          />
        ) : null}
        {isSearchError && !isFatalSearchError ? (
          <Alert className="mx-6 mt-4 shrink-0">
            <AlertTitle>Could not refresh results</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{partialSearchErrorMessage}. Showing previously loaded posts.</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void refetchSearch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {workerError && workerEnabled ? (
          <Alert variant="destructive" className="mx-6 mt-4 shrink-0">
            <AlertTitle>Could not filter posts</AlertTitle>
            <AlertDescription>
              {workerError.message}. Showing unfiltered results when available.
            </AlertDescription>
          </Alert>
        ) : null}
        {(isLoading ||
          isFetching ||
          (workerEnabled && workerLoading)) &&
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
                    AI or media filters excluded all loaded API results. Try switching AI/Media to All.
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
                  <MasonryItemContainer key={getPostCardKey(post)}>
                    <PostCard
                      post={post}
                      onClick={() => handlePostClick(index)}
                      preserveAspect={false}
                    />
                  </MasonryItemContainer>
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
