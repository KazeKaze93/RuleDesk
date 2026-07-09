import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { RefreshCw, Loader2, CheckCheck, User, ChevronRight, CheckSquare } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { useNavigate } from "react-router-dom";
import log from "electron-log/renderer";
import { cn } from "../../lib/utils";
import { hasAiGeneratedTag, isVideoPost } from "../../lib/filter-utils";
import { useViewerStore } from "../../store/viewerStore";
import { buildBooruTagListForIpc, useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import type { Post } from "../../../main/db/schema";
import type { TrackedArtist } from "../../../main/bridge";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import { useReleaseRadixModalLockOnMount } from "../../hooks/useReleaseRadixModalLockOnMount";

// --- Constants ---
const POSTS_PER_PAGE = 50;

const getPublishedDate = (publishedAt: Date | number | null): Date | null => {
  if (publishedAt instanceof Date) {
    return Number.isNaN(publishedAt.getTime()) ? null : publishedAt;
  }
  if (typeof publishedAt === "number") {
    const parsed = new Date(publishedAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// --- Helper function for updating InfiniteData cache ---
/**
 * Updates a single post in InfiniteData cache by postId
 * Optimized to only update the page containing the post, not all pages
 */
const updatePostInInfiniteData = (
  oldData: InfiniteData<Post[]> | undefined,
  postId: number,
  updater: (post: Post) => Post
): InfiniteData<Post[]> | undefined => {
  if (!oldData) return oldData;
  
  // Find the page index containing the post
  let pageIndex = -1;
  for (let i = 0; i < oldData.pages.length; i++) {
    if (oldData.pages[i].some((post) => post.id === postId)) {
      pageIndex = i;
      break;
    }
  }
  
  // If post not found, return unchanged
  if (pageIndex === -1) return oldData;
  
  // Update only the page containing the post
  return {
    ...oldData,
    pages: oldData.pages.map((page, index) =>
      index === pageIndex
        ? page.map((post) => (post.id === postId ? updater(post) : post))
        : page
    ),
  };
};

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
GridItemContainer.displayName = "GridItemContainer";

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
MasonryItemContainer.displayName = "MasonryItemContainer";

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
GridVirtuosoList.displayName = "GridVirtuosoList";

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
MasonryVirtuosoList.displayName = "MasonryVirtuosoList";

// --- Основной компонент ---

const hasErrorCode = (value: unknown): value is { code?: string } => {
  return typeof value === "object" && value !== null && "code" in value;
};

const FEED_VIEW = "feed";
const CREATORS_VIEW = "creators";

type UpdatesView = typeof FEED_VIEW | typeof CREATORS_VIEW;

interface CreatorsViewProps {
  artists: TrackedArtist[];
  isLoading: boolean;
  onSyncAll: () => void;
  onViewArtist: (artist: TrackedArtist) => void;
}

const CreatorsView = ({
  artists,
  isLoading,
  onSyncAll,
  onViewArtist,
}: CreatorsViewProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-6 py-3 border-b">
        <h3 className="text-lg font-semibold">Creators ({artists.length})</h3>
        <Button variant="outline" size="sm" onClick={onSyncAll}>
          <RefreshCw className="mr-2 w-4 h-4" />
          Sync All
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : artists.length === 0 ? (
        <div className="flex flex-1 justify-center items-center text-muted-foreground">
          No tracked artists yet
        </div>
      ) : (
        <div className="overflow-auto flex-1 p-4">
          <div className="space-y-3">
            {artists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => onViewArtist(artist)}
                className="flex items-center gap-3 p-3 w-full text-left rounded-lg border transition-colors bg-card hover:bg-accent hover:border-primary"
                aria-label={`View ${artist.name} gallery`}
              >
                <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{artist.name}</p>
                  <p className="text-xs truncate text-muted-foreground">
                    {`${artist.tag} \u00b7 ${artist.postsCount > 999 ? "999+" : artist.postsCount} posts \u00b7 ${
                      artist.lastPostAt === null ? "never" : formatRelativeTime(artist.lastPostAt)
                    }`}
                  </p>
                </div>
                {artist.newPostsCount > 0 && (
                  <Badge variant="default" className="flex-shrink-0 tabular-nums">
                    {artist.newPostsCount > 999 ? "999+" : artist.newPostsCount}
                  </Badge>
                )}
                <ChevronRight className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Updates = () => {
  useReleaseRadixModalLockOnMount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const includeTags = useSearchStore((state) => state.includeTags);
  const excludeTags = useSearchStore((state) => state.excludeTags);
  const [activeView, setActiveView] = useState<UpdatesView>(FEED_VIEW);
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

  // Use atomic selectors to prevent unnecessary re-renders
  // Each selector only subscribes to its specific value, not the entire store
  // This is more efficient than useShallow when fields are used in different parts of the tree
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const viewType = useSearchStore((state) => state.viewType);
  const filters = useSearchStore((state) => state.filters);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["posts", "updates", tags],
      queryFn: async ({ pageParam = 1 }) => {
        // Global feed: no artistId specified, returns posts from all tracked artists
        // sinceTracking: true filters to only posts published after artist was added
        return await window.api.getArtistPosts({
          page: pageParam,
          filters: {
            sinceTracking: true,
            tags: tags.length > 0 ? tags.join(" ") : undefined,
          },
        });
      },
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        // Use lastPageParam + 1 for correct pagination
        // This ensures we use the actual page number from the last request
        return lastPage.length === POSTS_PER_PAGE
          ? Number(lastPageParam) + 1
          : undefined;
      },
      initialPageParam: 1,
    });

  const { aiFilter, mediaType, dateFrom, dateTo } = filters;
  const rating = useSearchStore((state) => state.filters.rating);

  useEffect(() => {
    let isMounted = true;

    const markUpdatesAsSeen = async () => {
      try {
        await window.api.markAllUpdatesSeen();
        if (!isMounted) {
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ["updates", "unreadCount"] });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error("[Updates] Failed to mark updates as seen on mount:", errorMessage);
      }
    };

    void markUpdatesAsSeen();

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  useEffect(() => {
    return () => {
      deactivateBulkMode();
    };
  }, [deactivateBulkMode]);

  useEffect(() => {
    if (activeView === CREATORS_VIEW) {
      deactivateBulkMode();
    }
  }, [activeView, deactivateBulkMode]);

  const { data: artists = [], isLoading: isArtistsLoading } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
    enabled: activeView === CREATORS_VIEW,
  });

  const { data: totalUnreadCount = 0 } = useQuery({
    queryKey: ["updates", "totalUnreadCount", tags, aiFilter, rating, mediaType],
    queryFn: () =>
      window.api.getUpdatesTotalUnreadCount({
        filters: {
          sinceTracking: true,
          tags: tags.length > 0 ? tags.join(" ") : undefined,
          aiFilter: aiFilter === "all" ? undefined : aiFilter,
          rating: rating === "all" ? undefined : rating,
          mediaType: mediaType === "all" ? undefined : mediaType,
        },
      }),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const handleViewChange = (value: string) => {
    if (value === FEED_VIEW || value === CREATORS_VIEW) {
      setActiveView(value);
    }
  };

  const allPosts = useMemo(() => {
    let posts = data?.pages.flatMap((page) => page) || [];
    
    // Apply filters using atomic selectors
    // Filter AI generated posts
    if (aiFilter === "hide") {
      posts = posts.filter((post) => !hasAiGeneratedTag(post.tags));
    } else if (aiFilter === "only") {
      posts = posts.filter((post) => hasAiGeneratedTag(post.tags));
    }

    // Filter by rating
    if (rating !== "all") {
      posts = posts.filter((post) => {
        const postRating = typeof post.rating === "string" ? post.rating.trim().toLowerCase().charAt(0) : "";
        return postRating === rating;
      });
    }
    
    // Filter by media type
    if (mediaType !== "all") {
      posts = posts.filter((post) => {
        const isVideo = isVideoPost(post.fileUrl);
        return mediaType === "videos" ? isVideo : !isVideo;
      });
    }

    if (dateFrom || dateTo) {
      posts = posts.filter((post) => {
        const date = getPublishedDate(post.publishedAt);
        if (!date) return true;
        if (dateFrom && date < dateFrom) return false;
        if (dateTo && date > dateTo) return false;
        return true;
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
  }, [data, sortOrder, aiFilter, rating, mediaType, dateFrom, dateTo]);
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
      // Update cache for updates feed using helper function
      queryClient.setQueriesData<InfiniteData<Post[]>>(
        { queryKey: ["posts", "updates"] },
        (oldData) =>
          updatePostInInfiniteData(oldData, postId, (post) => ({
            ...post,
            isViewed: true,
          }))
      );
    },
    onError: (err) => {
      // Ignore rate limit errors - use typed errorCode, NOT string parsing
      const errorCode = hasErrorCode(err) ? err.code : undefined;
      if (errorCode === "RATE_LIMIT") {
        return; // Silently ignore rate limit errors
      }
      // Log other errors for debugging
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[Updates] Failed to mark post as viewed:", errorMessage);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => window.api.markAllPostsAsViewed(),
    onSuccess: () => {
      queryClient.setQueriesData<InfiniteData<Post[]>>(
        { queryKey: ["posts", "updates"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((post) => ({ ...post, isViewed: true }))
            ),
          };
        }
      );
      queryClient.setQueryData<TrackedArtist[]>(["artists"], (oldArtists) => {
        if (!oldArtists) return oldArtists;
        return oldArtists.map((artist) => ({
          ...artist,
          newPostsCount: 0,
        }));
      });
      queryClient.invalidateQueries({ queryKey: ["artists"] });
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[Updates] Failed to mark all as viewed:", errorMessage);
    },
  });

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      log.info("[Updates] Viewer requested more posts. Fetching...");

      const result = await fetchNextPage();

      if (result.data) {
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && newPage.length > 0) {
          // Get existing post IDs to avoid duplicates
          const existingPostIds = new Set(allPosts.map((p) => p.id));
          
          // Filter out posts that are already in the list
          const newIds = newPage
            .map((p) => p.id)
            .filter((id) => !existingPostIds.has(id));

          if (newIds.length > 0) {
            log.info(
              `[Updates] Fetched ${newIds.length} new posts (${newPage.length - newIds.length} duplicates skipped). Appending to Viewer queue.`
            );

            appendQueueIds(newIds);
          } else {
            log.info("[Updates] All fetched posts were already in the queue.");
          }
        }
      }
    }
  };

  const handlePostClick = (index: number) => {
    const currentPosts = allPosts;
    const post = currentPosts[index];

    if (!post) {
      log.warn("[Updates] handlePostClick: post not found at index", index);
      return;
    }

    // Mark as viewed first
    if (!post.isViewed) {
      viewMutation.mutate(post.id);
    }

    // Open viewer with updates origin
    openViewer({
      origin: { kind: "updates", tags: tags.length > 0 ? tags : undefined },
      ids: currentPosts.map((p) => p.id),
      initialIndex: index,
      listKey: "updates-list",
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

  useEffect(() => {
    const unsubscribeSyncEnd = window.api.onSyncEnd(() => {
      queryClient.invalidateQueries({ queryKey: ["posts", "updates"] });
      queryClient.invalidateQueries({ queryKey: ["artists"] });
    });

    return () => {
      unsubscribeSyncEnd();
    };
  }, [queryClient]);

  return (
    <div className="flex flex-col -m-6 h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex z-[5] justify-between items-center px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex gap-4 items-center">
          <div>
            <h2 className="flex gap-2 items-center text-xl font-bold">
              <RefreshCw className="w-5 h-5 text-primary" />
              Updates
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest posts from tracked artists
            </p>
            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
              <span className="text-sm font-medium text-muted-foreground">
                {totalUnreadCount === 0
                  ? "No new posts"
                  : `${totalUnreadCount.toLocaleString()} ${totalUnreadCount === 1 ? "new post" : "new posts"}`}
              </span>
            </div>
          </div>
        </div>
        {activeView === FEED_VIEW && (
          <div className="flex gap-2 items-center ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={allPosts.length === 0 || markAllMutation.isPending}
              aria-label="Mark all posts as read"
            >
              <CheckCheck className="mr-2 w-4 h-4" />
              Mark all read
            </Button>
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
        )}
      </div>

      {/* Grid Content */}
      <div className="flex-1 min-h-0">
        <div className="px-6 pt-4">
          <Tabs value={activeView} onValueChange={handleViewChange}>
            <TabsList>
              <TabsTrigger value={FEED_VIEW}>Feed</TabsTrigger>
              <TabsTrigger value={CREATORS_VIEW}>Creators</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {activeView === CREATORS_VIEW ? (
          <CreatorsView
            artists={artists}
            isLoading={isArtistsLoading}
            onSyncAll={() => {
              void window.api.syncAll();
            }}
            onViewArtist={(artist) => {
              navigate(`/artist/${artist.id}`);
            }}
          />
        ) : isLoading && allPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col gap-4 justify-center items-center h-full text-muted-foreground">
            <RefreshCw className="w-16 h-16 opacity-50" />
            <div className="text-center">
              <p className="mb-2 text-lg font-semibold">No posts found</p>
              <p className="text-sm">Track some artists to see updates here.</p>
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
                  />
                );
              }}
            />
          )
        )}
      </div>
      <BulkActionBar
        selectedPosts={selectedPosts}
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
