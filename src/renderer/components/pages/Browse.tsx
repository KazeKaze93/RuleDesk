import React, { useState, useMemo, forwardRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { useShallow } from "zustand/react/shallow";
import log from "electron-log/renderer";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { Button } from "../../components/ui/button";
import { TagAutocomplete } from "../../components/inputs/TagAutocomplete";

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
  const [query, setQuery] = useState("");
  // Initialize with empty array to show all posts by default (empty tags = all posts in Rule34 API)
  const [tags, setTags] = useState<string[]>([]);

  const { open: openViewer, appendQueueIds } = useViewerStore(
    useShallow((state) => ({
      open: state.open,
      appendQueueIds: state.appendQueueIds,
    }))
  );

  // Parse tags from query when user submits search
  // If query is empty, use empty array to show all posts (Rule34 API returns all posts when tags parameter is omitted)
  const handleSearch = () => {
    const parsedTags = parseTags(query);
    // Empty array means show all posts (no tags filter)
    setTags(parsedTags);
  };

  // Handle Enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["search", tags],
      queryFn: async ({ pageParam = 1 }) => {
        // Always fetch - empty tags array means show all posts (API omits tags parameter)
        return await window.api.searchBooru({
          tags,
          page: pageParam,
        });
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
      log.info("[Browse] Viewer requested more posts. Fetching...");

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
              `[Browse] Fetched ${newIds.length} new posts (${
                newPage.length - newIds.length
              } duplicates skipped). Appending to Viewer queue.`
            );

            appendQueueIds(newIds);
          } else {
            log.info("[Browse] All fetched posts were already in the queue.");
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
      {/* Header with Search Bar */}
      <div className="flex z-10 flex-col gap-4 px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex gap-2 items-center">
          <h2 className="flex gap-2 items-center text-xl font-bold">
            <Search className="w-5 h-5 text-primary" />
            Browse
          </h2>
        </div>
        <div className="flex gap-2 items-center">
          <TagAutocomplete
            value={query}
            onChange={setQuery}
            onKeyDown={handleKeyDown}
            placeholder="Search for tags (e.g., 'blue_hair', 'cyberpunk')"
          />
          <Button onClick={handleSearch}>
            <Search className="mr-2 w-4 h-4" />
            Search
          </Button>
        </div>
        {allPosts.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="text-sm font-medium text-muted-foreground">
              {allPosts.length} {allPosts.length === 1 ? "post" : "posts"}
              {hasNextPage && " +"}
            </span>
            {tags.length > 0 ? (
              <span className="text-xs text-muted-foreground/70">
                • Tags: {tags.join(", ")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/70">
                • Showing all posts
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className="flex-1 min-h-0">
        {isLoading && allPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col gap-4 justify-center items-center h-full text-muted-foreground">
            <Search className="w-16 h-16 opacity-50" />
            <div className="text-center">
              <p className="mb-2 text-lg font-semibold">No posts found</p>
              <p className="text-sm">
                Try different tags or check your spelling.
              </p>
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
