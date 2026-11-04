import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  List,
  Sparkles,
  CheckSquare,
  RefreshCw,
} from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button } from "../ui/button";
import type { Post } from "@shared/types/db";
import type { PlaylistWithStats } from "@shared/types/bridge";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { parsePlaylistQuery } from "../../../shared/schemas/playlist";
import { hasAiGeneratedTag } from "../../lib/filter-utils";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";
import { createVirtuosoGridFactories } from "../gallery/virtuoso-factories";
import { GalleryLoadError } from "../gallery/GalleryLoadError";
import { useGalleryInfiniteScroll } from "../../hooks/useGalleryInfiniteScroll";
import { useMasonryInfiniteScroll } from "../../hooks/useMasonryInfiniteScroll";
import { SortablePostCard } from "./PlaylistVirtuosoComponents";
import { resolveErrorMessage } from "../../utils/error-message";
import {
  PLAYLIST_MASONRY_THRESHOLD_PX,
  PLAYLIST_PREFETCH_ITEMS,
  POSTS_PAGE_SIZE,
} from "../../../shared/constants";
import {
  formatManualPlaylistCountLabel,
  formatSmartPlaylistTotalLabel,
  PLAYLIST_HEADER_REFRESH_ARIA_LABEL,
  PLAYLIST_HEADER_SMART_SUBTITLE,
  PLAYLIST_HEADER_SMART_TYPE_LABEL,
} from "./playlist-gallery-header";
import type { PlaylistResolveTotal } from "../../../shared/schemas/playlist";

const {
  GridContainer,
  GridItemContainer,
  MasonryItemContainer,
  GridVirtuosoList,
  MasonryVirtuosoList,
} = createVirtuosoGridFactories("Playlist");

const shouldIncludePostInPlaylistQueue = (
  post: Post,
  filters: {
    aiFilter: "all" | "hide" | "only";
  }
): boolean => {
  if (filters.aiFilter === "hide" && hasAiGeneratedTag(post.tags)) return false;
  if (filters.aiFilter === "only" && !hasAiGeneratedTag(post.tags)) return false;
  return true;
};

// Playlist Gallery Component (similar to ArtistGallery)
interface PlaylistGalleryProps {
  playlist: PlaylistWithStats;
  onBack: () => void;
}

