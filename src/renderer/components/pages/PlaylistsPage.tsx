import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import {
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { ArrowLeft, Loader2, List, Sparkles, Plus, Trash2, X, Check, Minus, Pencil, Download, Upload, CheckSquare, Eraser } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import log from "electron-log/renderer";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "../../components/ui/button";
import type { Playlist, Post } from "../../../main/db/schema";
import type { PlaylistWithStats } from "../../../main/bridge";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { useShallow } from "zustand/react/shallow";
import { PostCard } from "../../features/artists/components/PostCard";
import { getPostCardKey } from "../../lib/postCardKey";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { AsyncAutocomplete } from "../../components/inputs/AsyncAutocomplete";
import type { SmartPlaylistQuery, SmartPlaylistTag } from "../../../shared/schemas/playlist";
import { parsePlaylistQuery } from "../../../shared/schemas/playlist";
import { usePlaylists } from "../../lib/hooks/usePlaylists";
import type { SearchResults } from "../../../main/providers";
import { hasAiGeneratedTag } from "../../lib/filter-utils";
import { toast } from "sonner";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import { BulkActionBar } from "../BulkActionBar/BulkActionBar";
import { getBulkSelectId } from "../../lib/bulkSelect";
import { PlaylistCard } from "../playlists/PlaylistCard";

interface PlaylistsPageProps {
  onBack?: () => void;
}

const INVALID_PLAYLIST_TOAST = "Invalid playlist file";
const EMPTY_IMPORTED_PLAYLIST_TOAST = "Playlist imported but contains no posts";

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Unknown error";
};

const isInvalidPlaylistError = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid playlist file format") ||
    normalized.includes("invalid playlist") ||
    normalized.includes("unexpected token") ||
    normalized.includes("json")
  );
};

const matchesOrientation = (
  post: object,
  orientation: "all" | "horizontal" | "vertical"
): boolean => {
  if (orientation === "all") return true;
  const width = Reflect.get(post, "width");
  const height = Reflect.get(post, "height");
  if (typeof width !== "number" || typeof height !== "number") return true;
  if (orientation === "horizontal") return width > height;
  return height > width;
};

