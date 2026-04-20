import React, { forwardRef, useMemo } from "react";
import {
  useQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink, Wrench, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { useShallow } from "zustand/react/shallow";
import log from "electron-log/renderer";
import { Button } from "../../components/ui/button";
import type { Artist, Post } from "../../../main/db/schema";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { PostCard } from "./components/PostCard";
import { useGalleryInfiniteScroll } from "../../hooks/useGalleryInfiniteScroll";
import { useDownloadAllFromBackend } from "../../hooks/useDownloadAll";
import { DownloadAllButton } from "../../components/downloads/DownloadAllButton";

interface ArtistGalleryProps {
  artist: Artist;
  onBack: () => void;
}

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

const createItemContainer = (viewType: "grid" | "masonry") =>
  forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          viewType === "grid"
            ? "w-full aspect-[2/3]"
            : "w-full mb-4 break-inside-avoid",
          className
        )}
        {...props}
      />
    )
  );

const createVirtuosoList = (viewType: "grid" | "masonry") =>
  forwardRef<
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

export const ArtistGallery: React.FC<ArtistGalleryProps> = ({
  artist,
  onBack,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // ArtistGallery should show ALL posts for the artist, not filtered by global search query
  // The global search query is only for Browse tab, not for Tracked Artists

  const { open: openViewer, appendQueueIds } = useViewerStore(
    useShallow((state) => ({
      open: state.open,
      appendQueueIds: state.appendQueueIds,
    }))
  );

  // Use atomic selectors to prevent unnecessary re-renders
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const aiFilter = useSearchStore((state) => state.filters.aiFilter);
  const mediaType = useSearchStore((state) => state.filters.mediaType);
  const source = useSearchStore((state) => state.filters.source);
  const viewType = useSearchStore((state) => state.viewType);

  const { data: totalPosts = 0 } = useQuery({
    queryKey: ["posts-count", artist.id, aiFilter, mediaType, source],
    queryFn: async () => {
      const count = await window.api.getArtistPostsCount({
        artistId: artist.id,
        filters: {
          aiFilter: aiFilter === "all" ? undefined : aiFilter,
          mediaType: mediaType === "all" ? undefined : mediaType,
          isFavorited: source === "favorites" ? true : undefined,
        },
      });
      return count;
    },
  });

  // Use the new infinite scroll hook
  // AI and Media Type filters are now applied at SQL level for better performance
  const {
    allPosts: rawPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    handleEndReached,
  } = useGalleryInfiniteScroll({
    queryKey: ["posts", artist.id, aiFilter, mediaType, source, sortOrder],
    fetchFn: async (pageParam) => {
      return await window.api.getArtistPosts({
        artistId: artist.id,
        page: pageParam,
        sortOrder,
        filters: {
          // No tag filtering - show all posts for this artist
          // No tag filter - tag search is not supported in ArtistGallery context
          tags: undefined,
          // AI and Media Type filters applied only if not in 'all' mode
          aiFilter: aiFilter === "all" ? undefined : aiFilter,
          mediaType: mediaType === "all" ? undefined : mediaType,
          isFavorited: source === "favorites" ? true : undefined,
        },
      });
    },
  });

  const allPosts = useMemo(() => rawPosts, [rawPosts]);

  // Create stable List component with forwardRef and aria-busy
  // Must be memoized to prevent Virtuoso from remounting on every render
  const { ListComponent, ItemComponent } = useMemo(() => {
    const VirtuosoList = createVirtuosoList(viewType);
    const List = forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement>
    >((props, ref) => (
      <VirtuosoList
        {...props}
        ref={ref}
        aria-busy={isLoading || isFetchingNextPage}
      />
    ));
    List.displayName = "ArtistGalleryList";

    const Item = createItemContainer(viewType);
    Item.displayName = "ArtistGalleryItem";

    return { ListComponent: List, ItemComponent: Item };
  }, [isLoading, isFetchingNextPage, viewType]);

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
    onError: (err) => {
      // Ignore rate limit errors - use typed errorCode, NOT string parsing
      const errorCode = (err as { code?: string })?.code;
      if (errorCode === "RATE_LIMIT") {
        return; // Silently ignore rate limit errors
      }
      // Log other errors for debugging
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[ArtistGallery] Failed to mark post as viewed:", errorMessage);
    },
  });

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      log.info("[Gallery] Viewer requested more posts. Fetching...");

      // Ждем завершения загрузки и получаем результат
      const result = await fetchNextPage();

      // Если загрузка прошла успешно и есть данные
      if (result.data) {
        // Берем последнюю страницу (новую)
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && newPage.length > 0) {
          const newIds = newPage.map((p) => p.id);
          log.info(
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
      origin: {
        kind: "artist",
        artistId: artist.id,
        tags: undefined, // No tag filtering in artist gallery
        aiFilter: aiFilter === "all" ? undefined : aiFilter,
        mediaType: mediaType === "all" ? undefined : mediaType,
      },
      ids: postIds,
      initialIndex: index,
      listKey: `artist-${artist.id}`,
      totalGlobalCount: totalPosts > 0 ? totalPosts : undefined,
      hasNextPage: hasNextPage && allPosts.length < (totalPosts || Infinity),
      onLoadMore: handleLoadMore, // Передаем обновленный хендлер
    });
  };

  const fetchParams = useMemo(
    () => ({
      artistId: artist.id,
      page: 1,
      limit: 50,
      isRandom: false,
      filters: {
        aiFilter: aiFilter === "all" ? undefined : aiFilter,
        mediaType: mediaType === "all" ? undefined : mediaType,
        isFavorited: source === "favorites" ? true : undefined,
      },
    }),
    [artist.id, aiFilter, mediaType, source]
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
  } = useDownloadAllFromBackend(fetchParams, totalPosts);

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
      log.error("[ArtistGallery] Repair sync failed:", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex z-[5] justify-between items-center px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
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
          <DownloadAllButton
            onClick={downloadAll}
            onCancel={cancel}
            onPause={pause}
            onResume={resume}
            isDownloading={isDownloadingAll}
            isPaused={isPaused}
            progress={downloadAllProgress}
            canDownload={canDownload}
            totalLabel={totalPosts}
          />
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
            endReached={handleEndReached}
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
                <PostCard post={post} onClick={() => handlePostClick(index)} />
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
