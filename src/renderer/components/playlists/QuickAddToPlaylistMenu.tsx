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
import type { Playlist } from "../../../main/db/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface QuickAddToPlaylistMenuProps {
  postId: number;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const QuickAddToPlaylistMenu: React.FC<QuickAddToPlaylistMenuProps> = ({
  postId,
  trigger,
  onSuccess,
}) => {
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all playlists
  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: async () => {
      return await window.api.getPlaylists();
    },
  });

  // Fetch which playlists this post is already in
  const { data: existingPlaylistIds = [] } = useQuery<number[]>({
    queryKey: ["playlist-entries", postId],
    queryFn: async () => {
      // Get all playlists and check which ones contain this post
      const allPlaylists = await window.api.getPlaylists();
      const postPlaylists: number[] = [];

      for (const playlist of allPlaylists) {
        try {
          const posts = await window.api.getPlaylistPosts({
            playlistId: playlist.id,
            page: 1,
            limit: 1000, // Get all posts to check membership
          });
          if (posts.some((p) => p.id === postId)) {
            postPlaylists.push(playlist.id);
          }
        } catch (error) {
          log.error(`[QuickAddToPlaylistMenu] Failed to check playlist ${playlist.id}:`, error);
        }
      }

      return postPlaylists;
    },
    enabled: playlists.length > 0,
  });

  // Initialize selected playlists with existing ones
  useEffect(() => {
    if (existingPlaylistIds.length > 0) {
      setSelectedPlaylistIds(new Set(existingPlaylistIds));
    }
  }, [existingPlaylistIds]);

  const handleTogglePlaylist = (playlistId: number) => {
    const newSet = new Set(selectedPlaylistIds);
    if (newSet.has(playlistId)) {
      newSet.delete(playlistId);
    } else {
      newSet.add(playlistId);
    }
    setSelectedPlaylistIds(newSet);
  };

  const handleSave = async () => {
    if (selectedPlaylistIds.size === 0) {
      return;
    }

    try {
      await window.api.addPostsToPlaylist({
        playlistIds: Array.from(selectedPlaylistIds),
        postIds: [postId],
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["playlist-entries", postId] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });

      onSuccess?.();
    } catch (error) {
      log.error("[QuickAddToPlaylistMenu] Failed to add post to playlists:", error);
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
        description: "",
      });

      // Add to selected playlists and immediately add post
      const newSet = new Set(selectedPlaylistIds);
      newSet.add(newPlaylist.id);
      setSelectedPlaylistIds(newSet);

      // Add post to the new playlist
      await window.api.addPostsToPlaylist({
        playlistIds: [newPlaylist.id],
        postIds: [postId],
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["playlist-entries", postId] });

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || defaultTrigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Add to Playlist</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading ? (
            <div className="flex items-center justify-center px-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No playlists yet
            </div>
          ) : (
            <>
              {playlists.map((playlist) => (
                <DropdownMenuCheckboxItem
                  key={playlist.id}
                  checked={selectedPlaylistIds.has(playlist.id)}
                  onCheckedChange={() => handleTogglePlaylist(playlist.id)}
                  disabled={playlist.isSmart}
                  title={
                    playlist.isSmart
                      ? "Smart playlists cannot be manually edited"
                      : undefined
                  }
                >
                  {playlist.name}
                  {playlist.isSmart && (
                    <span className="ml-2 text-xs text-muted-foreground">(Smart)</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Playlist
              </DropdownMenuItem>
              {selectedPlaylistIds.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSave}>
                    Save ({selectedPlaylistIds.size})
                  </DropdownMenuItem>
                </>
              )}
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
