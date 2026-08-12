import React, { useCallback, useMemo, useEffect } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { Heart, Loader2, CheckSquare } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import { hasAiGeneratedTag, isVideoPost } from "../../lib/filter-utils";
import { useViewerStore } from "../../store/viewerStore";
import { buildBooruTagListForIpc, useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import type { Post } from "@shared/types/db";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";
import { getErrorCode } from "../../../shared/utils/type-guards";
import { createVirtuosoGridFactories } from "../gallery/virtuoso-factories";

// --- Constants ---
// Should ideally come from a shared constant or backend config
// This matches the default limit in GetPostsSchema
const POSTS_PER_PAGE = 50;

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
  MasonryVirtuosoList,
} = createVirtuosoGridFactories("Favorites");

// --- Основной компонент ---

export const Favorites = () => {
  const queryClient = useQueryClient();
  const includeTags = useSearchStore((state) => state.includeTags);
  const excludeTags = useSearchStore((state) => state.excludeTags);
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
  const filters = useSearchStore((state) => state.filters);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
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
        return lastPage.length === POSTS_PER_PAGE ? allPages.length + 1 : undefined;
      },
      initialPageParam: 1,
    });
  
  const { aiFilter, mediaType } = filters;

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

    // Sort by publishedAt (date of post creation)
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
      
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [data, sortOrder, aiFilter, mediaType]);
  const selectedPosts = useMemo(
    () => allPosts.filter((post) => selectedIds.has(getBulkSelectId(post))),
    [allPosts, selectedIds]
  );

  const listAriaBusy = isLoading || isFetchingNextPage;
  const ListComponent = viewType === "masonry" ? MasonryVirtuosoList : GridVirtuosoList;
  const ItemComponent = viewType === "masonry" ? MasonryItemContainer : GridItemContainer;

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
      if (errorCode === "RATE_LIMIT") {
        return; // Silently ignore rate limit errors
      }
      // Log other errors for debugging
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[Favorites] Failed to mark post as viewed:", errorMessage);
    },
  });

  const handleLoadMore = async () => {
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
  };

  const handlePostClick = (index: number) => {
    const currentPosts = allPosts;
    const post = currentPosts[index];

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
      ids: currentPosts.map((p) => p.id),
      initialIndex: index,
      listKey: "favorites-list",
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
    });
  };

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
    <div className="flex flex-col h-full -m-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex z-[5] items-center px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex gap-4 items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              Favorites
            </h2>
            {allPosts.length > 0 && (
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-sm font-medium text-muted-foreground">
                  {allPosts.length} {allPosts.length === 1 ? "post" : "posts"}
                </span>
              </div>
            )}
          </div>
        </div>
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

      {/* Grid Content */}
      <div className="flex-1 min-h-0">
        {isLoading && allPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-muted-foreground gap-4">
            <Heart className="w-16 h-16 opacity-50" />
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">No favorites yet</p>
              <p className="text-sm">Go explore and mark posts as favorites!</p>
            </div>
          </div>
        ) : (
          viewType === "masonry" ? (
            <div className="overflow-auto h-full" onScroll={handleMasonryScroll}>
              <GridContainer viewType="masonry">
                {allPosts.map((post, index) => (
                  <div key={getPostCardKey(post)} className="w-full mb-4 break-inside-avoid">
                    <PostCard
                      post={post}
                      onClick={() => handlePostClick(index)}
                      preserveAspect={false}
                      context="favorites"
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
              endReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
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
                    context="favorites"
                  />
                );
              }}
            />
          )
        )}
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
