// Cursor: select file:src/renderer/components/viewer/ViewerDialog.tsx
import { useEffect, useCallback, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { useViewerStore, ViewerOrigin } from "../../store/viewerStore";
import { Button } from "../ui/button";
import {
  X,
  Heart,
  Check,
  Download,
  ExternalLink,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Folder,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Bug,
  FileText,
  Tags, // 🔥 FIX: Вернул импорт иконки Tags
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
} from "../ui/dropdown-menu";

import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import type { Post } from "../../../main/db/schema";
import { cn } from "../../lib/utils";

// --- Хелперы ---

const useCurrentPost = (
  currentPostId: number | null,
  origin: ViewerOrigin | undefined
) => {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!currentPostId || !origin) return null;

    let queryKey: unknown[] = [];
    if (origin.kind === "artist") {
      queryKey = ["posts", origin.artistId];
    } else {
      return null;
    }

    const data = queryClient.getQueryData<InfiniteData<Post[]>>(queryKey);
    if (!data) return null;

    for (const page of data.pages) {
      const post = page.find((p) => p.id === currentPostId);
      if (post) return post;
    }
    return null;
  }, [currentPostId, origin, queryClient]);
};

// --- Под-компонент для Медиа ---
const ViewerMedia = ({ post }: { post: Post }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const isVideo =
    post.fileUrl.endsWith(".mp4") || post.fileUrl.endsWith(".webm");

  useEffect(() => {
    const handleMediaKeys = (e: KeyboardEvent) => {
      if (e.key === " ") {
        if (document.activeElement?.tagName === "VIDEO") {
          return;
        }
        e.preventDefault();
        setIsVideoPlaying((v) => !v);
      }
    };
    window.addEventListener("keydown", handleMediaKeys);
    return () => window.removeEventListener("keydown", handleMediaKeys);
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isVideo) {
      if (e.target instanceof HTMLVideoElement) return;
      setIsVideoPlaying((v) => !v);
      return;
    }
    setIsZoomed(!isZoomed);
  };

  return (
    <div
      className="flex relative justify-center items-center pb-20 w-full h-full cursor-default"
      onClick={handleContainerClick}
    >
      {isVideo ? (
        <video
          src={post.fileUrl}
          className="object-contain max-w-full max-h-full outline-none focus:outline-none"
          autoPlay={isVideoPlaying}
          loop
          controls
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
          ref={(el) => {
            if (el) {
              if (isVideoPlaying && el.paused) el.play().catch(() => {});
              else if (!isVideoPlaying && !el.paused) el.pause();
            }
          }}
        />
      ) : (
        <img
          src={isZoomed ? post.fileUrl : post.sampleUrl || post.fileUrl}
          alt={`Post ${post.id}`}
          className={cn(
            "transition-all duration-300 ease-out",
            isZoomed
              ? "max-w-none max-h-none cursor-zoom-out"
              : "object-contain max-w-full max-h-full cursor-zoom-in"
          )}
        />
      )}
    </div>
  );
};

// --- Новый компонент: Контейнер для логики, зависящей от поста (Post-Scoped) ---

