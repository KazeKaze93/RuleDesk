import { useCallback, useMemo, useEffect } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Heart, Loader2, CheckSquare, FilterX } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { hasAiGeneratedTag, isVideoPost } from "../../lib/filter-utils";
import {
  FAVORITES_EMPTY_KIND,
  resolveFavoritesEmptyKind,
} from "../../lib/favorites-empty";
import { useViewerStore } from "../../store/viewerStore";
import {
  buildBooruTagListForIpc,
  DEFAULT_FILTERS,
  useSearchStore,
} from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import type { Post } from "@shared/types/db";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { PageHeader } from "../layout/PageHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";
import { ErrorCode } from "@shared/types/error-codes";
import { getErrorCode } from "../../../shared/utils/type-guards";
import { createVirtuosoGridFactories } from "../gallery/virtuoso-factories";
import { GalleryLoadError } from "../gallery/GalleryLoadError";
import { useMasonryInfiniteScroll } from "../../hooks/useMasonryInfiniteScroll";
import { useDownloadAllFromBackend } from "../../hooks/useDownloadAll";
import { DownloadAllButton } from "../downloads/DownloadAllButton";
import { resolveErrorMessage } from "../../utils/error-message";
import { POSTS_PAGE_SIZE } from "../../../shared/constants";
import type { PostFilterRequest } from "@shared/schemas/post";

const FAVORITES_EMPTY_NONE_TITLE = "No favorites yet";
const FAVORITES_EMPTY_NONE_HINT =
  "Open a post in the viewer and press F to add it to favorites.";
const FAVORITES_EMPTY_NONE_BROWSE_LABEL = "Go to Browse";
const FAVORITES_EMPTY_FILTERED_TITLE =
  "No favorites match the current filters";
const FAVORITES_EMPTY_CLEAR_FILTERS_LABEL = "Clear filters";
const BROWSE_PATH = "/browse";

/**
 * Shared filter object for favorites mass-download and count IPC.
 * Tags / aiFilter / mediaType must stay identical for both callers.
 */
const buildFavoritesMassFilters = (
  tags: string[],
  aiFilter: "all" | "hide" | "only",
  mediaType: "all" | "images" | "videos"
): PostFilterRequest => {
  const filters: PostFilterRequest = {};
  if (tags.length > 0) {
    filters.tags = tags.join(" ");
  }
  if (aiFilter !== "all") {
    filters.aiFilter = aiFilter;
  }
  if (mediaType !== "all") {
    filters.mediaType = mediaType;
  }
  return filters;
};

const shouldIncludePostInFavoritesQueue = (
  post: Post,
  filters: {
    aiFilter: "all" | "hide" | "only";
    mediaType: "all" | "images" | "videos";
  }
): boolean => {
  if (filters.aiFilter === "hide" && hasAiGeneratedTag(post.tags)) return false;
  if (filters.aiFilter === "only" && !hasAiGeneratedTag(post.tags)) return false;

  if (filters.mediaType !== "all") {
    const isVideo = isVideoPost(post.fileUrl);
    if (filters.mediaType === "videos" && !isVideo) return false;
    if (filters.mediaType === "images" && isVideo) return false;
  }

  return true;
};

const {
  GridContainer,
  GridItemContainer,
  MasonryItemContainer,
  GridVirtuosoList,
} = createVirtuosoGridFactories("Favorites");

// --- Main component ---

