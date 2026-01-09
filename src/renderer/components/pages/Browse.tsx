import React, { useMemo, forwardRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";

// --- Constants ---
const POSTS_PER_PAGE = 50;

// --- Компоненты для виртуализации (Grid Layout) ---

const GridContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid grid-cols-2 gap-4 p-4 pb-32 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
      className
    )}
    {...props}
  />
));
GridContainer.displayName = "GridContainer";

const ItemContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full aspect-[2/3]", className)} {...props} />
));
ItemContainer.displayName = "ItemContainer";

// VirtuosoList component - must be stable across renders to preserve Virtuoso optimizations
// This component is used directly in VirtuosoGrid.components.List
// Note: VirtuosoGrid passes ref to List component, so we must use forwardRef
const VirtuosoList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { "aria-busy"?: boolean }
>(({ className, "aria-busy": ariaBusy, ...props }, ref) => (
  <GridContainer
    {...props}
    ref={ref}
    className={className}
    aria-busy={ariaBusy}
  />
));
VirtuosoList.displayName = "VirtuosoList";

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

  const allPosts = useMemo(() => {
    return data?.pages.flatMap((page) => page) || [];
  }, [data]);

  // Create stable List component with forwardRef and aria-busy
  // Must be memoized to prevent Virtuoso from remounting on every render
  const ListComponent = useMemo(() => {
    const Component = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
      (props, ref) => (
        <VirtuosoList
          {...props}
          ref={ref}
          aria-busy={isLoading || isFetchingNextPage}
        />
      )
    );
    Component.displayName = "BrowseList";
    return Component;
  }, [isLoading, isFetchingNextPage]);

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {

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
            appendQueueIds(newIds);
          }
        }
      }
    }
  };

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
        ) : (
          <VirtuosoGrid
            style={{ height: "100%" }}
            totalCount={allPosts.length}
            endReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            components={{
              List: ListComponent,
              Item: ItemContainer,
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