const ViewerDialogPostScope = ({
  post,
  queue,
  close,
  next,
  prev,
  controlsVisible,
}: {
  post: Post;
  queue: { ids: number[]; origin: ViewerOrigin | undefined } | null;
  close: () => void;
  next: () => void;
  prev: () => void;
  controlsVisible: boolean;
}) => {
  const queryClient = useQueryClient();

  // --- ЛОКАЛЬНЫЙ СТЕЙТ ДЛЯ КНОПОК ---
  const [isFavorited, setIsFavorited] = useState(post.isFavorited);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);

  // Предполагаем, что режим разработчика включен
  const isDeveloperMode = true;

  // --- ЭФФЕКТ ДЛЯ ПОДПИСКИ НА ПРОГРЕСС ЗАГРУЗКИ ---
  useEffect(() => {
    const filenameId = `${post.artistId}_${post.postId}.${
      post.fileUrl.split(".").pop() || "jpg"
    }`;

    const unsubscribe = window.api.onDownloadProgress((data) => {
      if (data.id !== filenameId) return;

      if (data.percent > 0 && data.percent < 100) {
        setIsDownloading(true);
        setDownloadProgress(data.percent);
      } else if (data.percent === 100) {
        setIsDownloading(false);
        setDownloadProgress(0);
      } else if (data.percent === 0) {
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [post.artistId, post.postId, post.fileUrl]);

  // --- ХЕНДЛЕРЫ ---

  const toggleFavorite = async () => {
    const previousState = isFavorited;
    setIsFavorited(!previousState);

    try {
      const newState = await window.api.togglePostFavorite(post.id);
      setIsFavorited(newState);

      // OPTIMISTIC UPDATE FOR FAVORITE
      const queryKey = ["posts", post.artistId];
      queryClient.setQueryData<InfiniteData<Post[]>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((p) =>
              p.id === post.id ? { ...p, isFavorited: newState } : p
            )
          ),
        };
      });
    } catch (error) {
      setIsFavorited(previousState);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to toggle favorite:", errorMessage);
      alert(`Error toggling favorite: ${errorMessage}`);
    }
  };

  const downloadImage = async () => {
    if (isDownloading) return;

    setDownloadProgress(1);

    try {
      const ext = post.fileUrl.split(".").pop() || "jpg";
      const filename = `${post.artistId}_${post.postId}.${ext}`;

      const result = await window.api.downloadFile(post.fileUrl, filename);

      if (result && result.success && result.path) {
        setDownloadPath(result.path);
      } else if (result && result.canceled) {
        // Отмена
      } else {
        alert(`Download failed: ${result?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Download failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Download failed: ${errorMessage}`);
      setDownloadProgress(0);
    }
  };

  const openFolder = async () => {
    const path = downloadPath || "";
    await window.api.openFileInFolder(path);
  };

  const tagsToQuery = (t: string | null | undefined) => {
    if (!t) return "";
    return t.trim().split(/\s+/g).filter(Boolean).join("+");
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log(`Copied: ${text}`);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const handleOpenExternal = (url: string) => {
    if (!url) return;
    window.api.openExternal(url);
  };

  const resetLocalCache = () => {
    console.log(`Attempting to reset local cache for Post ID: ${post.id}`);
    window.api.resetPostCache(post.id);
  };

  // Optimistic Update для Viewed Status
  const toggleViewed = async () => {
    const queryKey = ["posts", post.artistId];

    queryClient.setQueryData<InfiniteData<Post[]>>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) =>
          page.map((p) =>
            p.id === post.id ? { ...p, isViewed: !p.isViewed } : p
          )
        ),
      };
    });

    try {
      await window.api.togglePostViewed(post.id);
    } catch (error) {
      console.error("Failed to toggle viewed status:", error);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const isCurrentlyDownloading =
    isDownloading && downloadProgress > 0 && downloadProgress < 100;

  const postPageUrl = `https://rule34.xxx/index.php?page=post&s=view&id=${post.postId}`;
  const tagQuery = tagsToQuery(post.tags);
  const hasDownloadedFile = !!downloadPath;

  return (
    <>
      <ViewerMedia post={post} />

      {/* --- TOP BAR --- */}
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
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="flex flex-col text-white">
            <span className="text-sm font-bold opacity-90">
              Post #{post.postId}
            </span>
            <span className="text-xs opacity-60">
              {queue
                ? `${queue.ids.indexOf(post.id) + 1} / ${queue.ids.length}`
                : ""}
            </span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-white rounded-full hover:bg-white/10"
            title="Viewed Status"
          >
            <Check
              className={cn("w-5 h-5", post.isViewed && "text-green-500")}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className="text-white rounded-full hover:bg-white/10"
            title="Toggle Favorite"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                isFavorited ? "text-red-500 fill-red-500" : "text-white"
              )}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={downloadImage}
            disabled={isCurrentlyDownloading}
            className="overflow-hidden relative text-white rounded-full hover:bg-white/10 group"
            title={
              isCurrentlyDownloading
                ? `Скачивание ${downloadProgress}%`
                : "Download Original"
            }
          >
            {isCurrentlyDownloading && (
              <div
                className="absolute inset-0 transition-all duration-100 bg-green-500/50"
                style={{ width: `${downloadProgress}%` }}
              />
            )}

            {isCurrentlyDownloading ? (
              <div className="flex relative z-10 items-center text-xs text-white/90">
                {downloadProgress}%
              </div>
            ) : (
              <Download className="relative z-10 w-5 h-5" />
            )}
          </Button>

          {/* --- МЕНЮ ТРОЕТОЧИЯ --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white rounded-full hover:bg-white/10"
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
                    <DropdownMenuItem
                      onClick={() => handleCopyText(String(post.postId))}
                    >
                      Copy post ID
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCopyText(postPageUrl)}
                    >
                      Copy post link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={!post.tags}
                      onClick={() => handleCopyText(post.tags || "")}
                    >
                      Copy tags (all)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!tagQuery}
                      onClick={() => handleCopyText(tagQuery)}
                    >
                      Copy tags (query)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleCopyText(post.fileUrl)}
                    >
                      Copy file URL
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Open</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenExternal(postPageUrl)}>
                <ExternalLink className="mr-2 w-4 h-4" />
                Open post page
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={openFolder}
                disabled={!hasDownloadedFile}
              >
                <Folder className="mr-2 w-4 h-4" />
                Reveal in folder
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={toggleViewed}>
                {post.isViewed ? (
                  <EyeOff className="mr-2 w-4 h-4" />
                ) : (
                  <Eye className="mr-2 w-4 h-4" />
                )}
                Mark as {post.isViewed ? "unviewed" : "viewed"}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={downloadImage}>
                <Download className="mr-2 w-4 h-4" />
                Re-download original
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isDeveloperMode && (
                <>
                  <DropdownMenuLabel>Developer</DropdownMenuLabel>
                  <DropdownMenuItem onClick={resetLocalCache}>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Reset local cache
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log("Show Metadata")}
                  >
                    <FileText className="mr-2 w-4 h-4" />
                    Show metadata
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log("Copy Debug Info")}
                  >
                    <Bug className="mr-2 w-4 h-4" />
                    Copy debug info
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* --- BOTTOM BAR --- */}
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
          </div>
        </div>

        <div className="flex gap-3 items-center">
          {/* 🔥 FIX: Вернул кнопку Tags, удалил только Original */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-white bg-white/5 border-white/10 hover:bg-white/10"
            title="Show tags"
          >
            <Tags className="w-4 h-4" />
            Tags
          </Button>
        </div>
      </div>

      {/* --- NAV ARROWS --- */}
      <button
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors outline-none",
          !controlsVisible && "opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
      >
        <ChevronLeft className="w-10 h-10 drop-shadow-md" />
      </button>

      <button
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors outline-none",
          !controlsVisible && "opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
      >
        <ChevronRight className="w-10 h-10 drop-shadow-md" />
      </button>
    </>
  );
};

