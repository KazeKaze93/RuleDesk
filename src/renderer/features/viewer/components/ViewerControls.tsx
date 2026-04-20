import { useCallback, useLayoutEffect, useState } from "react";
import type { MutableRefObject } from "react";
import log from "electron-log/renderer";
import {
  X,
  Heart,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Folder,
  Copy,
  RefreshCw,
  Bug,
  FileText,
  Tags,
  ExternalLink,
  Eye,
  List,
  Plus,
  Shuffle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "../../../components/ui/dropdown-menu";
import { Button } from "../../../components/ui/button";
import type { Post } from "../../../../main/db/schema";
import { cn } from "../../../lib/utils";
import { useViewerStore } from "../../../store/viewerStore";
import { useViewerController } from "../hooks/useViewerController";
import { QuickAddToPlaylistMenu } from "../../../components/playlists/QuickAddToPlaylistMenu";
import { ViewerMedia } from "./ViewerMedia";
import { TagsDrawer } from "./TagsDrawer";
import type { ViewerQueue } from "../../../store/viewerStore";
import type { ViewerKeyboardActionsRef } from "../types";

type ViewerControlsProps = {
  post: Post;
  queue: ViewerQueue | null;
  close: () => void;
  next: () => void;
  prev: () => void;
  controlsVisible: boolean;
  toggleTagsDrawer: () => void;
  isTagsDrawerOpen: boolean;
  keyboardActionsRef: MutableRefObject<ViewerKeyboardActionsRef>;
};

export function ViewerControls({
  post,
  queue,
  close,
  next,
  prev,
  controlsVisible,
  toggleTagsDrawer,
  isTagsDrawerOpen,
  keyboardActionsRef,
}: ViewerControlsProps) {
  const ctrl = useViewerController({ post, queue });
  const isDeveloperMode = true;
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const isRandom = queue && "isRandom" in queue ? queue.isRandom ?? false : false;
  const setQueueIsRandom = useViewerStore((state) => state.setQueueIsRandom);

  const handleToggleRandom = useCallback(() => {
    const newIsRandom = !isRandom;
    setQueueIsRandom(newIsRandom);
  }, [isRandom, setQueueIsRandom]);

  const handleToggleFavorite = useCallback(async () => {
    await ctrl.toggleFavorite();
  }, [ctrl]);

  const handleMarkViewed = useCallback(async () => {
    if (post.isViewed) return;
    window.api.markPostAsViewed(post.id).catch((err) => {
      const errorCode = (err as { code?: string })?.code;
      if (errorCode === "RATE_LIMIT") {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[ViewerControls] Failed to mark post as viewed:", errorMessage);
    });
  }, [post]);

  const onToggleFavoriteForKeyboard = useCallback(() => {
    void handleToggleFavorite();
    setAnnouncement(
      post.isFavorited ? "Removed from favorites" : "Added to favorites"
    );
    setTimeout(() => setAnnouncement(""), 3000);
  }, [handleToggleFavorite, post.isFavorited]);

  const onMarkViewedForKeyboard = useCallback(() => {
    void handleMarkViewed();
    setAnnouncement("Marked as viewed");
    setTimeout(() => setAnnouncement(""), 3000);
  }, [handleMarkViewed]);

  useLayoutEffect(() => {
    keyboardActionsRef.current = {
      onToggleFavorite: onToggleFavoriteForKeyboard,
      onMarkViewed: onMarkViewedForKeyboard,
    };
    return () => {
      keyboardActionsRef.current = {};
    };
  }, [keyboardActionsRef, onToggleFavoriteForKeyboard, onMarkViewedForKeyboard]);

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <ViewerMedia post={post} />

      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 bg-gradient-to-b from-black/80 to-transparent transition-transform duration-300",
          !controlsVisible && "-translate-y-full"
        )}
      >
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="text-white rounded-full hover:bg-white/10"
            aria-label="Close viewer"
            title="Close viewer (Escape)"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className="text-white rounded-full hover:bg-white/10"
            aria-label={ctrl.isFavorited ? "Remove from favorites" : "Add to favorites"}
            title="Toggle Favorite (F)"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                ctrl.isFavorited ? "text-red-500 fill-red-500" : "text-white"
              )}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleMarkViewed}
            className="text-white rounded-full hover:bg-white/10"
            aria-label={post.isViewed ? "Mark as unviewed" : "Mark as viewed"}
            title="Mark as Viewed (V)"
          >
            <Eye
              className={cn(
                "w-5 h-5 transition-colors",
                post.isViewed ? "text-primary fill-primary" : "text-white"
              )}
            />
          </Button>

          <Button
            variant={isRandom ? "default" : "ghost"}
            size="icon"
            onClick={handleToggleRandom}
            className={cn(
              "text-white rounded-full hover:bg-white/10",
              isRandom && "bg-primary hover:bg-primary/90"
            )}
            aria-label={isRandom ? "Disable randomization" : "Enable randomization"}
            title={
              isRandom
                ? "Randomization enabled (click to disable)"
                : "Randomization disabled (click to enable)"
            }
          >
            <Shuffle className={cn("w-5 h-5", isRandom && "fill-current")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylistDialog(true);
            }}
            className="text-white rounded-full hover:bg-white/10"
            aria-label="Add to Playlist"
            title="Add to Playlist"
          >
            <Plus className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={ctrl.downloadImage}
            disabled={ctrl.isCurrentlyDownloading}
            className="overflow-hidden relative text-white rounded-full hover:bg-white/10 group"
            aria-label={
              ctrl.isCurrentlyDownloading
                ? `Downloading: ${ctrl.downloadProgress}%`
                : "Download original image"
            }
            title={
              ctrl.isCurrentlyDownloading
                ? `Скачивание ${ctrl.downloadProgress}%`
                : "Download Original"
            }
          >
            {ctrl.isCurrentlyDownloading && (
              <div
                className="absolute inset-0 transition-all duration-100 bg-green-500/50"
                style={{ width: `${ctrl.downloadProgress}%` }}
              />
            )}

            {ctrl.isCurrentlyDownloading ? (
              <div className="flex relative z-10 items-center text-xs text-white/90">
                {ctrl.downloadProgress}%
              </div>
            ) : (
              <Download className="relative z-10 w-5 h-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white rounded-full hover:bg-white/10"
                aria-label="More options"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 text-white shadow-lg bg-neutral-900 border-white/10"
              sideOffset={8}
              align="end"
            >
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Copy className="mr-2 w-4 h-4" />
                  Copy...
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-48 text-white shadow-xl bg-neutral-900 border-white/10">
                    <DropdownMenuItem onClick={() => ctrl.handleCopyText(String(post.postId))}>
                      Copy post ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => ctrl.handleCopyText(ctrl.postPageUrl)}>
                      Copy post link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={!post.tags}
                      onClick={() => ctrl.handleCopyText(post.tags || "")}
                    >
                      Copy tags (all)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!ctrl.tagQuery}
                      onClick={() => ctrl.handleCopyText(ctrl.tagQuery)}
                    >
                      Copy tags (query)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => ctrl.handleCopyText(post.fileUrl)}>
                      Copy file URL
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Open</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => ctrl.handleOpenExternal(ctrl.postPageUrl)}>
                <ExternalLink className="mr-2 w-4 h-4" />
                Open post page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={ctrl.openFolder}>
                <Folder className="mr-2 w-4 h-4" />
                Reveal in folder
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={ctrl.downloadImage}>
                <Download className="mr-2 w-4 h-4" />
                Re-download original
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isDeveloperMode && (
                <>
                  <DropdownMenuLabel>Developer</DropdownMenuLabel>
                  <DropdownMenuItem onClick={ctrl.resetLocalCache}>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Reset local cache
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={ctrl.handleCopyMetadata}>
                    <FileText className="mr-2 w-4 h-4" />
                    Show metadata
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={ctrl.handleCopyDebugInfo}>
                    <Bug className="mr-2 w-4 h-4" />
                    Copy debug info
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-transform duration-300",
          !controlsVisible && "translate-y-full"
        )}
      >
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                post.rating === "e"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-green-500/20 text-green-400"
              )}
            >
              {post.rating === "s"
                ? "Safe"
                : post.rating === "q"
                  ? "Questionable"
                  : "Explicit"}
            </span>
            {post.publishedAt &&
              (() => {
                let date: Date;
                if (post.publishedAt instanceof Date) {
                  date = post.publishedAt;
                } else if (typeof post.publishedAt === "number") {
                  date = new Date(post.publishedAt);
                } else if (typeof post.publishedAt === "string") {
                  date = new Date(post.publishedAt);
                } else {
                  return null;
                }

                if (isNaN(date.getTime())) {
                  return null;
                }

                return (
                  <span className="text-xs text-white/70">
                    {date.toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                );
              })()}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTagsDrawer}
            className="gap-2 text-white bg-white/5 border-white/10 hover:bg-white/10"
            aria-label="Show tags"
            title="Show tags (T)"
          >
            <Tags className="w-4 h-4" />
            Tags
          </Button>
        </div>
      </div>

      <TagsDrawer
        post={post}
        isOpen={isTagsDrawerOpen}
        onOpenChange={toggleTagsDrawer}
        isFromBrowse={queue?.origin?.kind === "browse" || queue?.origin?.kind === "search"}
        queue={queue}
      />

      <Button
        type="button"
        variant="ghost"
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 h-auto p-4 text-white/50 hover:text-white",
          !controlsVisible && "opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        aria-label="Previous post"
        title="Previous post (Left Arrow)"
      >
        <ChevronLeft className="w-10 h-10 drop-shadow-md" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 h-auto p-4 text-white/50 hover:text-white",
          !controlsVisible && "opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        aria-label="Next post"
        title="Next post (Right Arrow)"
      >
        <ChevronRight className="w-10 h-10 drop-shadow-md" />
      </Button>

      {showPlaylistDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          onClick={() => setShowPlaylistDialog(false)}
        >
          <div
            className="bg-neutral-900 rounded-lg p-4 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <QuickAddToPlaylistMenu
              post={{ id: post.id, postId: post.postId }}
              trigger={
                <Button variant="outline" className="w-full mb-4">
                  <List className="mr-2 h-4 w-4" />
                  Select Playlists
                </Button>
              }
              onSuccess={() => setShowPlaylistDialog(false)}
            />
            <Button
              variant="ghost"
              onClick={() => setShowPlaylistDialog(false)}
              className="w-full mt-2"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
