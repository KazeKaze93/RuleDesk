import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import log from "electron-log/renderer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlaylists } from "../../lib/hooks/usePlaylists";
import type { Playlist } from "@shared/types/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

type PostRef = { id: number; postId: number };

const invalidateAfterMembershipChange = (
  queryClient: ReturnType<typeof useQueryClient>,
  postIds: number[],
  touchedPlaylistIds: number[]
) => {
  for (const pid of postIds) {
    queryClient.invalidateQueries({ queryKey: ["playlist-entries", pid] });
  }
  queryClient.invalidateQueries({ queryKey: ["playlists"] });
  queryClient.invalidateQueries({ queryKey: ["playlist-entries"] });
  for (const pl of touchedPlaylistIds) {
    queryClient.invalidateQueries({ queryKey: ["playlist-posts", pl] });
  }
  queryClient.invalidateQueries({ queryKey: ["playlist-posts"] });
};

export interface AddToPlaylistModalProps {
  /** Posts to set manual playlist membership for (resolved to DB ids before save). */
  posts: PostRef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** If set, this element receives focus when the dialog closes (e.g. viewer toolbar). */
  focusReturnRef?: React.RefObject<HTMLElement | null>;
  title?: string;
  description?: string;
  className?: string;
  overlayClassName?: string;
}

/**
 * Modal with checkboxes for all manual playlists. On confirm, syncs membership in one transaction.
 */
