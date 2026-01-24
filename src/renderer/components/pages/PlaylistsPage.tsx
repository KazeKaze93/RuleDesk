import React, { forwardRef, useMemo, useState } from "react";
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { ArrowLeft, Loader2, List, Sparkles, Plus, Trash2, X } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { useShallow } from "zustand/react/shallow";
import log from "electron-log/renderer";
import { Button } from "../../components/ui/button";
import type { Playlist, Post } from "../../../main/db/schema";
import { cn } from "../../lib/utils";
import { useViewerStore } from "../../store/viewerStore";
import { useSearchStore } from "../../store/searchStore";
import { PostCard } from "../../features/artists/components/PostCard";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/ui/dialog";
import type { SmartPlaylistQuery } from "../../../shared/schemas/playlist";

interface PlaylistsPageProps {
  onBack?: () => void;
}

// Virtualization components (reused from ArtistGallery pattern)
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

// Playlist Gallery Component (similar to ArtistGallery)
interface PlaylistGalleryProps {
  playlist: Playlist;
  onBack: () => void;
}

const PlaylistGallery: React.FC<PlaylistGalleryProps> = ({ playlist, onBack }) => {
  const { open: openViewer } = useViewerStore(
    useShallow((state) => ({
      open: state.open,
    }))
  );

  const viewType = useSearchStore((state) => state.viewType);
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<Post[]>({
    queryKey: ["playlist-posts", playlist.id],
    queryFn: async ({ pageParam = 1 }) => {
      return await window.api.resolvePlaylistPosts({
        playlistId: playlist.id,
        page: pageParam as number,
        limit: 50,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const allPosts = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handlePostClick = (index: number) => {
    const postIds = allPosts.map((p) => p.id);
    openViewer({
      origin: {
        kind: "playlist",
        playlistId: playlist.id,
      },
      ids: postIds,
      initialIndex: index,
      listKey: `playlist-${playlist.id}`,
      hasNextPage: hasNextPage && allPosts.length < (data?.pages.length ?? 0) * 50,
      onLoadMore: handleLoadMore,
    });
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRemovePost = async (postId: number) => {
    if (playlist.isSmart) {
      log.warn("[PlaylistGallery] Cannot remove posts from smart playlists");
      return;
    }

    try {
      await window.api.removePostsFromPlaylist({
        playlistId: playlist.id,
        postIds: [postId],
      });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["playlist-posts", playlist.id] });
      queryClient.invalidateQueries({ queryKey: ["playlist-entries"] });
    } catch (error) {
      log.error("[PlaylistGallery] Failed to remove post from playlist:", error);
    }
  };

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
              {playlist.description && (
                <p className="text-sm text-muted-foreground">{playlist.description}</p>
              )}
              {playlist.isSmart && (
                <p className="text-xs text-muted-foreground mt-1">Smart Collection</p>
              )}
            </div>
          </div>
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
                <PostCard
                  post={post}
                  onClick={() => handlePostClick(index)}
                  onRemoveFromPlaylist={
                    !playlist.isSmart ? () => handleRemovePost(post.id) : undefined
                  }
                />
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

// Main Playlists Page Component
export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ onBack }) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playlistType, setPlaylistType] = useState<"static" | "smart">("static");
  
  // Smart Collection filters state
  const [smartFilters, setSmartFilters] = useState<SmartPlaylistQuery>({
    operator: "AND",
    filters: [],
  });
  
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: async () => {
      return await window.api.getPlaylists();
    },
  });

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      return;
    }

    if (playlistType === "smart") {
      if (smartFilters.filters.length === 0) {
        log.error("[PlaylistsPage] Smart collection must have at least one filter");
        return;
      }
      
      // Validate filters
      for (const filter of smartFilters.filters) {
        if (filter.type === "tags" && typeof filter.value === "string" && !filter.value.trim()) {
          log.error("[PlaylistsPage] Tag filter cannot be empty");
          return;
        }
        if (filter.type === "rating" && (!Array.isArray(filter.value) || filter.value.length === 0)) {
          log.error("[PlaylistsPage] Rating filter must have at least one rating selected");
          return;
        }
      }
    }

    setIsCreating(true);
    try {
      const queryJson = playlistType === "smart" ? JSON.stringify(smartFilters) : "";
      
      await window.api.createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        isSmart: playlistType === "smart",
        queryJson,
        iconName: "",
      });

      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setPlaylistType("static");
      setSmartFilters({ operator: "AND", filters: [] });
      setIsDialogOpen(false);
    } catch (error) {
      log.error("[PlaylistsPage] Failed to create playlist:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const addSmartFilter = () => {
    setSmartFilters((prev) => ({
      ...prev,
      filters: [
        ...prev.filters,
        {
          type: "tags",
          operator: "include",
          value: "",
        },
      ],
    }));
  };

  const removeSmartFilter = (index: number) => {
    setSmartFilters((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  const updateSmartFilter = (index: number, updates: Partial<SmartPlaylistQuery["filters"][0]>) => {
    setSmartFilters((prev) => ({
      ...prev,
      filters: prev.filters.map((filter, i) =>
        i === index ? { ...filter, ...updates } : filter
      ),
    }));
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
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold">Playlists</h1>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Playlist
        </Button>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-lg border bg-card",
                  "hover:border-primary hover:shadow-md transition-all",
                  "relative group"
                )}
              >
                <button
                  onClick={() => setSelectedPlaylist(playlist)}
                  className="flex flex-col items-start gap-2 w-full text-left"
                >
                  <div className="flex items-center gap-2 w-full">
                    {playlist.isSmart ? (
                      <Sparkles className="w-5 h-5 text-primary" />
                    ) : (
                      <List className="w-5 h-5 text-primary" />
                    )}
                    <h3 className="font-semibold flex-1 truncate">{playlist.name}</h3>
                  </div>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 w-full">
                      {playlist.description}
                    </p>
                  )}
                  {playlist.isSmart && (
                    <span className="text-xs text-primary font-medium">Smart Collection</span>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlaylistToDelete(playlist);
                  }}
                  title="Delete playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          // Reset form when closing
          setNewPlaylistName("");
          setNewPlaylistDescription("");
          setPlaylistType("static");
          setSmartFilters({ operator: "AND", filters: [] });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Create a static playlist or a smart collection that automatically updates based on filters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Playlist Name */}
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                placeholder="My Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating && newPlaylistName.trim()) {
                    handleCreatePlaylist();
                  }
                }}
                disabled={isCreating}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="playlist-description">Description (Optional)</Label>
              <Input
                id="playlist-description"
                placeholder="A brief description..."
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Playlist Type Toggle */}
            <div className="space-y-2">
              <Label>Playlist Type</Label>
              <ToggleGroup
                type="single"
                value={playlistType}
                onValueChange={(value) => {
                  if (value === "static" || value === "smart") {
                    setPlaylistType(value);
                    if (value === "static") {
                      setSmartFilters({ operator: "AND", filters: [] });
                    }
                  }
                }}
                className="w-full"
              >
                <ToggleGroupItem value="static" className="flex-1">
                  <List className="mr-2 h-4 w-4" />
                  Static Playlist
                </ToggleGroupItem>
                <ToggleGroupItem value="smart" className="flex-1">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Smart Collection
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Smart Collection Filters */}
            {playlistType === "smart" && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label>Filters</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Operator:</Label>
                    <Select
                      value={smartFilters.operator}
                      onValueChange={(value: "AND" | "OR") => {
                        setSmartFilters((prev) => ({ ...prev, operator: value }));
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {smartFilters.filters.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                    No filters added. Click "Add Filter" to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smartFilters.filters.map((filter, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 border rounded-md bg-muted/50"
                      >
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          {/* Filter Type */}
                          <Select
                            value={filter.type}
                            onValueChange={(value: "tags" | "rating" | "media_type" | "viewed") => {
                              const newFilter: SmartPlaylistQuery["filters"][0] = {
                                type: value,
                                operator: value === "tags" ? "include" : value === "viewed" ? "equals" : "equals",
                                value:
                                  value === "tags"
                                    ? ""
                                    : value === "rating"
                                    ? []
                                    : value === "media_type"
                                    ? "image"
                                    : false,
                              };
                              updateSmartFilter(index, newFilter);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tags">Tags</SelectItem>
                              <SelectItem value="rating">Rating</SelectItem>
                              <SelectItem value="media_type">Media Type</SelectItem>
                              <SelectItem value="viewed">Viewed</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Operator */}
                          <Select
                            value={filter.operator}
                            onValueChange={(value: string) => {
                              updateSmartFilter(index, { operator: value as any });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {filter.type === "tags" ? (
                                <>
                                  <SelectItem value="include">Include</SelectItem>
                                  <SelectItem value="exclude">Exclude</SelectItem>
                                </>
                              ) : filter.type === "rating" ? (
                                <>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Not Equals</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Not Equals</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>

                          {/* Value */}
                          {filter.type === "tags" && (
                            <Input
                              placeholder="tag1 tag2..."
                              value={typeof filter.value === "string" ? filter.value : ""}
                              onChange={(e) => updateSmartFilter(index, { value: e.target.value })}
                            />
                          )}
                          {filter.type === "rating" && (
                            <div className="flex items-center gap-2">
                              {(["s", "q", "e"] as const).map((rating) => (
                                <div key={rating} className="flex items-center gap-1">
                                  <Checkbox
                                    checked={
                                      Array.isArray(filter.value) && filter.value.includes(rating)
                                    }
                                    onCheckedChange={(checked) => {
                                      const current = Array.isArray(filter.value) ? filter.value : [];
                                      const newValue = checked
                                        ? [...current, rating]
                                        : current.filter((r) => r !== rating);
                                      updateSmartFilter(index, { value: newValue });
                                    }}
                                  />
                                  <Label className="text-xs">{rating.toUpperCase()}</Label>
                                </div>
                              ))}
                            </div>
                          )}
                          {filter.type === "media_type" && (
                            <Select
                              value={typeof filter.value === "string" ? filter.value : "image"}
                              onValueChange={(value: "image" | "video") => {
                                updateSmartFilter(index, { value });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {filter.type === "viewed" && (
                            <Select
                              value={typeof filter.value === "boolean" ? String(filter.value) : "false"}
                              onValueChange={(value) => {
                                updateSmartFilter(index, { value: value === "true" });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Viewed</SelectItem>
                                <SelectItem value="false">Not Viewed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSmartFilter(index)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSmartFilter}
                  className="w-full"
                  disabled={isCreating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Filter
                </Button>
              </div>
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
                (playlistType === "smart" && smartFilters.filters.length === 0)
              }
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
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
    </div>
  );
};
