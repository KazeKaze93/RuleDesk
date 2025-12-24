import React, { forwardRef, useMemo } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink, Wrench, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { Button } from "../../components/ui/button";
import type { Artist, Post } from "../../../main/db/schema";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { PostCard } from "./components/PostCard";

interface ArtistGalleryProps {
  artist: Artist;
  onBack: () => void;
}

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

export const ArtistGallery: React.FC<ArtistGalleryProps> = ({
  artist,
  onBack,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const openViewer = useViewerStore((state) => state.open);
  const appendQueueIds = useViewerStore((state) => state.appendQueueIds);

  const { data: totalPosts = 0 } = useQuery({
    queryKey: ["posts-count", artist.id],
    queryFn: async () => {
      const count = await window.api.getArtistPostsCount(artist.id);
      return count;
    },
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["posts", artist.id],
      queryFn: async ({ pageParam = 1 }) => {
        return await window.api.getArtistPosts({
          artistId: artist.id,
          page: pageParam,
        });
      },
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === 50 ? allPages.length + 1 : undefined;
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

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log("[Gallery] Viewer requested more posts. Fetching...");

      // Ждем завершения загрузки и получаем результат
      const result = await fetchNextPage();

      // Если загрузка прошла успешно и есть данные
      if (result.data) {
        // Берем последнюю страницу (новую)
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && newPage.length > 0) {
          const newIds = newPage.map((p) => p.id);
          console.log(
            `[Gallery] Fetched ${newIds.length} new posts. Appending to Viewer queue.`
          );

          // ЯВНО обновляем очередь вьювера
          appendQueueIds(newIds);
        }
      }
    }
  };

  const handlePostClick = (index: number) => {
    const postIds = allPosts.map((p) => p.id);

    const post = allPosts[index];
    if (post && !post.isViewed) {
      viewMutation.mutate(post.id);
    }

    openViewer({
      origin: { kind: "artist", artistId: artist.id },
      ids: postIds,
      initialIndex: index,
      listKey: `artist-${artist.id}`,
      totalGlobalCount: totalPosts > 0 ? totalPosts : undefined,
      hasNextPage: hasNextPage && allPosts.length < (totalPosts || Infinity),
      onLoadMore: handleLoadMore, // Передаем обновленный хендлер
    });
  };

  const handleRepairSync = async () => {
    if (isLoading) return;
    if (
      !confirm(t("artistGallery.repairConfirm", { artistName: artist.name }))
    ) {
      return;
    }
    queryClient.removeQueries({ queryKey: ["posts", artist.id] });
    try {
      await window.api.repairArtist(artist.id);
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["posts", artist.id] });
      queryClient.invalidateQueries({ queryKey: ["posts-count", artist.id] });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex z-10 justify-between items-center px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label={t("artistGallery.backToArtists")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{artist.name}</h2>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {totalPosts > 0 && (
                <span className="text-sm font-medium text-muted-foreground">
                  Total: {totalPosts}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRepairSync}
            title={t("artistGallery.repairTitle")}
          >
            <Wrench className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {t("artistGallery.repair")}
            </span>
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
                <PostCard post={post} onClick={() => handlePostClick(index)} />
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
