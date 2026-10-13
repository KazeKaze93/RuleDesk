import React, { useMemo, useState } from "react";
import {
  useQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Wrench, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { useShallow } from "zustand/react/shallow";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { ConfirmActionDialog } from "../../components/dialogs/ConfirmActionDialog";
import { PageHeader } from "../../components/layout/PageHeader";
import type { Artist, Post } from "@shared/types/db";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { PostCard } from "./components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import { useGalleryInfiniteScroll } from "../../hooks/useGalleryInfiniteScroll";
import { useMasonryInfiniteScroll } from "../../hooks/useMasonryInfiniteScroll";
import { useDownloadAllFromBackend } from "../../hooks/useDownloadAll";
import { DownloadAllButton } from "../../components/downloads/DownloadAllButton";
import { ErrorCode } from "@shared/types/error-codes";
import { getErrorCode } from "../../../shared/utils/type-guards";
import { createVirtuosoGridFactories } from "../../components/gallery/virtuoso-factories";
import { resolveErrorMessage } from "../../utils/error-message";
import { openExternalSafe } from "../../lib/open-external";
import { buildSiteTagSearchUrl } from "@shared/utils/site-urls";

interface ArtistGalleryProps {
  artist: Artist;
  onBack: () => void;
}

const {
  GridContainer,
  GridItemContainer,
  MasonryItemContainer,
  GridVirtuosoList,
  MasonryVirtuosoList,
} = createVirtuosoGridFactories("ArtistGallery");

export const ArtistGallery: React.FC<ArtistGalleryProps> = ({
  artist,
  onBack,
}) => {
  const queryClient = useQueryClient();
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  // ArtistGallery shows all posts for the artist, not filtered by the global Browse search query.

  const { open: openViewer, appendQueueIds } = useViewerStore(
    useShallow((state) => ({
      open: state.open,
      appendQueueIds: state.appendQueueIds,
    }))
  );

  const sortOrder = useSearchStore((state) => state.sortOrder);
  const aiFilter = useSearchStore((state) => state.filters.aiFilter);
  const mediaType = useSearchStore((state) => state.filters.mediaType);
  const source = useSearchStore((state) => state.filters.source);
  const viewType = useSearchStore((state) => state.viewType);

  const {
    data: totalPosts = 0,
    isError: isPostsCountError,
    error: postsCountError,
  } = useQuery({
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
    retry: false,
  });

  // AI and media-type filters are applied at SQL level for performance.
  const {
    allPosts: rawPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    handleEndReached,
  } = useGalleryInfiniteScroll({
    queryKey: ["posts", artist.id, aiFilter, mediaType, source, sortOrder],
    initialPageParam: 1,
    fetchFn: async (pageParam) => {
      return await window.api.getArtistPosts({
        artistId: artist.id,
        page: pageParam,
        sortOrder,
        filters: {
          // Tag search is not supported in ArtistGallery.
          tags: undefined,
          aiFilter: aiFilter === "all" ? undefined : aiFilter,
          mediaType: mediaType === "all" ? undefined : mediaType,
          isFavorited: source === "favorites" ? true : undefined,
        },
      });
    },
  });

  const allPosts = rawPosts;

  const listAriaBusy = isLoading || isFetchingNextPage;
  const ListComponent = viewType === "masonry" ? MasonryVirtuosoList : GridVirtuosoList;
  const ItemComponent = viewType === "masonry" ? MasonryItemContainer : GridItemContainer;

  const viewMutation = useMutation({
    mutationFn: async (postId: number) => {
      await window.api.markPostAsViewed(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.setQueriesData<InfiniteData<Post[]>>(
        { queryKey: ["posts", artist.id] },
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
      void queryClient
        .invalidateQueries({ queryKey: ["artists"] })
        .catch((error: unknown) => {
          log.error("[ArtistGallery] Failed to invalidate artists:", error);
        });
    },
    onError: (err) => {
      // Ignore rate limit errors — use typed errorCode, not string parsing.
      const errorCode = getErrorCode(err);
      if (errorCode === ErrorCode.RATE_LIMIT) {
        return;
      }
      log.error("[ArtistGallery] Failed to mark post as viewed:", err);
      toast.error(resolveErrorMessage(err, "Failed to mark post as viewed"));
    },
  });

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      log.info("[Gallery] Viewer requested more posts. Fetching...");

      const result = await fetchNextPage();

      if (result.data) {
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && newPage.length > 0) {
          const newIds = newPage.map((p) => p.id);
          log.info(
            `[Gallery] Fetched ${newIds.length} new posts. Appending to Viewer queue.`
          );

          appendQueueIds(newIds);
        }
      }
    }
  };

  const handleMasonryScroll = useMasonryInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore: () => {
      void handleLoadMore().catch((error: unknown) => {
        log.error("[ArtistGallery] Failed to load more posts:", error);
      });
    },
  });

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
        tags: undefined,
        aiFilter: aiFilter === "all" ? undefined : aiFilter,
        mediaType: mediaType === "all" ? undefined : mediaType,
        source,
        sortOrder,
      },
      ids: postIds,
      initialIndex: index,
      listKey: `artist-${artist.id}`,
      totalGlobalCount: totalPosts > 0 ? totalPosts : undefined,
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
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
    lastFailures,
    canDownload,
  } = useDownloadAllFromBackend(fetchParams, totalPosts);

  const handleRepairSync = async () => {
    if (isLoading) {
      throw new Error("Gallery is still loading");
    }
    queryClient.removeQueries({ queryKey: ["posts", artist.id] });
    await window.api.repairArtist(artist.id);
    await queryClient.invalidateQueries({ queryKey: ["artists"] });
    await queryClient.invalidateQueries({ queryKey: ["posts", artist.id] });
    await queryClient.invalidateQueries({ queryKey: ["posts-count", artist.id] });
  };

  const headerDescription =
    !isPostsCountError && totalPosts > 0 ? `Total: ${totalPosts}` : undefined;

  const headerActions = (
    <>
      <DownloadAllButton
        onClick={() => {
          void downloadAll();
        }}
        onCancel={cancel}
        onPause={pause}
        onResume={resume}
        isDownloading={isDownloadingAll}
        isPaused={isPaused}
        progress={downloadAllProgress}
        canDownload={canDownload}
        totalLabel={totalPosts}
        failures={lastFailures}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setRepairDialogOpen(true)}
        title="Resynchronize first pages to update low-quality previews"
      >
        <Wrench className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Repair</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void openExternalSafe(
            buildSiteTagSearchUrl(artist.provider, [artist.tag])
          );
        }}
      >
        <ExternalLink className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Web</span>
      </Button>
    </>
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="z-[5] shrink-0 border-b border-border bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label="Back to artists list"
            className="mt-0.5 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <PageHeader
              title={artist.name}
              description={headerDescription}
              actions={headerActions}
            />
            {isPostsCountError ? (
              <p className="mt-1 text-sm font-medium text-destructive">
                {resolveErrorMessage(
                  postsCountError,
                  "Failed to load post count"
                )}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmActionDialog
        open={repairDialogOpen}
        onOpenChange={setRepairDialogOpen}
        title="Repair sync"
        description={`Are you sure you want to run a repair sync for ${artist.name}? This may take time and update old entries.`}
        confirmLabel="Repair"
        cancelLabel="Cancel"
        onConfirm={handleRepairSync}
      />

      <div className="flex-1 min-h-0">
        {isLoading && allPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : viewType === "masonry" ? (
          <div className="overflow-auto h-full" onScroll={handleMasonryScroll}>
            <GridContainer viewType="masonry">
              {allPosts.map((post, index) => (
                <MasonryItemContainer key={getPostCardKey(post)}>
                  <PostCard
                    post={post}
                    onClick={() => handlePostClick(index)}
                    preserveAspect={false}
                  />
                </MasonryItemContainer>
              ))}
            </GridContainer>
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <VirtuosoGrid
            className="h-full"
            aria-busy={listAriaBusy}
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
                <PostCard
                  key={getPostCardKey(post)}
                  post={post}
                  onClick={() => handlePostClick(index)}
                />
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
