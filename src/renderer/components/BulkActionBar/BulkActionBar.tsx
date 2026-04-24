import { useEffect, useMemo, useState } from "react";
import { Download, ListPlus, Trash2, X, CheckCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import type { Post } from "../../../main/db/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const ESCAPE_KEY = "Escape";
type PlaylistOption = { id: number; name: string };

interface BulkActionBarProps {
  selectedPosts: Post[];
  onRemoveSelected?: (posts: Post[]) => Promise<void>;
  onSelectAll?: () => void;
}

const toDownloadItem = (post: Post): { url: string; filename: string } | null => {
  if (!post.fileUrl?.trim()) {
    return null;
  }
  const pathMatch = post.fileUrl.match(/^[^?#]+/);
  const pathname = pathMatch ? pathMatch[0] : post.fileUrl;
  const extension = pathname.split(".").pop()?.toLowerCase() || "jpg";
  return {
    url: post.fileUrl,
    filename: `${post.artistId}_${post.postId}.${extension}`,
  };
};

export const BulkActionBar = ({
  selectedPosts,
  onRemoveSelected,
  onSelectAll,
}: BulkActionBarProps) => {
  const selectedCount = useBulkSelect((state) => state.selectedIds.size);
  const isBulkMode = useBulkSelect((state) => state.isBulkMode);
  const deactivate = useBulkSelect((state) => state.deactivate);
  const clearSelection = useBulkSelect((state) => state.clearSelection);
  const queryClient = useQueryClient();
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [playlistId, setPlaylistId] = useState<string>("");
  const [isSubmittingPlaylist, setIsSubmittingPlaylist] = useState(false);

  const selectedPlaylistName = useMemo(
    () => playlists.find((item) => item.id === Number(playlistId))?.name ?? "",
    [playlistId, playlists]
  );

  useEffect(() => {
    if (!isBulkMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ESCAPE_KEY) {
        deactivate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deactivate, isBulkMode]);

  if (selectedCount === 0) {
    return null;
  }

  const handleDownloadSelected = async () => {
    const items = selectedPosts
      .map(toDownloadItem)
      .filter((item): item is { url: string; filename: string } => item !== null);
    if (items.length === 0) {
      toast.info("No downloadable posts in selection");
      return;
    }
    try {
      await window.api.downloadAll(items);
      clearSelection();
      toast.success(`Download started for ${items.length} posts`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[BulkActionBar] Failed to download selected posts:", message);
      toast.error("Failed to start bulk download");
    }
  };

  const openAddToPlaylist = async () => {
    try {
      const available = await window.api.getPlaylists();
      const options = available
        .filter((item) => !item.isSmart)
        .map((item) => ({ id: item.id, name: item.name }));
      if (options.length === 0) {
        toast.info("No manual playlists available");
        return;
      }
      setPlaylists(options);
      const firstId = options[0]?.id;
      setPlaylistId(firstId ? String(firstId) : "");
      setIsPlaylistDialogOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[BulkActionBar] Failed to load playlists:", message);
      toast.error("Failed to load playlists");
    }
  };

  const handleAddToPlaylist = async () => {
    const selectedPlaylistId = Number(playlistId);
    if (!Number.isFinite(selectedPlaylistId)) {
      return;
    }
    setIsSubmittingPlaylist(true);
    try {
      const resolvedIds: number[] = [];
      for (const post of selectedPosts) {
        if (post.id > 0) {
          resolvedIds.push(post.id);
          continue;
        }
        const inserted = await window.api.shadowInsertPost({
          postId: post.postId,
          provider: "rule34",
        });
        resolvedIds.push(inserted.id);
      }
      if (resolvedIds.length === 0) {
        toast.info("No posts to add");
        return;
      }
      await window.api.addPostsToPlaylist({
        playlistIds: [selectedPlaylistId],
        postIds: resolvedIds,
      });
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      await queryClient.invalidateQueries({ queryKey: ["playlist-posts"] });
      await queryClient.invalidateQueries({ queryKey: ["playlist-entries"] });
      clearSelection();
      setIsPlaylistDialogOpen(false);
      toast.success(`Added ${resolvedIds.length} posts to "${selectedPlaylistName}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[BulkActionBar] Failed to add selected posts to playlist:", message);
      toast.error("Failed to add selected posts to playlist");
    } finally {
      setIsSubmittingPlaylist(false);
    }
  };

  const handleRemoveSelected = async () => {
    if (!onRemoveSelected) {
      return;
    }
    try {
      await onRemoveSelected(selectedPosts);
      clearSelection();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[BulkActionBar] Failed to remove selected posts:", message);
      toast.error("Failed to remove selected posts");
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void handleDownloadSelected()}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            {onSelectAll && (
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onSelectAll}>
                <CheckCheck className="h-4 w-4" />
                Select all
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openAddToPlaylist()}>
              <ListPlus className="h-4 w-4" />
              Add to Playlist
            </Button>
            {onRemoveSelected && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => void handleRemoveSelected()}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Exit bulk mode"
              onClick={deactivate}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={isPlaylistDialogOpen} onOpenChange={setIsPlaylistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add selected posts to playlist</DialogTitle>
            <DialogDescription>
              Selected posts: {selectedCount}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Select value={playlistId} onValueChange={setPlaylistId}>
              <SelectTrigger>
                <SelectValue placeholder="Select playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPlaylistDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleAddToPlaylist()}
              disabled={isSubmittingPlaylist || playlistId.length === 0}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
