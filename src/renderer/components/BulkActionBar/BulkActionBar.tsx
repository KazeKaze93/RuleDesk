import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ListPlus, MoveRight, Trash2, X, CheckCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useBulkSelect } from "../../hooks/useBulkSelect";
import type { Post } from "@shared/types/db";
import { AddToPlaylistModal } from "../playlists/AddToPlaylistModal";
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

interface BulkActionBarProps {
  selectedPosts: Post[];
  onRemoveSelected?: (posts: Post[]) => Promise<void>;
  onSelectAll?: () => void;
  /** When set with a manual playlist, shows "Move to…" in bulk mode */
  currentPlaylistId?: number;
  currentPlaylistIsSmart?: boolean;
}

export const BulkActionBar = ({
  selectedPosts,
  onRemoveSelected,
  onSelectAll,
  currentPlaylistId,
  currentPlaylistIsSmart = false,
}: BulkActionBarProps) => {
  const selectedCount = useBulkSelect((state) => state.selectedIds.size);
  const isBulkMode = useBulkSelect((state) => state.isBulkMode);
  const deactivate = useBulkSelect((state) => state.deactivate);
  const clearSelection = useBulkSelect((state) => state.clearSelection);
  const queryClient = useQueryClient();
  const [isAddPlaylistOpen, setIsAddPlaylistOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveTargets, setMoveTargets] = useState<{ id: number; name: string }[]>([]);
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>("");
  const [isMoveSubmitting, setIsMoveSubmitting] = useState(false);

  const inManualPlaylistView =
    currentPlaylistId != null &&
    currentPlaylistId > 0 &&
    !currentPlaylistIsSmart;

  const otherManualForMove = useMemo(
    () => moveTargets.find((p) => p.id === Number(targetPlaylistId))?.name ?? "",
    [moveTargets, targetPlaylistId]
  );

  const openMoveDialog = useCallback(async () => {
    if (!inManualPlaylistView) {
      return;
    }
    try {
      const available = await window.api.getPlaylists();
      const options = available
        .filter((item) => !item.isSmart && item.id !== currentPlaylistId)
        .map((item) => ({ id: item.id, name: item.name }));
      if (options.length === 0) {
        toast.info("No other manual playlists to move to");
        return;
      }
      setMoveTargets(options);
      setTargetPlaylistId(String(options[0]!.id));
      setIsMoveOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[BulkActionBar] Failed to load playlists for move:", message);
      toast.error("Failed to load playlists");
    }
  }, [currentPlaylistId, inManualPlaylistView]);

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

  // Must run on every render (including when selectedCount === 0); hooks cannot follow a conditional return.
  const postRefs = useMemo(
    () => selectedPosts.map((p) => ({ id: p.id, postId: p.postId })),
    [selectedPosts]
  );

  if (selectedCount === 0) {
    return null;
  }

  const openAddToPlaylist = async () => {
    try {
      const available = await window.api.getPlaylists();
      const hasManual = available.some((item) => !item.isSmart);
      if (!hasManual) {
        toast.info("No manual playlists available");
        return;
      }
      setIsAddPlaylistOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[BulkActionBar] Failed to load playlists:", message);
      toast.error("Failed to load playlists");
    }
  };

  const handleMoveConfirm = async () => {
    if (!inManualPlaylistView) {
      return;
    }
    const to = Number(targetPlaylistId);
    if (!Number.isFinite(to) || to === currentPlaylistId) {
      return;
    }
    setIsMoveSubmitting(true);
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
        toast.info("No posts to move");
        return;
      }
      await window.api.movePostsBetweenManualPlaylists({
        fromPlaylistId: currentPlaylistId,
        toPlaylistId: to,
        postIds: resolvedIds,
      });
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      await queryClient.invalidateQueries({ queryKey: ["playlist-posts", currentPlaylistId] });
      await queryClient.invalidateQueries({ queryKey: ["playlist-posts", to] });
      await queryClient.invalidateQueries({ queryKey: ["playlist-entries"] });
      clearSelection();
      setIsMoveOpen(false);
      toast.success(`Moved ${resolvedIds.length} posts to "${otherManualForMove}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[BulkActionBar] Move failed:", message);
      toast.error("Failed to move posts");
    } finally {
      setIsMoveSubmitting(false);
    }
  };

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
            {inManualPlaylistView && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => void openMoveDialog()}
              >
                <MoveRight className="h-4 w-4" />
                Move to…
              </Button>
            )}
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
      <AddToPlaylistModal
        posts={postRefs}
        open={isAddPlaylistOpen}
        onOpenChange={setIsAddPlaylistOpen}
        onSuccess={() => {
          clearSelection();
        }}
        title="Add to playlist"
      />
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to playlist</DialogTitle>
            <DialogDescription>
              Move {selectedCount} selected posts to another manual playlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Select value={targetPlaylistId} onValueChange={setTargetPlaylistId}>
              <SelectTrigger>
                <SelectValue placeholder="Select playlist" />
              </SelectTrigger>
              <SelectContent>
                {moveTargets.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsMoveOpen(false)} disabled={isMoveSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleMoveConfirm()}
              disabled={isMoveSubmitting || targetPlaylistId.length === 0}
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
