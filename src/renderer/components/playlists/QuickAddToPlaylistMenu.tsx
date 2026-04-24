import React, { useState, useEffect } from "react";
import { List, Plus, Loader2 } from "lucide-react";
import log from "electron-log/renderer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlaylists } from "../../lib/hooks/usePlaylists";
import type { Playlist } from "../../../main/db/schema";

interface QuickAddToPlaylistMenuProps {
  post: { id: number; postId: number };
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentAlign?: "start" | "center" | "end";
  contentSide?: "top" | "right" | "bottom" | "left";
  contentSideOffset?: number;
}

export const QuickAddToPlaylistMenu: React.FC<QuickAddToPlaylistMenuProps> = ({
  post,
  trigger,
  onSuccess,
  open,
  onOpenChange,
  contentAlign = "end",
  contentSide = "bottom",
  contentSideOffset = 4,
}) => {
  const postId = post.id;
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const effectiveIsMenuOpen = open ?? isMenuOpen;
  const setEffectiveIsMenuOpen = onOpenChange ?? setIsMenuOpen;

  // Fetch all playlists - only when menu is opened (lazy loading)
  const { data: allPlaylists = [], isLoading } = usePlaylists({ enabled: effectiveIsMenuOpen });
  
  // Filter out smart playlists - only show manual playlists
  const playlists = allPlaylists.filter((p: Playlist) => !p.isSmart);

  // Fetch which playlists this post is already in - single query instead of N queries
  const { data: existingPlaylistIds = [], isFetching } = useQuery<number[]>({
    queryKey: ["playlist-entries", postId, post.postId],
    queryFn: async () => {
      if (postId <= 0) {
        return [];
      }
      return await window.api.getPlaylistsContainingPost(postId);
    },
    enabled: effectiveIsMenuOpen && playlists.length > 0,
  });

  // Sync selectedPlaylistIds with server data when it changes. Only sync when not fetching
  // to avoid overwriting optimistic updates during refetch after toggle.
  useEffect(() => {
    if (effectiveIsMenuOpen && !isFetching) {
      setSelectedPlaylistIds(new Set(existingPlaylistIds));
    }
  }, [effectiveIsMenuOpen, isFetching, existingPlaylistIds]);

  const invalidatePostPlaylists = (effectivePostId: number, playlistIds: number[]) => {
    queryClient.invalidateQueries({ queryKey: ["playlist-entries", effectivePostId] });
    queryClient.invalidateQueries({ queryKey: ["playlist-entries", postId] });
    queryClient.invalidateQueries({ queryKey: ["playlists"] });
    for (const pid of playlistIds) {
      queryClient.invalidateQueries({ queryKey: ["playlist-posts", pid] });
    }
  };

  const handleTogglePlaylist = async (playlistId: number) => {
    const isAdding = !selectedPlaylistIds.has(playlistId);
    const prevSet = new Set(selectedPlaylistIds);

    // Optimistic update
    const newSet = new Set(selectedPlaylistIds);
    if (isAdding) {
      newSet.add(playlistId);
    } else {
      newSet.delete(playlistId);
    }
    setSelectedPlaylistIds(newSet);

    try {
      let effectivePostId = postId;
      if (postId <= 0 && post.postId > 0) {
        const inserted = await window.api.shadowInsertPost({
          postId: post.postId,
          provider: "rule34",
        });
        effectivePostId = inserted.id;
      }
      if (effectivePostId <= 0) {
        log.error("[QuickAddToPlaylistMenu] Cannot add/remove: post has no valid DB id");
        setSelectedPlaylistIds(prevSet);
        return;
      }

      if (isAdding) {
        await window.api.addPostsToPlaylist({
          playlistIds: [playlistId],
          postIds: [effectivePostId],
        });
      } else {
        await window.api.removePostsFromPlaylist({
          playlistId,
          postIds: [effectivePostId],
        });
      }

      invalidatePostPlaylists(effectivePostId, [playlistId]);
      onSuccess?.();
    } catch (error: unknown) {
      log.error("[QuickAddToPlaylistMenu] Failed to toggle playlist:", error);
      setSelectedPlaylistIds(prevSet);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const newPlaylist = await window.api.createPlaylist({
        name: newPlaylistName.trim(),
        isSmart: false, // Manual playlist
        queryJson: "",
        iconName: "",
      });

      // Add to selected playlists and immediately add post
      const newSet = new Set(selectedPlaylistIds);
      newSet.add(newPlaylist.id);
      setSelectedPlaylistIds(newSet);

      // Add post to the new playlist (shadow insert if external post)
      let effectivePostId = postId;
      if (postId <= 0 && post.postId > 0) {
        const inserted = await window.api.shadowInsertPost({
          postId: post.postId,
          provider: "rule34",
        });
        effectivePostId = inserted.id;
      }
      if (effectivePostId > 0) {
        await window.api.addPostsToPlaylist({
          playlistIds: [newPlaylist.id],
          postIds: [effectivePostId],
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["playlist-entries", postId] });
      queryClient.invalidateQueries({ queryKey: ["playlist-posts", newPlaylist.id] });

      setNewPlaylistName("");
      setIsDialogOpen(false);
      onSuccess?.();
    } catch (error) {
      log.error("[QuickAddToPlaylistMenu] Failed to create playlist:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <List className="h-4 w-4" />
    </Button>
  );

  return (
    <>
      {/* modal={false} allows menu to stay open when clicking outside; verify A11y with screen reader */}
      <DropdownMenu
        open={effectiveIsMenuOpen}
        onOpenChange={setEffectiveIsMenuOpen}
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          {trigger || defaultTrigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={contentAlign}
          side={contentSide}
          sideOffset={contentSideOffset}
          className="w-56"
        >
          <DropdownMenuLabel>Add to Playlist</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading ? (
            <div className="flex items-center justify-center px-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              {playlists.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No playlists yet
                </div>
              ) : (
                <>
                  {playlists.map((playlist: Playlist) => (
                    <DropdownMenuCheckboxItem
                      key={playlist.id}
                      checked={selectedPlaylistIds.has(playlist.id)}
                      onCheckedChange={() => handleTogglePlaylist(playlist.id)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {playlist.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Playlist
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreatePlaylist();
                }
              }}
              disabled={isCreating}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePlaylist} disabled={isCreating || !newPlaylistName.trim()}>
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
    </>
  );
};
