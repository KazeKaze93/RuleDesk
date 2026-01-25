import React, { forwardRef, useMemo, useState } from "react";
import {
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { ArrowLeft, Loader2, List, Sparkles, Plus, Trash2, X, Check, Minus, Pencil } from "lucide-react";
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
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { AsyncAutocomplete } from "../../components/inputs/AsyncAutocomplete";
import type { SmartPlaylistQuery, SmartPlaylistTag } from "../../../shared/schemas/playlist";
import { parsePlaylistQuery } from "../../../shared/schemas/playlist";
import { usePlaylists } from "../../lib/hooks/usePlaylists";
import type { SearchResults } from "../../../main/providers";

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
  const filters = useSearchStore((state) => state.filters);
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const queryClient = useQueryClient();

  // Build filters for API call from GlobalTopBar filters
  const apiFilters = useMemo(() => {
    const result: { rating?: "s" | "q" | "e"; mediaType?: "all" | "images" | "videos" } = {};
    
    // Map mediaType filter from GlobalTopBar
    if (filters.mediaType && filters.mediaType !== "all") {
      result.mediaType = filters.mediaType;
    }
    
    return result;
  }, [filters.mediaType]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<Post[]>({
    queryKey: ["playlist-posts", playlist.id, filters.mediaType, sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      return await window.api.resolvePlaylistPosts({
        playlistId: playlist.id,
        page: pageParam as number,
        limit: 50,
        filters: Object.keys(apiFilters).length > 0 ? apiFilters : undefined,
        sortOrder,
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
    // For remote posts (id=0), use postId as identifier; for local posts, use id
    const postIds = allPosts.map((p) => (p.id === 0 && p.postId ? p.postId : p.id));
    openViewer({
      origin: {
        kind: "playlist",
        playlistId: playlist.id,
        mediaType: filters.mediaType,
        sortOrder,
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
              {playlist.isSmart && (
                <p className="text-xs text-muted-foreground mt-1">
                  Smart Collection
                </p>
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playlistType, setPlaylistType] = useState<"smart" | "manual">("manual");
  const [tagInputValue, setTagInputValue] = useState("");
  
  // Smart Collection tags state
  const [smartTags, setSmartTags] = useState<SmartPlaylistTag[]>([]);
  
  // Filter state for playlist type
  const [playlistFilter, setPlaylistFilter] = useState<"all" | "smart" | "manual">("all");
  
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Use optimized usePlaylists hook with caching
  const { data: playlists = [], isLoading } = usePlaylists();

  // Filter playlists based on playlistFilter
  const filteredPlaylists = useMemo(() => {
    if (playlistFilter === "all") {
      return playlists;
    }
    return playlists.filter((playlist) => 
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
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Playlist
          </Button>
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
            {filteredPlaylists.map((playlist) => (
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
                  {playlist.isSmart && (
                    <span className="text-xs text-primary font-medium">
                      Smart Collection
                    </span>
                  )}
                </button>
                <div className="flex gap-2 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        const queryJson = parsePlaylistQuery(playlist.queryJson);
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
                          key={`${tag.tag}-${index}`}
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
                disabled={true}
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
                    disabled={isEditing}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {smartTags.map((tag, index) => (
                      <Badge
                        key={index}
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
