import React, { useMemo, useState } from "react";
import {
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, Loader2, List, Sparkles, Plus, Trash2, X, Check, Minus, Pencil, Download, Upload, Eraser } from "lucide-react";
import log from "electron-log/renderer";
import { Button } from "../../components/ui/button";
import type { PlaylistWithStats } from "@shared/types/bridge";
import { cn } from "../../lib/utils";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
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
import type { SearchResults } from "@shared/types/providers";
import { toast } from "sonner";
import { PlaylistCard } from "../playlists/PlaylistCard";
import { PlaylistGallery } from "../playlists/PlaylistGallery";

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
      
      const queryObj: SmartPlaylistQuery = { tags: normalizedTags, provider: "rule34" };
      const queryJson = playlistType === "smart" 
        ? JSON.stringify(queryObj)
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
      
      const queryObj: SmartPlaylistQuery = { tags: normalizedTags, provider: "rule34" };
      const queryJson = playlistType === "smart" 
        ? JSON.stringify(queryObj)
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTag(index);
                            }}
                            className="ml-1 h-auto w-auto rounded-full p-0.5 hover:bg-black/20"
                          >
                            <X className="w-3 h-3" />
                          </Button>
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTag(index);
                          }}
                          className="ml-1 h-auto w-auto rounded-full p-0.5 hover:bg-black/20"
                        >
                          <X className="w-3 h-3" />
                        </Button>
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