export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  posts,
  open,
  onOpenChange,
  onSuccess,
  focusReturnRef,
  title = "Add to playlist",
  description,
  className,
  overlayClassName,
}) => {
  const [resolvedPostIds, setResolvedPostIds] = useState<number[]>([]);
  const [isResolvingPosts, setIsResolvingPosts] = useState(false);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<number>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const initSelectionRef = useRef(false);
  const sessionKeyRef = useRef("");

  const { data: allPlaylists = [], isLoading: isLoadingPlaylists } = usePlaylists({
    enabled: open,
  });
  const manualPlaylists = allPlaylists.filter((p: Playlist) => !p.isSmart);
  const manualIdSet = useMemo(() => new Set(manualPlaylists.map((p) => p.id)), [manualPlaylists]);

  const isBulk = posts.length > 1;
  const defaultDescription = isBulk
    ? `Choose which playlists should contain all ${posts.length} selected posts.`
    : "Choose which playlists should include this post.";

  const resetLocalState = useCallback(() => {
    setResolvedPostIds([]);
    setSelectedPlaylistIds(new Set());
    setIsCreateOpen(false);
    setNewPlaylistName("");
  }, []);

  useEffect(() => {
    if (!open) {
      resetLocalState();
      initSelectionRef.current = false;
      sessionKeyRef.current = "";
    }
  }, [open, resetLocalState]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setIsResolvingPosts(true);
    void (async () => {
      try {
        const ids: number[] = [];
        for (const p of posts) {
          if (p.id > 0) {
            ids.push(p.id);
            continue;
          }
          if (p.postId > 0) {
            const inserted = await window.api.shadowInsertPost({
              postId: p.postId,
              provider: "rule34",
            });
            ids.push(inserted.id);
            continue;
          }
          log.error("[AddToPlaylistModal] Post has no valid id for playlist sync");
        }
        if (!cancelled) {
          setResolvedPostIds(ids);
        }
      } catch (e) {
        log.error("[AddToPlaylistModal] Failed to resolve post ids:", e);
        if (!cancelled) {
          setResolvedPostIds([]);
        }
      } finally {
        if (!cancelled) {
          setIsResolvingPosts(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, posts]);

  const n = resolvedPostIds.length;
  const sortedKey = useMemo(
    () => resolvedPostIds.slice().sort((a, b) => a - b).join(","),
    [resolvedPostIds]
  );

  const { data: singleContaining = [], isFetching: isFetchingSingle } = useQuery({
    queryKey: ["manual-plist-single", sortedKey] as const,
    queryFn: async (): Promise<number[]> => {
      if (isBulk || n !== 1) {
        return [];
      }
      const only = resolvedPostIds[0];
      if (only == null) {
        return [];
      }
      return await window.api.getPlaylistsContainingPost(only);
    },
    enabled: open && !isResolvingPosts && n === 1 && !isBulk,
  });

  const { data: bulkRows = [], isFetching: isFetchingBulk } = useQuery({
    queryKey: ["manual-plist-bulk", sortedKey] as const,
    queryFn: async (): Promise<{ playlistId: number; matchCount: number }[]> => {
      if (!isBulk || n < 1) {
        return [];
      }
      return await window.api.getManualPlaylistMembershipForPosts({
        postIds: resolvedPostIds,
      });
    },
    enabled: open && !isResolvingPosts && isBulk && n > 0,
  });

  const isFetchingMembership = isBulk ? isFetchingBulk : isFetchingSingle;

  useEffect(() => {
    if (!open || isResolvingPosts || n === 0 || isFetchingMembership) {
      return;
    }
    const key = `${isBulk ? "B" : "S"}|${sortedKey}|${manualIdSet.size}`;
    if (key !== sessionKeyRef.current) {
      initSelectionRef.current = false;
      sessionKeyRef.current = key;
    }
    if (initSelectionRef.current) {
      return;
    }
    if (isBulk) {
      const m = new Map(bulkRows.map((r) => [r.playlistId, r.matchCount] as const));
      const next = new Set<number>();
      for (const pl of manualPlaylists) {
        const c = m.get(pl.id) ?? 0;
        if (c === n) {
          next.add(pl.id);
        }
      }
      setSelectedPlaylistIds(next);
    } else {
      const inManual = new Set(
        singleContaining.filter((pid) => manualIdSet.has(pid))
      );
      setSelectedPlaylistIds(inManual);
    }
    initSelectionRef.current = true;
  }, [
    open,
    isResolvingPosts,
    n,
    isFetchingMembership,
    isBulk,
    sortedKey,
    bulkRows,
    manualPlaylists,
    singleContaining,
    manualIdSet,
  ]);

  const matchCount = useCallback(
    (playlistId: number) => bulkRows.find((r) => r.playlistId === playlistId)?.matchCount ?? 0,
    [bulkRows]
  );

  const getCheckboxState = (playlistId: number): boolean | "indeterminate" => {
    if (!isBulk) {
      return selectedPlaylistIds.has(playlistId);
    }
    const c = matchCount(playlistId);
    if (selectedPlaylistIds.has(playlistId)) {
      return true;
    }
    if (c > 0 && c < n) {
      return "indeterminate";
    }
    return false;
  };

  const toggle = (playlistId: number) => {
    setSelectedPlaylistIds((prev) => {
      const next = new Set(prev);
      if (!isBulk) {
        if (next.has(playlistId)) {
          next.delete(playlistId);
        } else {
          next.add(playlistId);
        }
        return next;
      }
      const c = matchCount(playlistId);
      if (c > 0 && c < n) {
        next.add(playlistId);
        return next;
      }
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (n === 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      const manualIds = [...selectedPlaylistIds].filter((id) => manualIdSet.has(id));
      await window.api.syncManualPlaylistMembership({
        postIds: resolvedPostIds,
        manualPlaylistIds: manualIds,
      });
      const touched = new Set(manualPlaylists.map((p) => p.id));
      invalidateAfterMembershipChange(queryClient, resolvedPostIds, [...touched]);
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      log.error("[AddToPlaylistModal] syncManualPlaylistMembership failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) {
      return;
    }
    setIsCreating(true);
    try {
      const created = await window.api.createPlaylist({
        name,
        isSmart: false,
        queryJson: "",
        iconName: "",
      });
      setNewPlaylistName("");
      setIsCreateOpen(false);
      const desired = [
        ...new Set(
          [...[...selectedPlaylistIds].filter((id) => manualIdSet.has(id)), created.id]
        ),
      ];
      if (n > 0) {
        await window.api.syncManualPlaylistMembership({
          postIds: resolvedPostIds,
          manualPlaylistIds: desired,
        });
      }
      setSelectedPlaylistIds(new Set(desired));
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      if (n > 0) {
        const touched = [...new Set([...manualPlaylists.map((p) => p.id), created.id])];
        invalidateAfterMembershipChange(queryClient, resolvedPostIds, touched);
      }
      onSuccess?.();
    } catch (e) {
      log.error("[AddToPlaylistModal] createPlaylist failed:", e);
    } finally {
      setIsCreating(false);
    }
  };

  const showLoading =
    isLoadingPlaylists || isResolvingPosts || (n > 0 && isFetchingMembership);
  const canConfirm = n > 0 && !isSubmitting;

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={overlayClassName}
        className={cn("sm:max-w-md gap-3", className)}
        onCloseAutoFocus={(e) => {
          if (focusReturnRef?.current) {
            e.preventDefault();
            focusReturnRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {showLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : n === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No valid posts to add to playlists.
          </p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {manualPlaylists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No manual playlists yet
              </p>
            ) : (
              manualPlaylists.map((pl) => {
                const state = getCheckboxState(pl.id);
                return (
                  <div key={pl.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`pl-${pl.id}`}
                      checked={state}
                      onCheckedChange={() => toggle(pl.id)}
                    />
                    <Label
                      htmlFor={`pl-${pl.id}`}
                      className="text-sm font-normal leading-none flex-1 cursor-pointer"
                    >
                      {pl.name}
                      {isBulk && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({matchCount(pl.id)}/{n})
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsCreateOpen((v) => !v)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new playlist
            </Button>

            {isCreateOpen && (
              <div className="flex flex-col gap-2 pt-1">
                <Input
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isCreating) {
                      void handleCreatePlaylist();
                    }
                  }}
                  disabled={isCreating}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setNewPlaylistName("");
                    }}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleCreatePlaylist()}
                    disabled={isCreating || !newPlaylistName.trim()}
                  >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create and add"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};