// --- Основной Компонент (Обертка) ---

export const ViewerDialog = () => {
  const {
    isOpen,
    close,
    currentPostId,
    queue,
    next,
    prev,
    controlsVisible,
    setControlsVisible,
  } = useViewerStore();

  const post = useCurrentPost(currentPostId, queue?.origin);

  // Клавиатура (перенесена на ViewerDialog)
  const handleNavigationKeys = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    },
    [isOpen, next, prev, close]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleNavigationKeys);
    return () => window.removeEventListener("keydown", handleNavigationKeys);
  }, [handleNavigationKeys]);

  // Управление видимостью контролов (перенесена на ViewerDialog)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 2000);
    };

    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      setControlsVisible(true);
      timeout = setTimeout(() => setControlsVisible(false), 2000);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isOpen, setControlsVisible]);

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="
          fixed inset-0 left-0 top-0 translate-x-0 translate-y-0
          z-50 flex flex-col
          w-screen h-screen max-w-none
          p-0 m-0 gap-0
          border-none bg-transparent shadow-none outline-none
          sm:rounded-none
          [&>button]:hidden
        "
      >
        {/* Слой 1: Блюр-фон (pointer-events-none, чтобы UI был кликабелен) */}
        <div className="absolute inset-0 backdrop-blur-md pointer-events-none bg-black/60" />

        {/* Слой 2: UI Контент (резкий) */}
        <div className="flex relative z-10 flex-col justify-center items-center w-full h-full">
          <DialogTitle className="sr-only">Viewer</DialogTitle>

          <ViewerDialogPostScope
            key={post.id}
            post={post}
            queue={queue}
            close={close}
            next={next}
            prev={prev}
            controlsVisible={controlsVisible}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
