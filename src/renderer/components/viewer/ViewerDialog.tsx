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
  Tags,
  ChevronLeft,
  ChevronRight,
  Folder,
} from "lucide-react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import type { Post } from "../../../main/db/schema";
import { cn } from "../../lib/utils";

// --- Хелперы  ---

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

// --- Основной Компонент ---

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

  // --- ЛОКАЛЬНЫЙ СТЕЙТ ДЛЯ КНОПОК ---
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);

  useEffect(() => {
    if (!post) return; // Отключаем ESLint: Нам нужно синхронизировать локальное состояние с новым постом, // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

    setIsFavorited(!!post.isFavorited);

    setIsDownloading(false);
    setDownloadProgress(0);
    setDownloadPath(null);
  }, [post]);

  useEffect(() => {
    if (!post) return;
    const filenameId = `${post.artistId}_${post.postId}.${
      post.fileUrl.split(".").pop() || "jpg"
    }`;

    const unsubscribe = window.api.onDownloadProgress((data) => {
      if (data.id === filenameId) {
        setDownloadProgress(data.percent);

        if (data.percent > 0 && data.percent < 100) {
          setIsDownloading(true);
        } else if (data.percent === 100) {
          setIsDownloading(false);
          setDownloadProgress(0);
        } else if (data.percent === 0) {
          setIsDownloading(false);
          setDownloadProgress(0);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [post, setDownloadProgress, setIsDownloading]);

  // Логика Лайка
  const toggleFavorite = async () => {
    if (!post) return;
    const previousState = isFavorited;
    setIsFavorited(!previousState);

    try {
      const newState = await window.api.togglePostFavorite(post.id);
      setIsFavorited(newState);
    } catch (error) {
      setIsFavorited(previousState);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to toggle favorite:", errorMessage);
      alert(`Error toggling favorite: ${errorMessage}`);
    }
  };

  // Логика Скачивания
  const downloadImage = async () => {
    if (!post || isDownloading) return;

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

  // Логика Открытия папки
  const openFolder = async () => {
    const path = downloadPath || "";
    await window.api.openFileInFolder(path);
  };

  // Управление видимостью контролов
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

  // Клавиатура (без изменений)
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

  if (!post) return null;

  const isCurrentlyDownloading =
    isDownloading && downloadProgress > 0 && downloadProgress < 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex overflow-hidden flex-col justify-center items-center p-0 m-0 w-screen h-screen max-w-[100vw] border-none outline-none bg-background/95 backdrop-blur-md [&>button]:hidden">
        <DialogTitle className="sr-only">Viewer</DialogTitle>

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
                  ? `${queue.ids.indexOf(post.id) + 1} of ${queue.ids.length}`
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

            {/* --- КНОПКА СКАЧАТЬ (с индикатором прогресса) --- */}
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
              {/* Прогресс-бар поверх кнопки */}
              {isCurrentlyDownloading && (
                <div
                  className="absolute inset-0 transition-all duration-100 bg-green-500/50" // Убрал анимацию, чтобы видеть плавный рост
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

            {/* --- КНОПКА ОТКРЫТЬ ПАПКУ --- */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openFolder}
              className={cn(
                "text-white rounded-full transition-colors hover:bg-white/10",
                downloadPath
                  ? "text-green-400 hover:bg-green-500/20"
                  : "text-white"
              )}
              title={
                downloadPath
                  ? "Открыть скачанный файл"
                  : "Открыть папку загрузок"
              }
            >
              <Folder className="w-5 h-5" />
            </Button>

            {/* --- КНОПКА МЕНЮ --- */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white rounded-full hover:bg-white/10"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <ViewerMedia key={post.id} post={post} />

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
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-white bg-white/5 border-white/10 hover:bg-white/10"
              title="Show tags"
            >
              <Tags className="w-4 h-4" />
              Tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-white bg-white/5 border-white/10 hover:bg-white/10"
              onClick={() =>
                window.api.openExternal(
                  `https://rule34.xxx/index.php?page=post&s=view&id=${post.postId}`
                )
              }
            >
              <ExternalLink className="w-4 h-4" />
              Original
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
      </DialogContent>
    </Dialog>
  );
};
