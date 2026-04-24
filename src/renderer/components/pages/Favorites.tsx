import React, { forwardRef, useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
  useQuery,
} from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import { cn } from "../../lib/utils";
import { hasAiGeneratedTag, isVideoPost } from "../../lib/filter-utils";
import { useViewerStore } from "../../store/viewerStore";
import { buildBooruTagListForIpc, useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import type { Post } from "../../../main/db/schema";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";
import { useDownloadAllWithFilters } from "../../hooks/useDownloadAll";
import { DownloadAllButton } from "../downloads/DownloadAllButton";

// --- Constants ---
// Should ideally come from a shared constant or backend config
// This matches the default limit in GetPostsSchema
const POSTS_PER_PAGE = 50;

const matchesOrientation = (
  post: object,
  orientation: "all" | "horizontal" | "vertical"
): boolean => {
  if (orientation === "all") return true;
  const width = Reflect.get(post, "width");
  const height = Reflect.get(post, "height");
  if (typeof width !== "number" || typeof height !== "number") return true;
  if (orientation === "horizontal") return width > height;
  return height > width;
};

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

// --- Компоненты для виртуализации (Grid/Masonry Layout) ---

const GridContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { viewType?: "grid" | "masonry" }
>(({ className, viewType = "grid", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      viewType === "grid"
        ? "grid grid-cols-2 gap-4 p-4 pb-32 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        : "columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 p-4 pb-32",
      className
    )}
    {...props}
  />
));
GridContainer.displayName = "GridContainer";

const createItemContainer = (viewType: "grid" | "masonry") => forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      viewType === "grid" 
        ? "w-full aspect-[2/3]" 
        : "flex-shrink-0 w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)] xl:w-[calc(20%-1rem)]",
      className
    )}
    {...props}
  />
));

const createVirtuosoList = (viewType: "grid" | "masonry") => forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { "aria-busy"?: boolean }
>(({ className, "aria-busy": ariaBusy, ...props }, ref) => (
  <GridContainer
    {...props}
    ref={ref}
    className={className}
    aria-busy={ariaBusy}
    viewType={viewType}
  />
));

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

  // Fetch tracked artists for subscriptions filter
  const { data: trackedArtists } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

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
  
  const { aiFilter, mediaType, source, orientation, dateFrom, dateTo } = filters;
  const rating = useSearchStore((state) => state.filters.rating);

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

    if (orientation !== "all") {
      posts = posts.filter((post) => matchesOrientation(post, orientation));
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
    
    // Filter by source - Favorites tab shows favorites by default
    if (source === "favorites") {
      // Already showing favorites, no filter needed
    } else if (source === "subscriptions") {
      // Show only favorites from tracked artists
      if (trackedArtists && trackedArtists.length > 0) {
        const trackedArtistIds = new Set(trackedArtists.map((artist) => artist.id));
        posts = posts.filter((post) => {
          // Exclude external posts (EXTERNAL_ARTIST_ID = 0)
          if (post.artistId === EXTERNAL_ARTIST_ID) return false;
          // Check if post belongs to tracked artist
          return trackedArtistIds.has(post.artistId);
        });
      } else {
        // No tracked artists, show nothing
        posts = [];
      }
    } else if (source === "all") {
      // Show all favorites (no filter)
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
  }, [data, sortOrder, aiFilter, rating, mediaType, source, orientation, dateFrom, dateTo, trackedArtists]);

  const fetchParams = useMemo(
    () => ({
      filters: {
        isFavorited: true,
        tags: tags.length > 0 ? tags.join(" ") : undefined,
        aiFilter: aiFilter === "all" ? undefined : aiFilter,
        rating: rating === "all" ? undefined : rating,
        mediaType: mediaType === "all" ? undefined : mediaType,
      },
    }),
    [tags, aiFilter, rating, mediaType]
  );
  const {
    downloadAll,
    cancel,
    pause,
    resume,
    isDownloading: isDownloadingAll,
    isPaused,
    progress: downloadAllProgress,
    canDownload,
    totalCount: downloadTotalCount,
  } = useDownloadAllWithFilters(fetchParams);

  // Create stable List and Item components with forwardRef and aria-busy
  // Must be memoized to prevent Virtuoso from remounting on every render
  const { ListComponent, ItemComponent } = useMemo(() => {
    const VirtuosoList = createVirtuosoList(viewType);
    const List = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
      (props, ref) => (
        <VirtuosoList
          {...props}
          ref={ref}
          aria-busy={isLoading || isFetchingNextPage}
        />
      )
    );
    List.displayName = "FavoritesList";
    
    const Item = createItemContainer(viewType);
    Item.displayName = "FavoritesItem";
    
    return { ListComponent: List, ItemComponent: Item };
  }, [isLoading, isFetchingNextPage, viewType]);

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
      const errorCode = (err as { code?: string })?.code;
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
          const newIds = newPage.map((p) => p.id);
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

  return (
    <div className="flex flex-col h-full -m-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex z-[5] justify-between items-center px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex gap-4 items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              Favorites
            </h2>
            {allPosts.length > 0 && (
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-sm font-medium text-muted-foreground">
                  {downloadTotalCount || allPosts.length}{" "}
                  {(downloadTotalCount || allPosts.length) === 1 ? "post" : "posts"}
                  {!downloadTotalCount && hasNextPage ? " +" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
        <DownloadAllButton
          onClick={downloadAll}
          onCancel={cancel}
          onPause={pause}
          onResume={resume}
          isDownloading={isDownloadingAll}
          isPaused={isPaused}
          progress={downloadAllProgress}
          canDownload={canDownload || allPosts.length > 0}
          totalLabel={downloadTotalCount || allPosts.length}
        />
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
              style={{ height: "100%" }}
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
    </div>
  );
};
