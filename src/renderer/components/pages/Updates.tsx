import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import {
  RefreshCw,
  Loader2,
  CheckCheck,
  User,
  ChevronRight,
  CheckSquare,
  Filter,
} from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { useNavigate } from "react-router-dom";
import log from "electron-log/renderer";
import { hasAiGeneratedTag, isVideoPost } from "../../lib/filter-utils";
import { useViewerStore } from "../../store/viewerStore";
import { buildBooruTagListForIpc, useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import type { Post } from "@shared/types/db";
import type { TrackedArtist } from "@shared/types/bridge";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import { useReleaseRadixModalLockOnMount } from "../../hooks/useReleaseRadixModalLockOnMount";
import { createVirtuosoGridFactories } from "../gallery/virtuoso-factories";
import { useMasonryInfiniteScroll } from "../../hooks/useMasonryInfiniteScroll";
import { ErrorCode } from "@shared/types/error-codes";
import { getErrorCode } from "../../../shared/utils/type-guards";
import { UpdatesFeedEmptyState } from "../updates/UpdatesFeedEmptyState";
import { resolveUpdatesFeedEmptyKind } from "../../lib/updates-feed-empty";

const POSTS_PER_PAGE = 50;
const UPDATES_UNREAD_COUNT_QUERY_KEY = ["updates", "unreadCount"] as const;
const UPDATES_TOTAL_UNREAD_QUERY_KEY = "totalUnreadCount";
const SYNC_LAST_COMPLETED_QUERY_KEY = ["sync", "lastCompletedAt"] as const;

const updatePostInInfiniteData = (
  oldData: InfiniteData<Post[]> | undefined,
  postId: number,
  updater: (post: Post) => Post
): InfiniteData<Post[]> | undefined => {
  if (!oldData) return oldData;

  let pageIndex = -1;
  for (let i = 0; i < oldData.pages.length; i++) {
    if (oldData.pages[i].some((post) => post.id === postId)) {
      pageIndex = i;
      break;
    }
  }

  if (pageIndex === -1) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page, index) =>
      index === pageIndex
        ? page.map((post) => (post.id === postId ? updater(post) : post))
        : page
    ),
  };
};

const {
  GridContainer,
  GridItemContainer,
  MasonryItemContainer,
  GridVirtuosoList,
  MasonryVirtuosoList,
} = createVirtuosoGridFactories("Updates");

const FEED_VIEW = "feed";
const CREATORS_VIEW = "creators";

type UpdatesView = typeof FEED_VIEW | typeof CREATORS_VIEW;

interface CreatorsViewProps {
  artists: TrackedArtist[];
  isLoading: boolean;
  onSyncAll: () => void;
  onViewArtist: (artist: TrackedArtist) => void;
}