const getPublishedDate = (publishedAt: Date | number | null): Date | null => {
  if (publishedAt instanceof Date) {
    return Number.isNaN(publishedAt.getTime()) ? null : publishedAt;
  }
  if (typeof publishedAt === "number") {
    const parsed = new Date(publishedAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const shouldIncludePostInPlaylistQueue = (
  post: Post,
  filters: {
    aiFilter: "all" | "hide" | "only";
    orientation: "all" | "horizontal" | "vertical";
    dateFrom: Date | null;
    dateTo: Date | null;
  }
): boolean => {
  if (filters.aiFilter === "hide" && hasAiGeneratedTag(post.tags)) return false;
  if (filters.aiFilter === "only" && !hasAiGeneratedTag(post.tags)) return false;
  if (!matchesOrientation(post, filters.orientation)) return false;
  if (filters.dateFrom || filters.dateTo) {
    const date = getPublishedDate(post.publishedAt);
    if (date) {
      if (filters.dateFrom && date < filters.dateFrom) return false;
      if (filters.dateTo && date > filters.dateTo) return false;
    }
  }
  return true;
};

// Virtualization components (reused from ArtistGallery pattern)
const GridContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { viewType?: "grid" | "masonry" }
>(({ className, viewType = "grid", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      viewType === "grid"
        ? "grid gap-4 p-4 pb-44 [grid-template-columns:repeat(var(--grid-cols,auto-fill),minmax(188px,1fr))]"
        : "columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 p-4 pb-44",
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

// Playlist Gallery Component (similar to ArtistGallery)
interface PlaylistGalleryProps {
  playlist: Playlist;
  onBack: () => void;
}

interface SortablePostCardProps {
  post: Post;
  onClick: () => void;
  onRemove?: () => void;
  preserveAspect?: boolean;
}

function SortablePostCard({ post, onClick, onRemove, preserveAspect }: SortablePostCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PostCard
        post={post}
        onClick={onClick}
        preserveAspect={preserveAspect}
        context="playlist"
        onRemoveFromPlaylist={onRemove}
      />
    </div>
  );
}

const PlaylistGallery: React.FC<PlaylistGalleryProps> = ({ playlist, onBack }) => {
  // Use atomic selector instead of useShallow for single value
  const openViewer = useViewerStore((state) => state.open);
  const appendQueueIds = useViewerStore((state) => state.appendQueueIds);
  const isBulkMode = useBulkSelect((state) => state.isBulkMode);
  const activateBulkMode = useBulkSelect((state) => state.activateBulkMode);
  const deactivateBulkMode = useBulkSelect((state) => state.deactivate);
  const selectedIds = useBulkSelect((state) => state.selectedIds);
  const selectAll = useBulkSelect((state) => state.selectAll);
  const clearSelection = useBulkSelect((state) => state.clearSelection);

  // Use useShallow for combined selector to prevent multiple re-renders
  // This ensures all three values are selected atomically, preventing cascading re-renders
  const { viewType, filters, sortOrder } = useSearchStore(
    useShallow((state) => ({
      viewType: state.viewType,
      filters: state.filters,
      sortOrder: state.sortOrder,
    }))
  );
  const queryClient = useQueryClient();

  const ratingLetter = filters.rating;

  // Build filters for API call from search store state
  const apiFilters = useMemo(() => {
    const result: { rating?: "s" | "q" | "e"; mediaType?: "all" | "images" | "videos" } = {};

    if (ratingLetter === "s" || ratingLetter === "q" || ratingLetter === "e") {
      result.rating = ratingLetter;
    }
    
    // Map mediaType filter from current search store state
    if (filters.mediaType && filters.mediaType !== "all") {
      result.mediaType = filters.mediaType;
    }
    
    return result;
  }, [filters.mediaType, ratingLetter]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<Post[]>({
    queryKey: [
      "playlist-posts",
      playlist.id,
      filters.mediaType,
      ratingLetter,
      filters.aiFilter,
      sortOrder,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      return await window.api.resolvePlaylistPosts({
        playlistId: playlist.id,
        page: pageParam as number,
        limit: 50,
        filters: Object.keys(apiFilters).length > 0 ? apiFilters : undefined,
        sortOrder,
        isRandom: false,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const allPosts = useMemo(() => {
    let posts = data?.pages.flat() ?? [];

    if (filters.aiFilter === "hide") {
      posts = posts.filter((post) => !hasAiGeneratedTag(post.tags));
    } else if (filters.aiFilter === "only") {
      posts = posts.filter((post) => hasAiGeneratedTag(post.tags));
    }

    if (filters.orientation !== "all") {
      posts = posts.filter((post) => matchesOrientation(post, filters.orientation));
    }

    if (filters.dateFrom || filters.dateTo) {
      posts = posts.filter((post) => {
        const date = getPublishedDate(post.publishedAt);
        if (!date) return true;
        if (filters.dateFrom && date < filters.dateFrom) return false;
        if (filters.dateTo && date > filters.dateTo) return false;
        return true;
      });
    }

    return posts;
  }, [data, filters.aiFilter, filters.orientation, filters.dateFrom, filters.dateTo]);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!playlist.isSmart) {
      // setState-in-effect: `localPosts` is a DnD-mutable copy of React Query `allPosts` and
      // must be replaced when the server list updates; deriving without local state would drop reorder.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalPosts(allPosts);
    }
  }, [allPosts, playlist.isSmart]);

  useEffect(() => {
    return () => {
      deactivateBulkMode();
    };
  }, [deactivateBulkMode]);

  const displayedPosts = playlist.isSmart ? allPosts : localPosts;
  const selectedPosts = useMemo(
    () => displayedPosts.filter((post) => selectedIds.has(getBulkSelectId(post))),
    [displayedPosts, selectedIds]
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage().then((result) => {
        const newPage = result.data?.pages[result.data.pages.length - 1];
        if (!newPage || newPage.length === 0) return;
        const filteredIds = newPage
          .filter((post) =>
            shouldIncludePostInPlaylistQueue(post, {
              aiFilter: filters.aiFilter,
              orientation: filters.orientation,
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
            })
          )
          .map((post) => (post.id === 0 && post.postId ? post.postId : post.id));
        if (filteredIds.length > 0) {
          appendQueueIds(filteredIds);
        }
      });
    }
  };

  const handlePostClick = (index: number) => {
    // For remote posts (id=0), use postId as identifier; for local posts, use id
    const postIds = displayedPosts.map((p) => (p.id === 0 && p.postId ? p.postId : p.id));
    
    // CRITICAL: Extract provider from playlist queryJson for shadow insert operations
    // Provider must match the actual source of posts to prevent 404 or invalid data
    let provider: "rule34" | "gelbooru" | undefined = undefined;
    if (playlist.isSmart && playlist.queryJson) {
      const parsedQuery = parsePlaylistQuery(
        playlist.queryJson,
        playlist.querySchemaVersion
      );
      provider = parsedQuery?.provider;
    }
    
    openViewer({
      origin: {
        kind: "playlist",
        playlistId: playlist.id,
        mediaType: filters.mediaType,
        rating: ratingLetter,
        aiFilter: filters.aiFilter,
        sortOrder,
        provider, // Pass provider to origin for shadow insert operations
      },
      ids: postIds,
      initialIndex: index,
      listKey: `playlist-${playlist.id}`,
      hasNextPage: hasNextPage && displayedPosts.length < (data?.pages.length ?? 0) * 50,
      onLoadMore: handleLoadMore,
    });
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleMasonryScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!hasNextPage || isFetchingNextPage) return;

      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const LOAD_MORE_THRESHOLD_PX = 300;
      if (scrollHeight - (scrollTop + clientHeight) <= LOAD_MORE_THRESHOLD_PX) {
        void fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleRemovePost = async (postId: number) => {
    if (playlist.isSmart) {
      log.warn("[PlaylistGallery] Cannot remove posts from smart playlists");
      return;
    }

    const previousPosts = localPosts;
    setLocalPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));

    try {
      await window.api.removePostsFromPlaylist({
        playlistId: playlist.id,
        postIds: [postId],
      });

      // Invalidate playlist posts list
      queryClient.invalidateQueries({ queryKey: ["playlist-posts", playlist.id] });
      // Invalidate playlist-entries so PostCard/QuickAddToPlaylistMenu on other tabs show correct status
      queryClient.invalidateQueries({ queryKey: ["playlist-entries"] });
      queryClient.invalidateQueries({ queryKey: ["playlist-entries", postId] });
    } catch (error) {
      log.error("[PlaylistGallery] Failed to remove post from playlist:", error);
      setLocalPosts(previousPosts);
    }
  };

  const handleBulkRemove = useCallback(
    async (posts: Post[]) => {
      const removableIds = posts.map((post) => post.id).filter((id) => id > 0);
      if (removableIds.length === 0) {
        return;
      }
      await window.api.removePostsFromPlaylist({
        playlistId: playlist.id,
        postIds: removableIds,
      });
      await queryClient.invalidateQueries({ queryKey: ["playlist-posts", playlist.id] });
      await queryClient.invalidateQueries({ queryKey: ["playlist-entries"] });
      setLocalPosts((currentPosts) =>
        currentPosts.filter((post) => !removableIds.includes(post.id))
      );
    },
    [playlist.id, queryClient]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (playlist.isSmart) {
        return;
      }

      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const activeId = Number(active.id);
      const overId = Number(over.id);
      const oldIndex = localPosts.findIndex((post) => post.id === activeId);
      const newIndex = localPosts.findIndex((post) => post.id === overId);

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const previousPosts = localPosts;
      const newOrder = arrayMove(localPosts, oldIndex, newIndex);
      setLocalPosts(newOrder);

      window.api
        .reorderPlaylistEntries({
          playlistId: playlist.id,
          orderedPostIds: newOrder.map((post) => post.id),
        })
        .catch((error: unknown) => {
          log.error("[PlaylistsPage] Reorder failed:", error);
          setLocalPosts(previousPosts);
        });
    },
    [localPosts, playlist.id, playlist.isSmart]
  );

  const ListComponent = useMemo(() => createVirtuosoList(viewType), [viewType]);
  const ItemComponent = useMemo(() => createItemContainer(viewType), [viewType]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            {playlist.isSmart ? (
              <Sparkles className="w-5 h-5 text-primary" />
            ) : (
              <List className="w-5 h-5 text-primary" />
            )}
            <div>
              <h1 className="text-xl font-semibold">{playlist.name}</h1>
              {playlist.isSmart && (
                <p className="text-xs text-muted-foreground mt-1">
                  Smart Collection
                </p>
              )}
              {displayedPosts.length > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Total: {displayedPosts.length}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
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
      </div>

      {/* Grid Content */}
      <div className="flex-1 min-h-0">
        {isLoading && displayedPosts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : viewType === "masonry" ? (
          <div className="overflow-auto h-full" onScroll={handleMasonryScroll}>
            <GridContainer viewType="masonry">
              {displayedPosts.map((post, index) => (
                <div key={getPostCardKey(post)} className="w-full mb-4 break-inside-avoid">
                  <PostCard
                    post={post}
                    onClick={() => handlePostClick(index)}
                    preserveAspect={false}
                    context="playlist"
                    onRemoveFromPlaylist={
                      !playlist.isSmart ? () => handleRemovePost(post.id) : undefined
                    }
                  />
                </div>
              ))}
            </GridContainer>
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : !playlist.isSmart ? (
          <div className="overflow-auto h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayedPosts.map((post) => post.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-4 p-4 pb-44 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {displayedPosts.map((post, index) => (
                    <SortablePostCard
                      key={getPostCardKey(post)}
                      post={post}
                      onClick={() => handlePostClick(index)}
                      onRemove={() => handleRemovePost(post.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <VirtuosoGrid
            className="h-full"
            totalCount={displayedPosts.length}
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
              const post = displayedPosts[index];
              if (!post) return null;

              return (
                <PostCard
                  key={getPostCardKey(post)}
                  post={post}
                  onClick={() => handlePostClick(index)}
                  context="playlist"
                  onRemoveFromPlaylist={
                    !playlist.isSmart ? () => handleRemovePost(post.id) : undefined
                  }
                />
              );
            }}
          />
        )}
      </div>
      <BulkActionBar
        selectedPosts={selectedPosts}
        currentPlaylistId={playlist.id}
        currentPlaylistIsSmart={playlist.isSmart}
        onRemoveSelected={!playlist.isSmart ? handleBulkRemove : undefined}
        onSelectAll={() => {
          const selectableIds = displayedPosts.map((post) => getBulkSelectId(post));
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

// Main Playlists Page Component
export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ onBack }) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithStats | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playlistType, setPlaylistType] = useState<"smart" | "manual">("manual");
  const [tagInputValue, setTagInputValue] = useState("");
  
  // Smart Collection tags state
  const [smartTags, setSmartTags] = useState<SmartPlaylistTag[]>([]);
  
  // Filter state for playlist type
  const [playlistFilter, setPlaylistFilter] = useState<"all" | "smart" | "manual">("all");
  
  const [playlistToDelete, setPlaylistToDelete] = useState<PlaylistWithStats | null>(null);
  const [playlistToClear, setPlaylistToClear] = useState<PlaylistWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<PlaylistWithStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportingPlaylistId, setExportingPlaylistId] = useState<number | null>(null);
  const [clearingPlaylistId, setClearingPlaylistId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Use optimized usePlaylists hook with caching
  const { data: playlists = [], isLoading } = usePlaylists();

  // Filter playlists based on playlistFilter
  const filteredPlaylists = useMemo(() => {
    if (playlistFilter === "all") {
      return playlists;
    }
    return playlists.filter((playlist: PlaylistWithStats) => 
      playlistFilter === "smart" ? playlist.isSmart : !playlist.isSmart
    );
  }, [playlists, playlistFilter]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      return;
    }

    // Smart collections require at least one tag
    if (playlistType === "smart" && smartTags.length === 0) {
      log.error("[PlaylistsPage] Smart collection must have at least one tag");
      return;
    }

    setIsCreating(true);
    try {
      // Normalize tags (trim + lowercase) for consistency with FTS5 unicode61 tokenizer
      const normalizedTags = playlistType === "smart"
        ? smartTags.map(tag => ({
            tag: tag.tag.trim().toLowerCase(),
            type: tag.type,
          }))
        : [];
      
      const queryJson = playlistType === "smart" 
        ? JSON.stringify({ 
            tags: normalizedTags,
          } as SmartPlaylistQuery)
        : "";
      
      await window.api.createPlaylist({
        name: newPlaylistName.trim(),
        isSmart: playlistType === "smart",
        queryJson,
        iconName: "",
      });

      queryClient.invalidateQueries({ queryKey: ["playlists"] });
          setNewPlaylistName("");
          setTagInputValue("");
          setSmartTags([]);
          setPlaylistType("manual"); // Reset to manual for next creation
          setIsDialogOpen(false);
    } catch (error) {
      log.error("[PlaylistsPage] Failed to create playlist:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTagSelect = (option: SearchResults | null) => {
    if (!option) return;

    const tagName = option.value.trim();
    if (!tagName) return;

    // Check if tag already exists
    if (smartTags.some((t) => t.tag.toLowerCase() === tagName.toLowerCase())) {
      setTagInputValue("");
      return;
    }

    // Add tag with default "include" type
    setSmartTags((prev) => [...prev, { tag: tagName, type: "include" }]);
    setTagInputValue("");
  };

  const toggleTagType = (index: number) => {
    setSmartTags((prev) =>
      prev.map((tag, i) =>
        i === index ? { ...tag, type: tag.type === "include" ? "exclude" : "include" } : tag
      )
    );
  };

  const removeTag = (index: number) => {
    setSmartTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePlaylist = async () => {
    if (!playlistToEdit) return;
    if (!newPlaylistName.trim()) {
      return;
    }

    // Smart collections require at least one tag
    if (playlistType === "smart" && smartTags.length === 0) {
      log.error("[PlaylistsPage] Smart collection must have at least one tag");
      return;
    }

    setIsEditing(true);
    try {
      // Normalize tags (trim + lowercase) for consistency with FTS5 unicode61 tokenizer
      const normalizedTags = playlistType === "smart"
        ? smartTags.map(tag => ({
            tag: tag.tag.trim().toLowerCase(),
            type: tag.type,
          }))
        : [];
      
      const queryJson = playlistType === "smart" 
        ? JSON.stringify({ 
            tags: normalizedTags,
          } as SmartPlaylistQuery)
        : "";
      
      await window.api.updatePlaylist(playlistToEdit.id, {
        name: newPlaylistName.trim(),
        queryJson,
      });

      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setNewPlaylistName("");
      setTagInputValue("");
      setSmartTags([]);
      setPlaylistType("manual");
      setPlaylistToEdit(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      log.error("[PlaylistsPage] Failed to update playlist:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlistToDelete) return;

    setIsDeleting(true);
    try {
      await window.api.deletePlaylist(playlistToDelete.id);
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setPlaylistToDelete(null);
      
      // If deleted playlist was selected, go back to list
      if (selectedPlaylist?.id === playlistToDelete.id) {
        setSelectedPlaylist(null);
      }
    } catch (error) {
      log.error("[PlaylistsPage] Failed to delete playlist:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllPostsInPlaylist = async (pl: PlaylistWithStats): Promise<boolean> => {
    if (pl.isSmart) {
      return false;
    }
    setClearingPlaylistId(pl.id);
    try {
      await window.api.clearManualPlaylist({ playlistId: pl.id });
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      await queryClient.invalidateQueries({ queryKey: ["playlist-posts", pl.id] });
      toast.success(`Removed all posts from "${pl.name}"`);
      return true;
    } catch (error) {
      log.error("[PlaylistsPage] Failed to clear playlist posts:", error);
      toast.error("Failed to clear playlist");
      return false;
    } finally {
      setClearingPlaylistId(null);
    }
  };

  const handleExportPlaylist = async (playlist: PlaylistWithStats) => {
    if (exportingPlaylistId !== null) {
      return;
    }

    setExportingPlaylistId(playlist.id);

    try {
      const result = await window.api.exportPlaylist(playlist.id);
      if (result.success && result.path) {
        toast.success("Playlist exported successfully");
        return;
      }

      if (result.error && result.error !== "Cancelled") {
        toast.error(`Failed to export playlist: ${result.error}`);
      }
    } catch (error) {
      log.error("[PlaylistsPage] Failed to export playlist:", error);
      toast.error("Failed to export playlist");
    } finally {
      setExportingPlaylistId(null);
    }
  };

  const handleImportPlaylist = async () => {
    if (isImporting) {
      return;
    }

    setIsImporting(true);

    try {
      const result = await window.api.importPlaylist();
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["playlists"] });

        if (typeof result.playlistId === "number") {
          const importedPosts = await window.api.getPlaylistPosts({
            playlistId: result.playlistId,
            page: 1,
            limit: 1,
            isRandom: false,
            sortOrder: "position",
          });
          if (importedPosts.length === 0) {
            toast.info(EMPTY_IMPORTED_PLAYLIST_TOAST);
          } else {
            toast.success("Playlist imported successfully");
          }
        } else {
          toast.success("Playlist imported successfully");
        }
        return;
      }

      if (result.error && result.error !== "Cancelled") {
        if (isInvalidPlaylistError(result.error)) {
          toast.error(INVALID_PLAYLIST_TOAST);
        } else {
          toast.error(`Failed to import playlist: ${result.error}`);
        }
      }
    } catch (error) {
      log.error("[PlaylistsPage] Failed to import playlist:", error);
      const message = toErrorMessage(error);
      if (isInvalidPlaylistError(message)) {
        toast.error(INVALID_PLAYLIST_TOAST);
      } else {
        toast.error("Failed to import playlist");
      }
    } finally {
      setIsImporting(false);
    }
  };

  // If a playlist is selected, show its gallery
  if (selectedPlaylist) {
    return (
      <PlaylistGallery
        playlist={selectedPlaylist}
        onBack={() => setSelectedPlaylist(null)}
      />
    );
  }

  // Show playlist list
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-xl font-semibold">Playlists</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImportPlaylist} disabled={isImporting}>
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isImporting ? "Importing..." : "Import Playlist"}
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Playlist
            </Button>
          </div>
        </div>
        
        {/* Playlist Type Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Filter:</Label>
          <ToggleGroup
            type="single"
            value={playlistFilter}
            onValueChange={(value) => {
              if (value === "all" || value === "smart" || value === "manual") {
                setPlaylistFilter(value);
              }
            }}
            size="sm"
            variant="outline"
          >
            <ToggleGroupItem value="all" className="gap-2">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="smart" className="gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Smart Collections
            </ToggleGroupItem>
            <ToggleGroupItem value="manual" className="gap-2">
              <List className="w-3.5 h-3.5" />
              Manual Playlists
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Playlist List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <List className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">No playlists yet</p>
            <p className="text-sm mt-2">Create your first playlist to get started</p>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            {playlistFilter === "smart" ? (
              <Sparkles className="w-16 h-16 mb-4 opacity-50" />
            ) : (
              <List className="w-16 h-16 mb-4 opacity-50" />
            )}
            <p className="text-lg">
              {playlistFilter === "smart" 
                ? "No smart collections yet" 
                : "No manual playlists yet"}
            </p>
            <p className="text-sm mt-2">
              {playlistFilter === "smart"
                ? "Create a smart collection to get started"
                : "Create a manual playlist to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlaylists.map((playlist: PlaylistWithStats) => (
              <div
                key={playlist.id}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-lg border bg-card",
                  "hover:border-primary hover:shadow-md transition-all",
                  "relative group"
                )}
              >
                <PlaylistCard
                  playlist={playlist}
                  onOpen={setSelectedPlaylist}
                  actionPaddingClassName={playlist.isSmart ? "pr-32" : "pr-40"}
                />
                <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleExportPlaylist(playlist);
                    }}
                    title="Export playlist"
                    disabled={exportingPlaylistId !== null}
                  >
                    {exportingPlaylistId === playlist.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaylistToEdit(playlist);
                      setIsEditDialogOpen(true);
                      // Load playlist data into edit form
                      setNewPlaylistName(playlist.name);
                      setPlaylistType(playlist.isSmart ? "smart" : "manual");
                      if (playlist.isSmart && playlist.queryJson) {
                        // Use shared utility to parse queryJson (Renderer shouldn't know DB format)
                        const queryJson = parsePlaylistQuery(
                          playlist.queryJson,
                          playlist.querySchemaVersion
                        );
                        setSmartTags(queryJson?.tags || []);
                      } else {
                        setSmartTags([]);
                      }
                      setTagInputValue("");
                    }}
                    title="Edit playlist"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!playlist.isSmart && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaylistToClear(playlist);
                      }}
                      title="Clear all posts from playlist"
                      disabled={clearingPlaylistId !== null}
                    >
                      {clearingPlaylistId === playlist.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eraser className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaylistToDelete(playlist);
                    }}
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!playlistToClear}
        onOpenChange={(o) => {
          if (!o) {
            setPlaylistToClear(null);
          }
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all posts?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove all posts from {playlistToClear?.name ?? ""}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearingPlaylistId !== null}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={clearingPlaylistId !== null}
              onClick={async (e) => {
                e.preventDefault();
                if (!playlistToClear) {
                  return;
                }
                const pl = playlistToClear;
                const ok = await handleClearAllPostsInPlaylist(pl);
                if (ok) {
                  setPlaylistToClear(null);
                }
              }}
            >
              {clearingPlaylistId !== null ? "Clearing…" : "Clear all"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Playlist Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          // Reset form when closing
          setNewPlaylistName("");
          setTagInputValue("");
          setSmartTags([]);
          setPlaylistType("manual");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create Playlist
            </DialogTitle>
            <DialogDescription>
              Create a manual playlist or a smart collection that automatically updates based on tags.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Playlist Type Toggle */}
            <div className="space-y-2">
              <Label>Playlist Type</Label>
              <ToggleGroup
                type="single"
                value={playlistType}
                onValueChange={(value) => {
                  if (value === "smart" || value === "manual") {
                    setPlaylistType(value);
                    // Clear tags when switching to manual
                    if (value === "manual") {
                      setSmartTags([]);
                      setTagInputValue("");
                    }
                  }
                }}
                size="default"
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="manual" className="flex-1">
                  <List className="w-4 h-4 mr-2" />
                  Manual Playlist
                </ToggleGroupItem>
                <ToggleGroupItem value="smart" className="flex-1">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Smart Collection
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Playlist Name */}
            <div className="space-y-2">
              <Label htmlFor="playlist-name">
                {playlistType === "smart" ? "Collection Name" : "Playlist Name"}
              </Label>
              <Input
                id="playlist-name"
                placeholder={playlistType === "smart" ? "My Smart Collection" : "My Playlist"}
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating && newPlaylistName.trim()) {
                    if (playlistType === "smart" && smartTags.length > 0) {
                      handleCreatePlaylist();
                    } else if (playlistType === "manual") {
                      handleCreatePlaylist();
                    }
                  }
                }}
                disabled={isCreating}
              />
            </div>

            {/* Tag Input - Only for Smart Collections */}
            {playlistType === "smart" && (
              <>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <AsyncAutocomplete
                    label=""
                    value={tagInputValue}
                    onQueryChange={setTagInputValue}
                    onSelect={handleTagSelect}
                    placeholder="Search for tags..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Click tags to toggle between Include (green) and Exclude (red)
                  </p>
                </div>

                {/* Tag Badges */}
                {smartTags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Tags</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50 min-h-[60px]">
                      {smartTags.map((tag, index) => (
                        <Badge
                          key={`${tag.type}-${tag.tag}`}
                          variant={tag.type === "include" ? "default" : "destructive"}
                          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5"
                          onClick={() => toggleTagType(index)}
                        >
                          {tag.type === "include" ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          <span>{tag.tag}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTag(index);
                            }}
                            className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              disabled={
                isCreating || 
                !newPlaylistName.trim() || 
                (playlistType === "smart" && smartTags.length === 0)
              }
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  {playlistType === "smart" ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Collection
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Playlist
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Playlist Confirmation Dialog */}
      <Dialog open={!!playlistToDelete} onOpenChange={(open) => !open && setPlaylistToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Playlist
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{playlistToDelete?.name}"? This action cannot be undone.
              {!playlistToDelete?.isSmart && " All posts will be removed from this playlist."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlaylistToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlaylist}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Playlist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          // Reset form when closing
          setNewPlaylistName("");
          setTagInputValue("");
          setSmartTags([]);
          setPlaylistType("manual");
          setPlaylistToEdit(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Playlist
            </DialogTitle>
            <DialogDescription>
              Update playlist name and tags. Smart collections automatically update based on tags.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Playlist Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-playlist-name">Name</Label>
              <Input
                id="edit-playlist-name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name..."
                disabled={isEditing}
              />
            </div>

            {/* Playlist Type Toggle - Disabled for editing (can't change type) */}
            <div className="space-y-2">
              <Label>Playlist Type</Label>
              <ToggleGroup
                type="single"
                value={playlistType}
                size="default"
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="manual" className="flex-1">
                  <List className="w-4 h-4 mr-2" />
                  Manual Playlist
                </ToggleGroupItem>
                <ToggleGroupItem value="smart" className="flex-1">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Smart Collection
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Tag Input - Only for Smart Collections */}
            {playlistType === "smart" && (
              <>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <AsyncAutocomplete
                    label=""
                    value={tagInputValue}
                    onQueryChange={setTagInputValue}
                    onSelect={handleTagSelect}
                    placeholder="Search for tags..."
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {smartTags.map((tag, index) => (
                      <Badge
                        key={`${tag.type}-${tag.tag}`}
                        variant={tag.type === "include" ? "default" : "destructive"}
                        className="cursor-pointer flex items-center gap-1"
                        onClick={() => toggleTagType(index)}
                      >
                        {tag.type === "include" ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        <span>{tag.tag}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTag(index);
                          }}
                          className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePlaylist}
              disabled={
                isEditing || 
                !newPlaylistName.trim() || 
                (playlistType === "smart" && smartTags.length === 0)
              }
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Update Playlist
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
