import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { ArrowLeft, Loader2, List, Sparkles, CheckSquare } from "lucide-react";
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
import type { Playlist, Post } from "@shared/types/db";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { useShallow } from "zustand/react/shallow";
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
import { useMasonryInfiniteScroll } from "../../hooks/useMasonryInfiniteScroll";
import { SortablePostCard } from "./PlaylistVirtuosoComponents";

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
  playlist: Playlist;
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

  // Use useShallow for combined selector to prevent multiple re-renders
  // This ensures all three values are selected atomically, preventing cascading re-renders
  const { viewType, filters, sortOrder } = useSearchStore(
    useShallow((state) => ({
      viewType: state.viewType,
      filters: state.filters,
      sortOrder: state.sortOrder,
    }))
  );
  const queryClient = useQueryClient();

  // Build filters for API call from search store state
  const apiFilters = useMemo(() => {
    const result: { mediaType?: "all" | "images" | "videos" } = {};

    // Map mediaType filter from current search store state
    if (filters.mediaType && filters.mediaType !== "all") {
      result.mediaType = filters.mediaType;
    }
    
    return result;
  }, [filters.mediaType]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<Post[], Error, InfiniteData<Post[]>, QueryKey, number>({
    queryKey: [
      "playlist-posts",
      playlist.id,
      filters.mediaType,
      filters.aiFilter,
      sortOrder,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return await window.api.resolvePlaylistPosts({
        playlistId: playlist.id,
        page: pageParam,
        limit: 50,
        filters: Object.keys(apiFilters).length > 0 ? apiFilters : undefined,
        sortOrder,
        isRandom: false,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
      return allPages.length + 1;
    },
  });

  const allPosts = useMemo(() => {
    let posts = data?.pages.flat() ?? [];

    if (filters.aiFilter === "hide") {
      posts = posts.filter((post) => !hasAiGeneratedTag(post.tags));
    } else if (filters.aiFilter === "only") {
      posts = posts.filter((post) => hasAiGeneratedTag(post.tags));
    }

    return posts;
  }, [data, filters.aiFilter]);
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

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage().then((result) => {
        const newPage = result.data?.pages[result.data.pages.length - 1];
        if (!newPage || newPage.length === 0) return;
        const filteredIds = newPage
          .filter((post) =>
            shouldIncludePostInPlaylistQueue(post, {
              aiFilter: filters.aiFilter,
            })
          )
          .map((post) => (post.id === 0 && post.postId ? post.postId : post.id));
        if (filteredIds.length > 0) {
          appendQueueIds(filteredIds);
        }
      });
    }
  };

  const handlePostClick = (index: number) => {
    // For remote posts (id=0), use postId as identifier; for local posts, use id
    const postIds = displayedPosts.map((p) => (p.id === 0 && p.postId ? p.postId : p.id));
    
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
        mediaType: filters.mediaType,
        aiFilter: filters.aiFilter,
        sortOrder,
        provider, // Pass provider to origin for shadow insert operations
      },
      ids: postIds,
      initialIndex: index,
      listKey: `playlist-${playlist.id}`,
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
    });
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleMasonryScroll = useMasonryInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore: fetchNextPage,
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
      queryClient.invalidateQueries({ queryKey: ["playlist-posts", playlist.id] });
      // Invalidate playlist-entries so PostCard/QuickAddToPlaylistMenu on other tabs show correct status
      queryClient.invalidateQueries({ queryKey: ["playlist-entries"] });
      queryClient.invalidateQueries({ queryKey: ["playlist-entries", postId] });
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
              {playlist.isSmart && (
                <p className="text-xs text-muted-foreground mt-1">
                  Smart Collection
                </p>
              )}
              {displayedPosts.length > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Total: {displayedPosts.length}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
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
        {isLoading && displayedPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : viewType === "masonry" ? (
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
                      !playlist.isSmart ? () => handleRemovePost(post.id) : undefined
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
                      onRemove={() => handleRemovePost(post.id)}
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
                    !playlist.isSmart ? () => handleRemovePost(post.id) : undefined
                  }
                />
              );
            }}
          />
        )}
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
