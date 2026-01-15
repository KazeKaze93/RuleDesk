import React, { useMemo, forwardRef, useCallback, useRef, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import { cn } from "../../lib/utils";
import { hasAiGeneratedTag, isVideoPost } from "../../lib/filter-utils";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";

// --- Constants ---
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

// ItemContainer will be created dynamically based on viewType
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

// VirtuosoList component - must be stable across renders to preserve Virtuoso optimizations
// This component is used directly in VirtuosoGrid.components.List
// Note: VirtuosoGrid passes ref to List component, so we must use forwardRef
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

// --- Helper function to parse tags from query string ---
/**
 * Parses a space-separated or comma-separated tag string into an array
 * Handles both "tag1 tag2 tag3" and "tag1, tag2, tag3" formats
 */
const parseTags = (query: string): string[] => {
  if (!query.trim()) return [];

  // Split by comma or space, filter empty strings, trim each tag
  return query
    .split(/[,\s]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

// --- Основной компонент ---

export const Browse = () => {
  // Use individual selectors to prevent unnecessary re-renders
  const query = useSearchStore((state) => state.query);
  const openViewer = useViewerStore((state) => state.open);
  const appendQueueIds = useViewerStore((state) => state.appendQueueIds);

  // Parse tags directly from query using useMemo (no extra re-render)
  const tags = useMemo(() => {
    return parseTags(query);
  }, [query]);

  // Fetch tracked artists for subscriptions filter
  const { data: trackedArtists } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["search", tags],
      queryFn: async ({ pageParam = 1 }) => {
        // Always fetch - empty tags array means show all posts (API omits tags parameter)
        const result = await window.api.searchBooru({
          tags,
          page: pageParam,
        });
        return result;
      },
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        // Use lastPageParam + 1 for correct pagination
        return lastPage.length === POSTS_PER_PAGE
          ? (lastPageParam as number) + 1
          : undefined;
      },
      initialPageParam: 1,
      // Always enabled - empty tags array means show all posts
    });

  const sortOrder = useSearchStore((state) => state.sortOrder);
  const filters = useSearchStore((state) => state.filters);
  const viewType = useSearchStore((state) => state.viewType);

  // Store raw posts (before filtering) for infinite scroll calculation
  const rawPosts = useMemo(() => {
    return data?.pages.flatMap((page) => page) || [];
  }, [data]);

  // Build tracked tags set with all variations for subscriptions filter
  const trackedTagsSet = useMemo(() => {
    if (!trackedArtists || trackedArtists.length === 0) return new Set<string>();
    
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
    
    return tagsSet;
  }, [trackedArtists]);

  // Check if we have active filters
  const hasActiveFilters = useMemo(() => {
    return filters.aiFilter !== "all" || 
           filters.mediaType !== "all" || 
           filters.source !== "all" ||
           filters.orientation !== "all";
  }, [filters]);

  const allPosts = useMemo(() => {
    let posts = [...rawPosts];
    
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
    
    // Filter by source - Browse shows external posts
    // Only apply source filter if there's an active search (tags.length > 0)
    // This prevents duplication with Favorites and Updates tabs
    if (tags.length > 0) {
      if (filters.source === "favorites") {
        // Show only favorited posts (check isFavorited flag)
        // Use strict check to ensure we only show posts that are explicitly favorited
        posts = posts.filter((post) => Boolean(post.isFavorited) === true);
      } else if (filters.source === "subscriptions") {
        // Show only posts from tracked artists (check if post tags match tracked artist tags)
        if (trackedTagsSet.size > 0) {
          posts = posts.filter((post) => {
            if (!post.tags) return false;
            const postTags = post.tags.toLowerCase().split(/\s+/);
            return postTags.some((tag) => trackedTagsSet.has(tag));
          });
        } else {
          // No tracked artists, show nothing
          posts = [];
        }
      } else if (filters.source === "all") {
        // Show all posts (no filter)
      }
    }
    // If no active search (tags.length === 0), ignore source filter
    
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
  }, [rawPosts, sortOrder, filters, trackedTagsSet]);


  // Handle end reached for infinite scroll - always load more if available
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Ref for masonry infinite scroll observer
  const masonryObserverRef = useRef<IntersectionObserver | null>(null);
  const masonryTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (viewType === "masonry" && masonryTriggerRef.current) {
      masonryObserverRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            handleEndReached();
          }
        },
        { threshold: 0.1 }
      );
      masonryObserverRef.current.observe(masonryTriggerRef.current);
    }
    return () => {
      if (masonryObserverRef.current) {
        masonryObserverRef.current.disconnect();
      }
    };
  }, [viewType, hasNextPage, isFetchingNextPage, handleEndReached]);


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
    List.displayName = "BrowseList";
    
    const Item = createItemContainer(viewType);
    Item.displayName = "BrowseItem";
    
    return { ListComponent: List, ItemComponent: Item };
  }, [isLoading, isFetchingNextPage, viewType]);

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

  const handlePostClick = (index: number) => {
    const postIds = allPosts.map((p) => p.id);
    const post = allPosts[index];

    if (!post) {
      log.warn("[Browse] handlePostClick: post not found at index", index);
      return;
    }

    // Open viewer with search origin
    // listKey: "search" matches queryKey ["search", tags] used in ViewerDialog
    openViewer({
      origin: { kind: "search", tags },
      ids: postIds,
      initialIndex: index,
      listKey: "search",
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
    });
  };

  return (
    <div className="flex flex-col -m-6 h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex z-[5] flex-col gap-4 px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex gap-2 items-center">
          <h2 className="flex gap-2 items-center text-xl font-bold">
            <Search className="w-5 h-5 text-primary" />
            Browse
          </h2>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 min-h-0">
        {isLoading && allPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col gap-4 justify-center items-center h-full px-6">
            {tags.length > 0 ? (
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
                    Try different tags or check your spelling.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : viewType === "masonry" ? (
            // Masonry layout without virtualization (CSS columns doesn't work well with VirtuosoGrid)
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
              {/* Infinite scroll trigger for masonry */}
              <div ref={masonryTriggerRef} className="h-10" />
            </div>
          ) : (
            <VirtuosoGrid
              style={{ height: "100%" }}
              totalCount={rawPosts.length}
              endReached={handleEndReached}
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
          )
        }
      </div>
    </div>
  );
};
