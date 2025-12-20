import React, { forwardRef, useMemo } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { VirtuosoGrid } from "react-virtuoso";
import { Loader2, FilterX } from "lucide-react";

import { PostCard } from "../gallery/PostCard";
import { cn } from "../../lib/utils";
import type { Post } from "../../../main/db/schema";
import { useViewerStore } from "../../store/viewerStore";
import { useDebounce } from "../../lib/hooks/useDebounce";
import { useSearchStore } from "../../store/searchStore";

// --- Grid Components (Virtuoso) ---

const GridContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid grid-cols-2 gap-4 p-4 pb-32 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
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

// --- Main Component ---

export function Browse() {
  const queryClient = useQueryClient();
  const openViewer = useViewerStore((state) => state.open);

  const { searchQuery } = useSearchStore();
  const debouncedSearch = useDebounce(searchQuery, 500);

  const queryTags = debouncedSearch?.trim() || "all";

  const queryKey = ["browse-posts-remote", { tags: queryTags }];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: queryKey,
      queryFn: async ({ pageParam = 1 }) => {
        return window.api.getRecentPostsRemote(pageParam, queryTags);
      },
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === 100 ? allPages.length + 1 : undefined;
      },
      initialPageParam: 1,
    });

  const allPosts = useMemo(
    () => data?.pages.flatMap((page) => page) || [],
    [data]
  );

  const viewMutation = useMutation({
    mutationFn: async (postId: number) => {
      // FIX: Используем updatePost, т.к. отдельного markViewed нет
      await window.api.updatePost(postId, { isViewed: true });
    },
    onSuccess: (_, postId) => {
      queryClient.setQueryData<InfiniteData<Post[]>>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.map((post) =>
              post.id === postId ? { ...post, isViewed: true } : post
            )
          ),
        };
      });
    },
  });

  const handlePostClick = (index: number) => {
    const post = allPosts[index];
    if (post && !post.isViewed) {
      viewMutation.mutate(post.id);
    }

    openViewer({
      // Передаем точные фильтры, чтобы Viewer мог найти пост в кэше
      origin: { kind: "browse", filters: queryTags },
      ids: allPosts.map((p) => p.id),
      initialIndex: index,
      listKey: `browse-${queryTags}`, // Уникальный ключ списка для Viewer
    });
  };

  const handleToggleFavorite = async (post: Post) => {
    const newState = !post.isFavorited;

    queryClient.setQueryData<InfiniteData<Post[]>>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) =>
          page.map((p) =>
            p.id === post.id ? { ...p, isFavorited: newState } : p
          )
        ),
      };
    });

    await window.api.updatePost(post.id, { isFavorited: newState });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col gap-2 justify-center items-center h-full text-muted-foreground">
            <FilterX className="w-12 h-12 opacity-50" />
            <p>No posts found</p>
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
                <PostCard
                  post={post}
                  onClick={() => handlePostClick(index)}
                  onToggleFavorite={() => handleToggleFavorite(post)}
                />
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
