import React, { forwardRef, useMemo } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { RefreshCw, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { useShallow } from "zustand/react/shallow";
import log from "electron-log/renderer";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { PostCard } from "../../features/artists/components/PostCard";
import type { Post } from "../../../main/db/schema";

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

// --- Основной компонент ---

export const Updates = () => {
  const queryClient = useQueryClient();

  const { open: openViewer, appendQueueIds } = useViewerStore(
    useShallow((state) => ({
      open: state.open,
      appendQueueIds: state.appendQueueIds,
    }))
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["posts", "updates"],
      queryFn: async ({ pageParam = 1 }) => {
        return await window.api.getArtistPosts({
          page: pageParam,
          filters: { sinceTracking: true },
        });
      },
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === POSTS_PER_PAGE
          ? allPages.length + 1
          : undefined;
      },
      initialPageParam: 1,
    });

  const allPosts = useMemo(() => {
    return data?.pages.flatMap((page) => page) || [];
  }, [data]);

  const viewMutation = useMutation({
    mutationFn: async (postId: number) => {
      await window.api.markPostAsViewed(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.setQueryData<InfiniteData<Post[]>>(
        ["posts", "updates"],
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
      log.info("[Updates] Viewer requested more posts. Fetching...");

      const result = await fetchNextPage();

      if (result.data) {
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && newPage.length > 0) {
          const newIds = newPage.map((p) => p.id);
          log.info(
            `[Updates] Fetched ${newIds.length} new posts. Appending to Viewer queue.`
          );

          appendQueueIds(newIds);
        }
      }
    }
  };

  const handlePostClick = (index: number) => {
    const postIds = allPosts.map((p) => p.id);
    const post = allPosts[index];

    if (!post) {
      log.warn("[Updates] handlePostClick: post not found at index", index);
      return;
    }

    // Mark as viewed first (same as Favorites)
    if (post && !post.isViewed) {
      viewMutation.mutate(post.id);
    }

    // Open viewer
    openViewer({
      origin: { kind: "updates" },
      ids: postIds,
      initialIndex: index,
      listKey: "updates",
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
    });
  };

  return (
    <div className="flex flex-col -m-6 h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex z-10 justify-between items-center px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex gap-4 items-center">
          <div>
            <h2 className="flex gap-2 items-center text-xl font-bold">
              <RefreshCw className="w-5 h-5 text-primary" />
              Updates
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest posts from tracked artists
            </p>
            {allPosts.length > 0 && (
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
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
          <div className="flex flex-col gap-4 justify-center items-center h-full text-muted-foreground">
            <RefreshCw className="w-16 h-16 opacity-50" />
            <div className="text-center">
              <p className="mb-2 text-lg font-semibold">No posts found</p>
              <p className="text-sm">Track some artists to see updates here.</p>
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
              List: GridContainer,
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
