import React, { useMemo, forwardRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";
import { useGalleryInfiniteScroll } from "../../hooks/useGalleryInfiniteScroll";
import { useWorkerFilteredPosts } from "../../hooks/useWorkerFilteredPosts";
import type { WorkerFilterConfig } from "../../hooks/useWorkerProcessor";

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
        : "flex flex-wrap gap-4 justify-center p-4 pb-32",
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
      viewType === "grid" 
        ? "w-full aspect-[2/3]" 
        : "flex-shrink-0 w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)] xl:w-[calc(20%-1rem)]",
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

  // Use atomic selectors to prevent unnecessary re-renders
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const aiFilter = useSearchStore((state) => state.filters.aiFilter);
  const mediaType = useSearchStore((state) => state.filters.mediaType);
  const source = useSearchStore((state) => state.filters.source);
  const viewType = useSearchStore((state) => state.viewType);

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
    queryKey: ["search", tags],
    fetchFn: async (pageParam) => {
      // Always fetch - empty tags array means show all posts (API omits tags parameter)
      return await window.api.searchBooru({
        tags,
        page: pageParam,
      });
    },
    // Custom getNextPageParam for external API: continue loading until empty array
    // Unlike local DB, external API doesn't tell us total count, so we load until empty
    getNextPageParam: (lastPage, allPages) => {
      // For external API, continue loading if we got any posts
      // Only stop if lastPage is empty (no more posts available)
      if (lastPage.length === 0) {
        return undefined; // No more posts
      }
      // Continue loading next page - API may return less than 50 but still have more
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
    mediaType,
    source,
    sortOrder,
    trackedTagsSet: trackedTagsArray,
    tags,
  }), [aiFilter, mediaType, source, sortOrder, trackedTagsArray, tags]);

  const { data: allPosts, isLoading: workerLoading } = useWorkerFilteredPosts(
    rawPosts,
    filterConfig,
    250 // Debounce delay
  );


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
        {(isLoading || workerLoading) && allPosts.length === 0 ? (
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
        ) : (
            // Use VirtuosoGrid for both grid and masonry - virtualization is critical for performance
            <VirtuosoGrid
              style={{ height: "100%" }}
              totalCount={allPosts.length}
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
