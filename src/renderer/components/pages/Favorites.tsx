import React, { forwardRef, useMemo } from "react";
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
import { useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import type { Post } from "../../../main/db/schema";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";

// Helper function to parse tags from query string
const parseTags = (query: string): string[] => {
  if (!query.trim()) return [];
  return query
    .split(/[,\s]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

// --- Constants ---
// Should ideally come from a shared constant or backend config
// This matches the default limit in GetPostsSchema
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
        ? "grid grid-cols-2 gap-4 p-4 pb-32 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        : "columns-2 gap-4 p-4 pb-32 md:columns-3 lg:columns-4 xl:columns-5 space-y-4",
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
      viewType === "grid" ? "w-full aspect-[2/3]" : "w-full mb-4 break-inside-avoid",
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
  const query = useSearchStore((state) => state.query);
  const tags = useMemo(() => parseTags(query), [query]);

  // Use separate selectors instead of destructuring to prevent unnecessary re-renders
  // Each selector only subscribes to its specific value, not the entire store
  const openViewer = useViewerStore((state) => state.open);
  const appendQueueIds = useViewerStore((state) => state.appendQueueIds);

  // Fetch tracked artists for subscriptions filter
  const { data: trackedArtists } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

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

  const sortOrder = useSearchStore((state) => state.sortOrder);
  const filters = useSearchStore((state) => state.filters);
  const viewType = useSearchStore((state) => state.viewType);

  const allPosts = useMemo(() => {
    let posts = data?.pages.flatMap((page) => page) || [];
    
    // Apply filters
    // Filter AI generated posts
    if (filters.aiFilter === "hide") {
      posts = posts.filter((post) => !hasAiGeneratedTag(post.tags));
    } else if (filters.aiFilter === "only") {
      posts = posts.filter((post) => hasAiGeneratedTag(post.tags));
    }
    
    // Filter by media type
    if (filters.mediaType !== "all") {
      posts = posts.filter((post) => {
        const isVideo = isVideoPost(post.fileUrl);
        return filters.mediaType === "videos" ? isVideo : !isVideo;
      });
    }
    
    // Filter by source - Favorites tab shows favorites by default
    if (filters.source === "favorites") {
      // Already showing favorites, no filter needed
    } else if (filters.source === "subscriptions") {
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
    } else if (filters.source === "all") {
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
  }, [data, sortOrder, filters, trackedArtists]);

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
      queryClient.setQueryData<InfiniteData<Post[]>>(
        ["posts", "favorites"],
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
                  {allPosts.length} {allPosts.length === 1 ? "post" : "posts"}
                  {hasNextPage && " +"}
                </span>
              </div>
            )}
          </div>
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
        ) : viewType === "masonry" ? (
          // Masonry layout without virtualization
          <div className="h-full overflow-auto">
            <div className="columns-2 gap-4 p-4 pb-32 md:columns-3 lg:columns-4 xl:columns-5">
              {allPosts.map((post, index) => (
                <div key={post.id} className="mb-4 break-inside-avoid">
                  <PostCard post={post} onClick={() => handlePostClick(index)} />
                </div>
              ))}
              {isFetchingNextPage && (
                <div className="flex col-span-full justify-center py-4 w-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
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
            increaseViewportBy={2000}
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
                <PostCard post={post} onClick={() => handlePostClick(index)} />
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
