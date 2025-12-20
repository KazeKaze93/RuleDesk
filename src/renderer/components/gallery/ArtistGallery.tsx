import React, { forwardRef, useMemo, useEffect, useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  useQuery,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink, Wrench, Loader2 } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";

import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";

import type { Artist, Post } from "../../../main/db/schema";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { PostCard } from "../gallery/PostCard";
import { useDebounce } from "../../lib/hooks/useDebounce";
import { useSearchStore } from "../../store/searchStore";

interface ArtistGalleryProps {
  artist: Artist;
  onBack: () => void;
  activeTab?: "tracked" | "source";
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
  activeTab: propActiveTab,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // FIX: Убрали useEffect и дублирование стейта.
  // internalActiveTab используется только если родитель НЕ передал activeTab.
  const [internalActiveTab, setInternalActiveTab] = useState<
    "tracked" | "source"
  >("tracked");

  // Приоритет: проп от родителя > локальный стейт
  const activeTab = propActiveTab || internalActiveTab;

  // Global Search State
  const { searchQuery, setSearchQuery } = useSearchStore();
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    setSearchQuery("");
  }, [artist.id, setSearchQuery]);

  // Zustand Store
  const openViewer = useViewerStore((state) => state.open);
  const updateQueueIds = useViewerStore((state) => state.updateQueueIds);
  const isOpen = useViewerStore((state) => state.isOpen);

  const { data: totalCount = 0 } = useQuery({
    queryKey: ["posts-count", artist.id],
    queryFn: () => window.api.getArtistPostsCount(artist.id),
  });

  // Tracked posts (from DB)
  const {
    data: trackedData,
    fetchNextPage: fetchNextTrackedPage,
    hasNextPage: hasNextTrackedPage,
    isFetchingNextPage: isFetchingNextTrackedPage,
    isLoading: isLoadingTracked,
  } = useInfiniteQuery({
    queryKey: ["posts", artist.id, { tags: debouncedSearch }],
    queryFn: async ({ pageParam = 1 }) => {
      return window.api.getArtistPosts({
        artistId: artist.id,
        page: pageParam,
        filters: { tags: debouncedSearch },
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTab === "tracked",
  });

  const trackedPosts = useMemo(
    () => trackedData?.pages.flatMap((page) => page) || [],
    [trackedData]
  );

  // Source posts (from Rule34 API)
  const {
    data: sourceData,
    fetchNextPage: fetchNextSourcePage,
    hasNextPage: hasNextSourcePage,
    isFetchingNextPage: isFetchingNextSourcePage,
    isLoading: isLoadingSource,
  } = useInfiniteQuery({
    queryKey: ["posts-source", artist.id, { tags: debouncedSearch }],
    queryFn: async ({ pageParam = 1 }) => {
      const tagQuery = `${artist.type === "uploader" ? "user:" : ""}${
        artist.tag
      }`;
      const searchTags = debouncedSearch
        ? `${tagQuery} ${debouncedSearch}`
        : tagQuery;
      return window.api.getRecentPostsRemote(pageParam, searchTags);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 100 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTab === "source",
  });

  const sourcePosts = useMemo(
    () => sourceData?.pages.flatMap((page) => page) || [],
    [sourceData]
  );

  const allPosts = activeTab === "tracked" ? trackedPosts : sourcePosts;
  const isLoading =
    activeTab === "tracked" ? isLoadingTracked : isLoadingSource;
  const hasNextPage =
    activeTab === "tracked" ? hasNextTrackedPage : hasNextSourcePage;
  const isFetchingNextPage =
    activeTab === "tracked"
      ? isFetchingNextTrackedPage
      : isFetchingNextSourcePage;
  const fetchNextPage =
    activeTab === "tracked" ? fetchNextTrackedPage : fetchNextSourcePage;

  React.useEffect(() => {
    if (isOpen && allPosts.length > 0) {
      updateQueueIds(allPosts.map((p) => p.id));
    }
  }, [allPosts, isOpen, updateQueueIds]);

  const handleResetCache = async () => {
    if (!confirm(t("artistGallery.resetConfirm"))) return;
    try {
      await window.api.resetPostCache(artist.id);
      queryClient.invalidateQueries({ queryKey: ["posts", artist.id] });
    } catch (error) {
      console.error("Failed to reset cache:", error);
    }
  };

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

  const handlePostClick = (post: Post, posts: Post[]) => {
    const index = posts.findIndex((p) => p.id === post.id);
    if (index === -1) return;

    openViewer({
      origin: { kind: "artist", artistId: artist.id, sourceType: activeTab },
      ids: posts.map((p) => p.id),
      initialIndex: index,
      listKey: `artist-${artist.id}-${activeTab}`,
      hasNextPage,
      fetchNextPage,
    });

    if (activeTab === "tracked" && !post.isViewed) {
      viewMutation.mutate(post.id);
    }
  };

  const handleToggleFavorite = async (post: Post) => {
    const newState = !post.isFavorited;

    if (activeTab === "tracked") {
      await window.api.updatePost(post.id, { isFavorited: newState });
      queryClient.invalidateQueries({ queryKey: ["posts", artist.id] });
    } else {
      // Optimistic UI for remote could be added here
    }
  };

  const renderGrid = (posts: Post[]) => {
    if (isLoading && posts.length === 0) {
      return (
        <div className="flex justify-center items-center h-full text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="flex justify-center items-center h-full text-muted-foreground">
          <p>No posts found</p>
        </div>
      );
    }

    return (
      <VirtuosoGrid
        style={{ height: "100%" }}
        totalCount={posts.length}
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
          const post = posts[index];
          if (!post) return null;

          return (
            <PostCard
              post={post}
              onClick={() => handlePostClick(post, allPosts)}
              onToggleFavorite={() => handleToggleFavorite(post)}
            />
          );
        }}
      />
    );
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
              {activeTab === "tracked" ? `${totalCount} posts` : "Source"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === "tracked" && (
            <Button variant="outline" size="sm" onClick={handleResetCache}>
              <Wrench className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          // FIX: Меняем локальный стейт только если родитель не управляет табом
          if (!propActiveTab) {
            setInternalActiveTab(v as "tracked" | "source");
          }
        }}
        className="flex flex-col flex-1 min-h-0"
      >
        {/* FIX: Скрываем переключатель, если включен режим Source-only */}
        {!propActiveTab && (
          <div className="px-6 pt-4">
            <TabsList>
              <TabsTrigger value="tracked">Tracked</TabsTrigger>
              <TabsTrigger value="source">Source</TabsTrigger>
            </TabsList>
          </div>
        )}

        {/* Grid Content */}
        <TabsContent value="tracked" className="flex-1 mt-0 min-h-0">
          {renderGrid(trackedPosts)}
        </TabsContent>
        <TabsContent value="source" className="flex-1 mt-0 min-h-0">
          {renderGrid(sourcePosts)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