export const Favorites = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const includeTags = useSearchStore((state) => state.includeTags);
  const excludeTags = useSearchStore((state) => state.excludeTags);
  const clearTagChips = useSearchStore((state) => state.clearTagChips);
  const setFilters = useSearchStore((state) => state.setFilters);
  const tags = useMemo(
    () => buildBooruTagListForIpc(includeTags, excludeTags),
    [includeTags, excludeTags]
  );

  // Use separate selectors instead of destructuring to prevent unnecessary re-renders
  // Each selector only subscribes to its specific value, not the entire store
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

  // Use atomic selectors to prevent unnecessary re-renders
  // Each selector only subscribes to its specific value, not the entire store
  // This is more efficient than useShallow when fields are used in different parts of the tree
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const viewType = useSearchStore((state) => state.viewType);
  const aiFilter = useSearchStore((state) => state.filters.aiFilter);
  const mediaType = useSearchStore((state) => state.filters.mediaType);

  const hasActiveFilter =
    includeTags.length > 0 ||
    excludeTags.length > 0 ||
    aiFilter !== "all" ||
    mediaType !== "all";
  const emptyKind = useMemo(
    () => resolveFavoritesEmptyKind({ hasActiveFilter }),
    [hasActiveFilter]
  );

  const handleClearFavoritesFilters = useCallback(() => {
    clearTagChips();
    setFilters({
      aiFilter: DEFAULT_FILTERS.aiFilter,
      mediaType: DEFAULT_FILTERS.mediaType,
    });
  }, [clearTagChips, setFilters]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["posts", "favorites", tags],
    queryFn: async ({ pageParam = 1 }) => {
      return await window.api.getArtistPosts({
        filters: {
          isFavorited: true,
          tags: tags.length > 0 ? tags.join(" ") : undefined,
        },
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      // Check if the last page returned the full limit
      return lastPage.length === POSTS_PAGE_SIZE ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allPosts = useMemo(() => {
    let posts = data?.pages.flatMap((page) => page) || [];
    
    // Apply filters using atomic selectors
    // Filter AI generated posts
    if (aiFilter === "hide") {
      posts = posts.filter((post) => !hasAiGeneratedTag(post.tags));
    } else if (aiFilter === "only") {
      posts = posts.filter((post) => hasAiGeneratedTag(post.tags));
    }

    // Filter by media type
    if (mediaType !== "all") {
      posts = posts.filter((post) => {
        const isVideo = isVideoPost(post.fileUrl);
        return mediaType === "videos" ? isVideo : !isVideo;
      });
    }

    // Cross-artist favorites: no provider filter → publishedAt, then postId.
    return [...posts].sort((a, b) => {
      const dateA = a.publishedAt instanceof Date 
        ? a.publishedAt.getTime() 
        : typeof a.publishedAt === "number" 
        ? a.publishedAt 
        : 0;
      const dateB = b.publishedAt instanceof Date 
        ? b.publishedAt.getTime() 
        : typeof b.publishedAt === "number" 
        ? b.publishedAt 
        : 0;

      if (dateA !== dateB) {
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }
      return sortOrder === "desc" ? b.postId - a.postId : a.postId - b.postId;
    });
  }, [data, sortOrder, aiFilter, mediaType]);
  const selectedPosts = useMemo(
    () => allPosts.filter((post) => selectedIds.has(getBulkSelectId(post))),
    [allPosts, selectedIds]
  );

  const hasLoadedPosts =
    data?.pages.some((page) => page.length > 0) === true;
  const isFatalGalleryError = isError && !hasLoadedPosts;
  const showNextPageError = isFetchNextPageError && hasLoadedPosts;
  const galleryErrorDescription = resolveErrorMessage(
    error,
    "Failed to load favorites."
  );

  const listAriaBusy = isLoading || isFetchingNextPage;

  const downloadFilters = useMemo(
    () => buildFavoritesMassFilters(tags, aiFilter, mediaType),
    [tags, aiFilter, mediaType]
  );

  // Prefix ["posts","favorites"] so favorite toggles / bulk-remove invalidate this too.
  const {
    data: favoritesDownloadCount,
    isSuccess: isFavoritesDownloadCountReady,
  } = useQuery({
    queryKey: ["posts", "favorites", "count", tags, aiFilter, mediaType],
    queryFn: async () =>
      await window.api.getPostsCountWithFilters({
        filters: {
          ...downloadFilters,
          isFavorited: true,
        },
      }),
    retry: false,
  });

  // N = DB count with the same filters as download kind "favorites" (not loaded pages).
  const favoritesCountLabel = isFavoritesDownloadCountReady
    ? favoritesDownloadCount
    : "";
  const favoritesDownloadTotal =
    isFavoritesDownloadCountReady && typeof favoritesDownloadCount === "number"
      ? favoritesDownloadCount
      : 0;

  const {
    downloadAll,
    cancel,
    pause,
    resume,
    isDownloading: isDownloadingAll,
    isPaused,
    progress: downloadAllProgress,
    lastFailures,
    canDownload,
  } = useDownloadAllFromBackend(
    { kind: "favorites", filters: downloadFilters },
    favoritesDownloadTotal
  );

  const viewMutation = useMutation({
    mutationFn: async (postId: number) => {
      await window.api.markPostAsViewed(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.setQueriesData<InfiniteData<Post[]>>(
        { queryKey: ["posts", "favorites"] },
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
      // Ignore rate limit errors - use typed errorCode, NOT string parsing
      const errorCode = getErrorCode(err);
      if (errorCode === ErrorCode.RATE_LIMIT) {
        return; // Silently ignore rate limit errors
      }
      log.error("[Favorites] Failed to mark post as viewed:", err);
      toast.error(resolveErrorMessage(err, "Failed to mark post as viewed"));
    },
  });

  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      log.info("[Favorites] Viewer requested more posts. Fetching...");

      const result = await fetchNextPage();

      if (result.data) {
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && newPage.length > 0) {
          const newIds = newPage
            .filter((post) =>
              shouldIncludePostInFavoritesQueue(post, {
                aiFilter,
                mediaType,
              })
            )
            .map((p) => p.id);
          log.info(
            `[Favorites] Fetched ${newIds.length} new posts. Appending to Viewer queue.`
          );

          appendQueueIds(newIds);
        }
      }
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    aiFilter,
    mediaType,
    appendQueueIds,
  ]);

  const handlePostClick = (index: number) => {
    const currentDisplayedPosts = allPosts;
    const post = currentDisplayedPosts[index];

    if (!post) {
      log.warn("[Favorites] handlePostClick: post not found at index", index);
      return;
    }

    // Mark as viewed first
    if (!post.isViewed) {
      viewMutation.mutate(post.id);
    }

    // Open viewer with favorites origin
    openViewer({
      origin: { kind: "favorites", tags: tags.length > 0 ? tags : undefined },
      ids: currentDisplayedPosts.map((p) => p.id),
      initialIndex: index,
      listKey: "favorites-list",
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
      posts: currentDisplayedPosts,
    });
  };

  const triggerLoadMore = useCallback(() => {
    void handleLoadMore().catch((error: unknown) => {
      log.error("[Favorites] Failed to load more posts:", error);
    });
  }, [handleLoadMore]);

  const handleMasonryScroll = useMasonryInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore: triggerLoadMore,
  });

  const handleBulkRemove = useCallback(
    async (posts: Post[]) => {
      const failedPostIds: number[] = [];
      for (const post of posts) {
        if (!post.isFavorited) {
          continue;
        }
        try {
          await window.api.togglePostFavorite(post.id);
        } catch {
          failedPostIds.push(post.id);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["posts", "favorites"] });
      if (failedPostIds.length > 0) {
        log.error(
          `[Favorites] Bulk remove failed for ${failedPostIds.length} posts: ${failedPostIds.join(", ")}`
        );
      }
    },
    [queryClient]
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex z-[5] items-center px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="w-full">
          <PageHeader
            title="Favorites"
            icon={Heart}
            description={
              allPosts.length > 0
                ? `${allPosts.length} ${allPosts.length === 1 ? "post" : "posts"}`
                : undefined
            }
            actions={
              <div className="flex items-center gap-2">
                <DownloadAllButton
                  onClick={() => {
                    void downloadAll();
                  }}
                  onCancel={cancel}
                  onPause={pause}
                  onResume={resume}
                  isDownloading={isDownloadingAll}
                  isPaused={isPaused}
                  progress={downloadAllProgress}
                  canDownload={canDownload}
                  totalLabel={favoritesCountLabel}
                  labelMode="favorites"
                  failures={lastFailures}
                />
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
            }
          />
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex flex-col flex-1 min-h-0">
        {isFatalGalleryError ? (
          <GalleryLoadError
            title="Could not load favorites"
            description={galleryErrorDescription}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : null}
        {showNextPageError ? (
          <GalleryLoadError
            variant="inline"
            title="Could not load more favorites"
            description={`${galleryErrorDescription}. Showing previously loaded posts.`}
            onRetry={() => {
              void fetchNextPage();
            }}
          />
        ) : null}
        {isLoading && allPosts.length === 0 && !isFatalGalleryError ? (
          <div className="flex flex-col gap-3 justify-center items-center h-full px-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="grid w-full max-w-3xl grid-cols-3 gap-3 pt-4">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="aspect-square w-full" />
              ))}
            </div>
          </div>
        ) : allPosts.length === 0 && !isFatalGalleryError ? (
          <div className="flex flex-col justify-center items-center h-full text-muted-foreground gap-4">
            {emptyKind === FAVORITES_EMPTY_KIND.FILTERED ? (
              <FilterX className="w-16 h-16 opacity-50" aria-hidden="true" />
            ) : (
              <Heart className="w-16 h-16 opacity-50" aria-hidden="true" />
            )}
            <div className="text-center">
              {emptyKind === FAVORITES_EMPTY_KIND.FILTERED ? (
                <p className="text-lg font-semibold mb-2">
                  {FAVORITES_EMPTY_FILTERED_TITLE}
                </p>
              ) : (
                <>
                  <p className="text-lg font-semibold mb-2">
                    {FAVORITES_EMPTY_NONE_TITLE}
                  </p>
                  <p className="text-sm">{FAVORITES_EMPTY_NONE_HINT}</p>
                </>
              )}
            </div>
            {emptyKind === FAVORITES_EMPTY_KIND.FILTERED ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFavoritesFilters}
                aria-label={FAVORITES_EMPTY_CLEAR_FILTERS_LABEL}
              >
                <FilterX className="mr-2 w-4 h-4" />
                {FAVORITES_EMPTY_CLEAR_FILTERS_LABEL}
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  void navigate(BROWSE_PATH);
                }}
              >
                {FAVORITES_EMPTY_NONE_BROWSE_LABEL}
              </Button>
            )}
          </div>
        ) : !isFatalGalleryError ? (
          viewType === "masonry" ? (
            <div className="overflow-auto h-full" onScroll={handleMasonryScroll}>
              <GridContainer viewType="masonry">
                {allPosts.map((post, index) => (
                  <MasonryItemContainer key={getPostCardKey(post)}>
                    <PostCard
                      post={post}
                      onClick={() => handlePostClick(index)}
                      preserveAspect={false}
                      context="favorites"
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
              totalCount={allPosts.length}
              endReached={triggerLoadMore}
              increaseViewportBy={600}
              components={{
                List: GridVirtuosoList,
                Item: GridItemContainer,
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
                    context="favorites"
                  />
                );
              }}
            />
          )
        ) : null}
      </div>
      <BulkActionBar
        selectedPosts={selectedPosts}
        onRemoveSelected={handleBulkRemove}
        onSelectAll={() => {
          const selectableIds = allPosts.map((post) => getBulkSelectId(post));
          const isAllSelected =
            selectableIds.length > 0 &&
            selectableIds.every((id) => selectedIds.has(id));
          if (isAllSelected) {
            clearSelection();
            return;
          }
          selectAll(selectableIds);
        }}
      />
    </div>
  );
};