const CreatorsView = ({
  artists,
  isLoading,
  onSyncAll,
  onViewArtist,
}: CreatorsViewProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-6 py-3 border-b">
        <h3 className="text-lg font-semibold">Creators ({artists.length})</h3>
        <Button variant="outline" size="sm" onClick={onSyncAll}>
          <RefreshCw className="mr-2 w-4 h-4" />
          Sync All
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : artists.length === 0 ? (
        <div className="flex flex-1 justify-center items-center text-muted-foreground">
          No tracked artists yet
        </div>
      ) : (
        <div className="overflow-auto flex-1 p-4">
          <div className="space-y-3">
            {artists.map((artist) => (
              <Button
                key={artist.id}
                type="button"
                variant="ghost"
                onClick={() => onViewArtist(artist)}
                className="flex items-center gap-3 p-3 w-full h-auto text-left rounded-lg border transition-colors bg-card hover:bg-accent hover:border-primary"
                aria-label={`View ${artist.name} gallery`}
              >
                <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{artist.name}</p>
                  <p className="text-xs truncate text-muted-foreground">
                    {`${artist.tag} \u00b7 ${artist.postsCount > 999 ? "999+" : artist.postsCount} posts \u00b7 ${
                      artist.lastPostAt === null
                        ? "never"
                        : formatRelativeTime(artist.lastPostAt)
                    }`}
                  </p>
                </div>
                {artist.newPostsCount > 0 && (
                  <Badge
                    variant="default"
                    className="flex-shrink-0 tabular-nums"
                  >
                    {artist.newPostsCount > 999
                      ? "999+"
                      : artist.newPostsCount}
                  </Badge>
                )}
                <ChevronRight className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Updates = () => {
  useReleaseRadixModalLockOnMount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const includeTags = useSearchStore((state) => state.includeTags);
  const excludeTags = useSearchStore((state) => state.excludeTags);
  const clearTagChips = useSearchStore((state) => state.clearTagChips);
  const [activeView, setActiveView] = useState<UpdatesView>(FEED_VIEW);
  const tags = useMemo(
    () => buildBooruTagListForIpc(includeTags, excludeTags),
    [includeTags, excludeTags]
  );
  const hasActiveTagFilter = tags.length > 0;
  const markedSeenIdsRef = useRef(new Set<number>());

  const openViewer = useViewerStore((state) => state.open);
  const appendQueueIds = useViewerStore((state) => state.appendQueueIds);
  const isBulkMode = useBulkSelect((state) => state.isBulkMode);
  const activateBulkMode = useBulkSelect((state) => state.activateBulkMode);
  const deactivateBulkMode = useBulkSelect((state) => state.deactivate);
  const selectedIds = useBulkSelect((state) => state.selectedIds);
  const selectAll = useBulkSelect((state) => state.selectAll);
  const clearSelection = useBulkSelect((state) => state.clearSelection);

  const sortOrder = useSearchStore((state) => state.sortOrder);
  const viewType = useSearchStore((state) => state.viewType);
  const filters = useSearchStore((state) => state.filters);

  const feedFilters = useMemo(
    () => ({
      sinceTracking: true as const,
      tags: hasActiveTagFilter ? tags.join(" ") : undefined,
    }),
    [hasActiveTagFilter, tags]
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["posts", "updates", tags],
      queryFn: async ({ pageParam = 1 }) => {
        return await window.api.getArtistPosts({
          page: pageParam,
          filters: feedFilters,
        });
      },
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        return lastPage.length === POSTS_PER_PAGE
          ? Number(lastPageParam) + 1
          : undefined;
      },
      initialPageParam: 1,
    });

  const { aiFilter, mediaType } = filters;

  useEffect(() => {
    return () => {
      deactivateBulkMode();
    };
  }, [deactivateBulkMode]);

  useEffect(() => {
    if (activeView === CREATORS_VIEW) {
      deactivateBulkMode();
    }
  }, [activeView, deactivateBulkMode]);

  const { data: artists = [], isLoading: isArtistsLoading } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  const { data: lastSyncAtMs = null, isLoading: isLastSyncLoading } = useQuery({
    queryKey: SYNC_LAST_COMPLETED_QUERY_KEY,
    queryFn: () => window.api.getUpdatesLastSyncAt(),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const {
    data: unfilteredFeedCount = 0,
    isLoading: isUnfilteredCountLoading,
  } = useQuery({
    queryKey: ["posts", "updates", "unfilteredCount"],
    queryFn: () =>
      window.api.getPostsCountWithFilters({
        filters: { sinceTracking: true },
      }),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const isFeedMetaLoading =
    isArtistsLoading || isLastSyncLoading || isUnfilteredCountLoading;

  const { data: totalUnreadCount = 0 } = useQuery({
    queryKey: [
      "updates",
      UPDATES_TOTAL_UNREAD_QUERY_KEY,
      tags,
      aiFilter,
      mediaType,
    ],
    queryFn: () =>
      window.api.getUpdatesTotalUnreadCount({
        filters: {
          sinceTracking: true,
          tags: hasActiveTagFilter ? tags.join(" ") : undefined,
          aiFilter: aiFilter === "all" ? undefined : aiFilter,
          mediaType: mediaType === "all" ? undefined : mediaType,
        },
      }),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const handleViewChange = (value: string) => {
    if (value === FEED_VIEW || value === CREATORS_VIEW) {
      setActiveView(value);
    }
  };

  const allPosts = useMemo(() => {
    let posts = data?.pages.flatMap((page) => page) || [];

    if (aiFilter === "hide") {
      posts = posts.filter((post) => !hasAiGeneratedTag(post.tags));
    } else if (aiFilter === "only") {
      posts = posts.filter((post) => hasAiGeneratedTag(post.tags));
    }

    if (mediaType !== "all") {
      posts = posts.filter((post) => {
        const isVideo = isVideoPost(post.fileUrl);
        return mediaType === "videos" ? isVideo : !isVideo;
      });
    }

    return [...posts].sort((a, b) => {
      const dateA =
        a.publishedAt instanceof Date
          ? a.publishedAt.getTime()
          : typeof a.publishedAt === "number"
            ? a.publishedAt
            : 0;
      const dateB =
        b.publishedAt instanceof Date
          ? b.publishedAt.getTime()
          : typeof b.publishedAt === "number"
            ? b.publishedAt
            : 0;

      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [data, sortOrder, aiFilter, mediaType]);

  useEffect(() => {
    if (!data?.pages.length) {
      return;
    }

    const unseenIds: number[] = [];
    for (const page of data.pages) {
      for (const post of page) {
        if (!markedSeenIdsRef.current.has(post.id)) {
          unseenIds.push(post.id);
        }
      }
    }

    if (unseenIds.length === 0) {
      return;
    }

    for (const id of unseenIds) {
      markedSeenIdsRef.current.add(id);
    }

    let cancelled = false;
    void (async () => {
      try {
        await window.api.markUpdatesSeenByIds(unseenIds);
        if (cancelled) {
          return;
        }
        await queryClient.invalidateQueries({
          queryKey: UPDATES_UNREAD_COUNT_QUERY_KEY,
        });
        await queryClient.invalidateQueries({
          queryKey: ["updates", UPDATES_TOTAL_UNREAD_QUERY_KEY],
        });
      } catch (error) {
        for (const id of unseenIds) {
          markedSeenIdsRef.current.delete(id);
        }
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        log.error(
          "[Updates] Failed to mark loaded posts as seen:",
          errorMessage
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, queryClient]);

  const selectedPosts = useMemo(
    () => allPosts.filter((post) => selectedIds.has(getBulkSelectId(post))),
    [allPosts, selectedIds]
  );

  const emptyKind = useMemo(
    () =>
      resolveUpdatesFeedEmptyKind({
        trackedArtistCount: artists.length,
        lastSyncAtMs,
        hasActiveTagFilter,
        unfilteredFeedCount,
      }),
    [artists.length, lastSyncAtMs, hasActiveTagFilter, unfilteredFeedCount]
  );

  const listAriaBusy = isLoading || isFetchingNextPage;
  const ListComponent =
    viewType === "masonry" ? MasonryVirtuosoList : GridVirtuosoList;
  const ItemComponent =
    viewType === "masonry" ? MasonryItemContainer : GridItemContainer;

  const viewMutation = useMutation({
    mutationFn: async (postId: number) => {
      await window.api.markPostAsViewed(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.setQueriesData<InfiniteData<Post[]>>(
        { queryKey: ["posts", "updates"] },
        (oldData) =>
          updatePostInInfiniteData(oldData, postId, (post) => ({
            ...post,
            isViewed: true,
          }))
      );
    },
    onError: (err) => {
      if (getErrorCode(err) === ErrorCode.RATE_LIMIT) {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[Updates] Failed to mark post as viewed:", errorMessage);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      window.api.markAllUpdatesSeen({
        filters: {
          sinceTracking: true,
          tags: hasActiveTagFilter ? tags.join(" ") : undefined,
          aiFilter: aiFilter === "all" ? undefined : aiFilter,
          mediaType: mediaType === "all" ? undefined : mediaType,
        },
      }),
    onSuccess: () => {
      queryClient.setQueriesData<InfiniteData<Post[]>>(
        { queryKey: ["posts", "updates"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((post) => ({ ...post, isViewed: true }))
            ),
          };
        }
      );
      queryClient.setQueryData<TrackedArtist[]>(["artists"], (oldArtists) => {
        if (!oldArtists) return oldArtists;
        return oldArtists.map((artist) => ({
          ...artist,
          newPostsCount: 0,
        }));
      });
      void queryClient.invalidateQueries({ queryKey: ["artists"] });
      void queryClient.invalidateQueries({
        queryKey: UPDATES_UNREAD_COUNT_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: ["updates", UPDATES_TOTAL_UNREAD_QUERY_KEY],
      });
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[Updates] Failed to mark all as viewed:", errorMessage);
    },
  });

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      log.info("[Updates] Viewer requested more posts. Fetching...");

      const result = await fetchNextPage();

      if (result.data) {
        const newPage = result.data.pages[result.data.pages.length - 1];

        if (newPage && newPage.length > 0) {
          const existingPostIds = new Set(allPosts.map((p) => p.id));

          const newIds = newPage
            .map((p) => p.id)
            .filter((id) => !existingPostIds.has(id));

          if (newIds.length > 0) {
            log.info(
              `[Updates] Fetched ${newIds.length} new posts (${newPage.length - newIds.length} duplicates skipped). Appending to Viewer queue.`
            );

            appendQueueIds(newIds);
          } else {
            log.info("[Updates] All fetched posts were already in the queue.");
          }
        }
      }
    }
  };

  const handlePostClick = (index: number) => {
    const currentPosts = allPosts;
    const post = currentPosts[index];

    if (!post) {
      log.warn("[Updates] handlePostClick: post not found at index", index);
      return;
    }

    if (!post.isViewed) {
      viewMutation.mutate(post.id);
    }

    openViewer({
      origin: { kind: "updates", tags: tags.length > 0 ? tags : undefined },
      ids: currentPosts.map((p) => p.id),
      initialIndex: index,
      listKey: "updates-list",
      hasNextPage: hasNextPage,
      onLoadMore: handleLoadMore,
    });
  };

  const triggerLoadMore = useCallback(() => {
    void handleLoadMore().catch((error: unknown) => {
      log.error("[Updates] Failed to load more posts:", error);
    });
  }, [handleLoadMore]);

  const handleMasonryScroll = useMasonryInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore: triggerLoadMore,
  });

  useEffect(() => {
    const unsubscribeSyncEnd = window.api.onSyncEnd(() => {
      void queryClient
        .invalidateQueries({ queryKey: ["posts", "updates"] })
        .catch((error: unknown) => {
          log.error("[Updates] Failed to invalidate updates posts:", error);
        });
      void queryClient
        .invalidateQueries({ queryKey: ["artists"] })
        .catch((error: unknown) => {
          log.error("[Updates] Failed to invalidate artists:", error);
        });
      void queryClient
        .invalidateQueries({ queryKey: SYNC_LAST_COMPLETED_QUERY_KEY })
        .catch((error: unknown) => {
          log.error("[Updates] Failed to invalidate sync last completed:", error);
        });
      void queryClient
        .invalidateQueries({
          queryKey: UPDATES_UNREAD_COUNT_QUERY_KEY,
        })
        .catch((error: unknown) => {
          log.error("[Updates] Failed to invalidate unread count:", error);
        });
    });

    return () => {
      unsubscribeSyncEnd();
    };
  }, [queryClient]);

  const filterBannerLabel = useMemo(() => {
    if (!hasActiveTagFilter) {
      return null;
    }
    return tags.join(" ");
  }, [hasActiveTagFilter, tags]);

  return (
    <div className="flex flex-col -m-6 h-full bg-background text-foreground">
      <div className="flex z-[5] justify-between items-center px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border">
        <div className="flex gap-4 items-center">
          <div>
            <h2 className="flex gap-2 items-center text-xl font-bold">
              <RefreshCw className="w-5 h-5 text-primary" />
              Updates
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest posts from tracked artists
            </p>
            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
              <span className="text-sm font-medium text-muted-foreground">
                {totalUnreadCount === 0
                  ? "No new posts"
                  : `${totalUnreadCount.toLocaleString()} ${totalUnreadCount === 1 ? "new post" : "new posts"}`}
              </span>
            </div>
          </div>
        </div>
        {activeView === FEED_VIEW && (
          <div className="flex gap-2 items-center ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={allPosts.length === 0 || markAllMutation.isPending}
              aria-label="Mark all posts as read"
            >
              <CheckCheck className="mr-2 w-4 h-4" />
              Mark all read
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isBulkMode ? "default" : "outline"}
                    size="icon"
                    aria-label="Toggle bulk selection mode"
                    onClick={() => {
                      if (isBulkMode) {
                        deactivateBulkMode();
                        return;
                      }
                      activateBulkMode();
                    }}
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk selection</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <div className="px-6 pt-4 space-y-3">
          <Tabs value={activeView} onValueChange={handleViewChange}>
            <TabsList>
              <TabsTrigger value={FEED_VIEW}>Feed</TabsTrigger>
              <TabsTrigger value={CREATORS_VIEW}>Creators</TabsTrigger>
            </TabsList>
          </Tabs>
          {activeView === FEED_VIEW && filterBannerLabel !== null ? (
            <Alert>
              <Filter className="h-4 w-4" />
              <AlertDescription className="flex flex-wrap gap-2 justify-between items-center">
                <span>
                  Filtered by:{" "}
                  <span className="font-medium text-foreground">
                    {filterBannerLabel}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearTagChips()}
                  aria-label="Clear tag filter"
                >
                  Clear
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
        {activeView === CREATORS_VIEW ? (
          <CreatorsView
            artists={artists}
            isLoading={isArtistsLoading}
            onSyncAll={() => {
              void window.api.syncAll().catch((error: unknown) => {
                log.error("[Updates] syncAll failed:", error);
              });
            }}
            onViewArtist={(artist) => {
              void Promise.resolve(navigate(`/artist/${artist.id}`)).catch(
                (error: unknown) => {
                  log.error("[Updates] Navigation to artist failed:", error);
                }
              );
            }}
          />
        ) : (isLoading || isFeedMetaLoading) && allPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <UpdatesFeedEmptyState
            kind={emptyKind}
            onClearFilter={() => clearTagChips()}
          />
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
            endReached={triggerLoadMore}
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
      <BulkActionBar
        selectedPosts={selectedPosts}
        onSelectAll={() => {
          const selectableIds = allPosts.map((post) => getBulkSelectId(post));
          const isAllSelected =
            selectableIds.length > 0 &&
            selectableIds.every((id) => selectedIds.has(id));
          if (isAllSelected) {
            clearSelection();
            return;
          }
          selectAll(selectableIds);
        }}
      />
    </div>
  );
};
