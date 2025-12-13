import React, { forwardRef, useState } from "react";
import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ExternalLink,
  Wrench,
  Loader2,
  Play,
  Check,
} from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { Button } from "./ui/button";
import type { Artist, Post } from "../../main/db/schema";
import { cn } from "../lib/utils";
import { ImageLightbox } from "./ImageLightbox";

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
      "grid grid-cols-2 gap-4 p-4 pb-20 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
      className
    )}
    {...props}
  />
));
GridContainer.displayName = "GridContainer";

// Контейнер элемента (ячейка сетки)
const ItemContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full aspect-[2/3]", className)} // Фиксируем пропорции ячейки, чтобы не прыгало
    {...props}
  />
));
ItemContainer.displayName = "ItemContainer";

const isVideo = (url: string) => url.endsWith(".mp4") || url.endsWith(".webm");

// --- Основной компонент ---

export const ArtistGallery: React.FC<ArtistGalleryProps> = ({
  artist,
  onBack,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // 1. Используем useInfiniteQuery для подгрузки страниц
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

  const allPosts: Post[] = data ? data.pages.flatMap((page) => page) : [];

  // --- MUTATION: Mark as Viewed ---
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

  const handlePostClick = (index: number, post: Post) => {
    setSelectedIndex(index);
    // Если пост еще не просмотрен, помечаем его
    if (!post.isViewed) {
      viewMutation.mutate(post.id);
    }
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
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* 2. Фиксированный Хедер */}
      <div className="flex z-10 justify-between items-center px-6 py-4 border-b backdrop-blur shrink-0 bg-slate-950/90 border-slate-800">
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
            <h2 className="text-xl font-bold text-white">{artist.name}</h2>
            <div className="flex gap-2 text-xs text-slate-400">
              <span className="px-1 font-mono rounded bg-slate-900 text-slate-500">
                {artist.tag}
              </span>
              <span>•</span>
              <span>{allPosts.length} posts loaded</span>
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

      {/* 3. Виртуализированная сетка */}
      <div className="flex-1 min-h-0">
        {isLoading && allPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-slate-500">
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
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                ) : null,
            }}
            itemContent={(index) => {
              const post = allPosts[index];
              const isVid = isVideo(post.fileUrl);
              return (
                <div
                  onClick={() => handlePostClick(index, post)}
                  className={cn(
                    "overflow-hidden relative w-full h-full rounded-lg border transition-colors group bg-slate-900 border-slate-800 cursor-zoom-in",
                    "hover:border-blue-500"
                  )}
                >
                  {post.previewUrl ? (
                    <img
                      src={post.previewUrl}
                      alt={`Post ${post.id}`}
                      className={cn(
                        "object-cover w-full h-full transition-transform duration-300 group-hover:scale-105",
                        post.isViewed && "opacity-60 grayscale-[0.3]"
                      )}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex justify-center items-center w-full h-full text-slate-600 bg-slate-900">
                      No Preview
                    </div>
                  )}

                  {/* VIDEO ICON OVERLAY */}
                  {isVid && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full backdrop-blur-[2px]">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}

                  {/* VIEWED INDICATOR (CHECKMARK) */}
                  {post.isViewed && (
                    <div className="absolute top-2 left-2 z-10 p-1 rounded-full shadow-md bg-blue-600/90">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                  {/* Rating Overlay */}
                  <div className="flex absolute inset-0 flex-col justify-end p-2 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity from-black/80 group-hover:opacity-100">
                    <span
                      className={cn(
                        "text-xs font-bold uppercase",
                        post.rating === "e" ? "text-red-400" : "text-green-400"
                      )}
                    >
                      {post.rating || "?"}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* --- LIGHTBOX INTEGRATION --- */}
      {selectedIndex >= 0 && allPosts[selectedIndex] && (
        <ImageLightbox
          post={allPosts[selectedIndex]}
          isOpen={selectedIndex >= 0}
          onClose={() => setSelectedIndex(-1)}
          hasNext={selectedIndex < allPosts.length - 1}
          hasPrev={selectedIndex > 0}
          onNext={() => {
            if (selectedIndex < allPosts.length - 1) {
              setSelectedIndex(selectedIndex + 1);
              if (
                selectedIndex > allPosts.length - 5 &&
                hasNextPage &&
                !isFetchingNextPage
              ) {
                fetchNextPage();
              }
            }
          }}
          onPrev={() => {
            if (selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
          }}
        />
      )}
    </div>
  );
};
