import React, { forwardRef, useMemo } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink, Wrench, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { Button } from "../ui/button";
import type { Artist, Post } from "../../../main/db/schema";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { PostCard } from "../gallery/PostCard";

interface ArtistGalleryProps {
  artist: Artist;
  onBack: () => void;
}

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

export const ArtistGallery: React.FC<ArtistGalleryProps> = ({
  artist,
  onBack,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openViewer = useViewerStore((state) => state.open);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["posts", artist.id],
      queryFn: async ({ pageParam = 1 }) => {
        return window.api.getArtistPosts({
          artistId: artist.id,
          page: pageParam,
        });
      },
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === 50 ? allPages.length + 1 : undefined;
      },
      initialPageParam: 1,
    });

  const allPosts = useMemo(
    () => data?.pages.flatMap((page) => page) || [],
    [data]
  );

  const viewMutation = useMutation({
    mutationFn: async (postId: number) => {
      await window.api.updatePost(postId, { isViewed: true });
    },
    onSuccess: (_, postId) => {
      queryClient.setQueryData<InfiniteData<Post[]>>(
        ["posts", artist.id],
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

  const handlePostClick = (index: number) => {
    const post = allPosts[index];
    if (post && !post.isViewed) {
      viewMutation.mutate(post.id);
    }

    openViewer({
      origin: { kind: "artist", artistId: artist.id },
      ids: allPosts.map((p) => p.id),
      initialIndex: index,
      listKey: `artist-${artist.id}`,
    });
  };

  const handleToggleFavorite = async (post: Post) => {
    const newState = !post.isFavorited;
    await window.api.updatePost(post.id, { isFavorited: newState });
    queryClient.invalidateQueries({ queryKey: ["posts", artist.id] });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex z-10 shrink-0 justify-between items-center px-6 py-4 bg-background/95 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{artist.name}</h2>
            <p className="text-sm text-muted-foreground">
              {allPosts.length} posts loaded
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Wrench className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.api.openExternal(
                `https://rule34.xxx/index.php?page=post&s=list&tags=${artist.tag}`
              )
            }
          >
            <ExternalLink className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("artistGallery.web")}</span>
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 min-h-0">
        {isLoading && allPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
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
};