export const PlaylistGallery: React.FC<PlaylistGalleryProps> = ({ playlist, onBack }) => {
  // Use atomic selector instead of useShallow for single value
  const openViewer = useViewerStore((state) => state.open);
  const appendQueueIds = useViewerStore((state) => state.appendQueueIds);
  const isBulkMode = useBulkSelect((state) => state.isBulkMode);
  const activateBulkMode = useBulkSelect((state) => state.activateBulkMode);
  const deactivateBulkMode = useBulkSelect((state) => state.deactivate);
  const selectedIds = useBulkSelect((state) => state.selectedIds);
  const selectAll = useBulkSelect((state) => state.selectAll);
  const clearSelection = useBulkSelect((state) => state.clearSelection);

  const viewType = useSearchStore((state) => state.viewType);
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const aiFilter = useSearchStore((state) => state.filters.aiFilter);
  const mediaType = useSearchStore((state) => state.filters.mediaType);
  const queryClient = useQueryClient();
  // Bump to force page-1 reload: removeQueries alone leaves keepPreviousData
  // on the same key, so the grid would keep the scrolled pages until refetch.
  const [refreshEpoch, setRefreshEpoch] = useState(0);

  // Build filters for API call from search store state (AI counted on main).
  const apiFilters = useMemo(() => {
    const result: {
      mediaType?: "all" | "images" | "videos";
      aiFilter?: "all" | "hide" | "only";
    } = {};

    if (mediaType && mediaType !== "all") {
      result.mediaType = mediaType;
    }
    if (aiFilter && aiFilter !== "all") {
      result.aiFilter = aiFilter;
    }

    return result;
  }, [mediaType, aiFilter]);

  const {
    data,
    allPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    isError,
    error,
    refetch,
    handleEndReached,
    handleRangeChanged,
    loadMoreNow,
    isFetching,
  } = useGalleryInfiniteScroll({
    queryKey: [
      "playlist-posts",
      playlist.id,
      mediaType,
      aiFilter,
      sortOrder,
      refreshEpoch,
    ],
    initialPageParam: 1,
    prefetchItems: PLAYLIST_PREFETCH_ITEMS,
    fetchFn: async (page) => {
      return await window.api.resolvePlaylistPosts({
        playlistId: playlist.id,
        page,
        limit: POSTS_PAGE_SIZE,
        filters: Object.keys(apiFilters).length > 0 ? apiFilters : undefined,
        sortOrder,
        isRandom: false,
      });
    },
    flattenPage: (page) => page.posts,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.posts.length < POSTS_PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
  });

  const smartResolveTotal: PlaylistResolveTotal =
    playlist.isSmart && data?.pages[0] !== undefined
      ? data.pages[0].total
      : null;
  const smartTotalLabel = formatSmartPlaylistTotalLabel(smartResolveTotal);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!playlist.isSmart) {
      // setState-in-effect: `localPosts` is a DnD-mutable copy of React Query `allPosts` and
      // must be replaced when the server list updates; deriving without local state would drop reorder.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalPosts(allPosts);
    }
  }, [allPosts, playlist.isSmart]);

  useEffect(() => {
    return () => {
      deactivateBulkMode();
    };
  }, [deactivateBulkMode]);

  const displayedPosts = playlist.isSmart ? allPosts : localPosts;
  const selectedPosts = useMemo(
    () => displayedPosts.filter((post) => selectedIds.has(getBulkSelectId(post))),
    [displayedPosts, selectedIds]
  );

  // Viewer / masonry: loadMoreNow (same ref-gate as handleEndReached, no debounce)
  // then appendQueueIds. Virtuoso grid uses handleEndReached (debounced).
  const handleLoadMore = useCallback(() => {
    void loadMoreNow().then((newPage) => {
      if (!newPage || newPage.posts.length === 0) return;
      // Main already applied AI when requested; keep client gate for queue safety.
      const filteredIds = newPage.posts
        .filter((post) =>
          shouldIncludePostInPlaylistQueue(post, {
            aiFilter,
          })
        )
        .map((post) => (post.id === 0 && post.postId ? post.postId : post.id));
      if (filteredIds.length > 0) {
        appendQueueIds(filteredIds);
      }
    });
  }, [loadMoreNow, aiFilter, appendQueueIds]);

  const handleRefreshCollection = useCallback(() => {
    // New queryKey drops infinite pages; placeholderData keeps the prior grid
    // until page 1 arrives with a fresh hybrid snapshot total.
    setRefreshEpoch((n) => n + 1);
  }, []);

  const isRefreshBusy = isLoading || isFetching || isFetchingNextPage;

  const handlePostClick = (index: number) => {
    const currentDisplayedPosts = displayedPosts;
    // For remote posts (id=0), use postId as identifier; for local posts, use id
    const postIds = currentDisplayedPosts.map((p) =>
      p.id === 0 && p.postId ? p.postId : p.id
    );

    // CRITICAL: Extract provider from playlist queryJson for shadow insert operations
    // Provider must match the actual source of posts to prevent 404 or invalid data
    let provider: "rule34" | "gelbooru" | undefined = undefined;
    if (playlist.isSmart && playlist.queryJson) {
      const parsedQuery = parsePlaylistQuery(
        playlist.queryJson,
        playlist.querySchemaVersion
      );
      provider = parsedQuery?.provider;
    }

    openViewer({
      origin: {
        kind: "playlist",
        playlistId: playlist.id,
        mediaType,
        aiFilter,
        sortOrder,
        provider, // Pass provider to origin for shadow insert operations
      },
      ids: postIds,
      initialIndex: index,
      listKey: `playlist-${playlist.id}`,
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
      posts: currentDisplayedPosts,
    });
  };

  const handleMasonryScroll = useMasonryInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    thresholdPx: PLAYLIST_MASONRY_THRESHOLD_PX,
    onLoadMore: () => {
      void handleLoadMore();
    },
  });

  const handleRemovePost = async (postId: number) => {
    if (playlist.isSmart) {
      log.warn("[PlaylistGallery] Cannot remove posts from smart playlists");
      return;
    }

    const previousPosts = localPosts;
    setLocalPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));

    try {
      await window.api.removePostsFromPlaylist({
        playlistId: playlist.id,
        postIds: [postId],
      });

      // Invalidate playlist posts list
      void queryClient
        .invalidateQueries({ queryKey: ["playlist-posts", playlist.id] })
        .catch((error: unknown) => {
          log.error("[PlaylistGallery] Failed to invalidate playlist posts:", error);
        });
      // Invalidate playlist-entries so PostCard/QuickAddToPlaylistMenu on other tabs show correct status
      void queryClient
        .invalidateQueries({ queryKey: ["playlist-entries"] })
        .catch((error: unknown) => {
          log.error("[PlaylistGallery] Failed to invalidate playlist entries:", error);
        });
      void queryClient
        .invalidateQueries({ queryKey: ["playlist-entries", postId] })
        .catch((error: unknown) => {
          log.error(
            "[PlaylistGallery] Failed to invalidate playlist entry for post:",
            error
          );
        });
    } catch (error) {
      log.error("[PlaylistGallery] Failed to remove post from playlist:", error);
      setLocalPosts(previousPosts);
    }
  };

  const handleBulkRemove = useCallback(
    async (posts: Post[]) => {
      const removableIds = posts.map((post) => post.id).filter((id) => id > 0);
      if (removableIds.length === 0) {
        return;
      }
      await window.api.removePostsFromPlaylist({
        playlistId: playlist.id,
        postIds: removableIds,
      });
      await queryClient.invalidateQueries({ queryKey: ["playlist-posts", playlist.id] });
      await queryClient.invalidateQueries({ queryKey: ["playlist-entries"] });
      setLocalPosts((currentPosts) =>
        currentPosts.filter((post) => !removableIds.includes(post.id))
      );
    },
    [playlist.id, queryClient]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (playlist.isSmart) {
        return;
      }

      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const activeId = Number(active.id);
      const overId = Number(over.id);
      const oldIndex = localPosts.findIndex((post) => post.id === activeId);
      const newIndex = localPosts.findIndex((post) => post.id === overId);

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const previousPosts = localPosts;
      const newOrder = arrayMove(localPosts, oldIndex, newIndex);
      setLocalPosts(newOrder);

      window.api
        .reorderPlaylistEntries({
          playlistId: playlist.id,
          orderedPostIds: newOrder.map((post) => post.id),
        })
        .catch((error: unknown) => {
          log.error("[PlaylistsPage] Reorder failed:", error);
          setLocalPosts(previousPosts);
        });
    },
    [localPosts, playlist.id, playlist.isSmart]
  );

  const hasLoadedPosts =
    data?.pages.some((page) => page.posts.length > 0) === true;
  const isFatalGalleryError = isError && !hasLoadedPosts;
  const showNextPageError = isFetchNextPageError && hasLoadedPosts;
  const galleryErrorDescription = resolveErrorMessage(
    error,
    "Failed to load playlist posts."
  );

  const listAriaBusy = isLoading || isFetchingNextPage;
  const ListComponent = viewType === "masonry" ? MasonryVirtuosoList : GridVirtuosoList;
  const ItemComponent = viewType === "masonry" ? MasonryItemContainer : GridItemContainer;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            {playlist.isSmart ? (
              <Sparkles className="w-5 h-5 text-primary" />
            ) : (
              <List className="w-5 h-5 text-primary" />
            )}
            <div>
              <h1 className="text-xl font-semibold">{playlist.name}</h1>
              {playlist.isSmart ? (
                <>
                  <p className="text-xs text-muted-foreground mt-1">
                    {PLAYLIST_HEADER_SMART_TYPE_LABEL}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {PLAYLIST_HEADER_SMART_SUBTITLE}
                  </p>
                  {smartTotalLabel !== null && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {smartTotalLabel}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatManualPlaylistCountLabel(playlist.postCount)}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {playlist.isSmart && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={PLAYLIST_HEADER_REFRESH_ARIA_LABEL}
                    disabled={isRefreshBusy}
                    onClick={handleRefreshCollection}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
      <div className="flex flex-col flex-1 min-h-0">
        {isFatalGalleryError ? (
          <GalleryLoadError
            title="Could not load playlist"
            description={galleryErrorDescription}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : null}
        {showNextPageError ? (
          <GalleryLoadError
            variant="inline"
            title="Could not load more playlist posts"
            description={`${galleryErrorDescription}. Showing previously loaded posts.`}
            onRetry={() => {
              void fetchNextPage();
            }}
          />
        ) : null}
        {isLoading && displayedPosts.length === 0 && !isFatalGalleryError ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !isFatalGalleryError ? (
          viewType === "masonry" ? (
            <div className="overflow-auto h-full" onScroll={handleMasonryScroll}>
              <GridContainer viewType="masonry">
                {displayedPosts.map((post, index) => (
                  <MasonryItemContainer key={getPostCardKey(post)}>
                    <PostCard
                      post={post}
                      onClick={() => handlePostClick(index)}
                      preserveAspect={false}
                      context="playlist"
                      onRemoveFromPlaylist={
                        !playlist.isSmart
                          ? () => {
                              void handleRemovePost(post.id);
                            }
                          : undefined
                      }
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
          ) : !playlist.isSmart ? (
            <div className="overflow-auto h-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayedPosts.map((post) => post.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 gap-4 p-4 pb-44 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {displayedPosts.map((post, index) => (
                      <SortablePostCard
                        key={getPostCardKey(post)}
                        post={post}
                        onClick={() => handlePostClick(index)}
                        onRemove={() => {
                          void handleRemovePost(post.id);
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <VirtuosoGrid
              className="h-full"
              aria-busy={listAriaBusy}
              totalCount={displayedPosts.length}
              endReached={handleEndReached}
              rangeChanged={(range) =>
                handleRangeChanged(range, displayedPosts.length)
              }
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
                const post = displayedPosts[index];
                if (!post) return null;

                return (
                  <PostCard
                    key={getPostCardKey(post)}
                    post={post}
                    onClick={() => handlePostClick(index)}
                    context="playlist"
                    onRemoveFromPlaylist={
                      !playlist.isSmart
                        ? () => {
                            void handleRemovePost(post.id);
                          }
                        : undefined
                    }
                  />
                );
              }}
            />
          )
        ) : null}
      </div>
      <BulkActionBar
        selectedPosts={selectedPosts}
        currentPlaylistId={playlist.id}
        currentPlaylistIsSmart={playlist.isSmart}
        onRemoveSelected={!playlist.isSmart ? handleBulkRemove : undefined}
        onSelectAll={() => {
          const selectableIds = displayedPosts.map((post) => getBulkSelectId(post));
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
