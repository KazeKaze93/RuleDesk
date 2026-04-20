import { useEffect, useState } from "react";
import log from "electron-log/renderer";
import { FileText, RefreshCw } from "lucide-react";
import type { Post } from "../../../../main/db/schema";
import { Button } from "../../../components/ui/button";
import { isVideoPost } from "../../../lib/filter-utils";
import { cn } from "../../../lib/utils";
import {
  useSafeModeStore,
  shouldBlurPost,
  getEffectiveBlurAmount,
} from "../../../store/safeModeStore";

export function ViewerMedia({ post }: { post: Post }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const { safeMode, panicMode, blurAmount } = useSafeModeStore();

  const normalizedRating: "s" | "q" | "e" =
    post.rating === "q" || post.rating === "e" ? post.rating : "s";
  const shouldBlur = shouldBlurPost(normalizedRating, safeMode, panicMode);
  const effectiveBlur = getEffectiveBlurAmount(safeMode, panicMode, blurAmount);

  const isVideo = isVideoPost(post.fileUrl);

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
      className="flex relative justify-center items-center pb-20 w-full h-full cursor-default overflow-auto"
      onClick={handleContainerClick}
    >
      {isVideo ? (
        videoError ? (
          <div className="flex flex-col gap-4 justify-center items-center w-full h-full text-muted-foreground">
            <FileText className="w-16 h-16 opacity-50" />
            <div className="text-center">
              <p className="text-lg font-semibold">Failed to load video</p>
              <p className="text-sm">The video file could not be loaded.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setVideoError(false);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              filter: shouldBlur ? `blur(${effectiveBlur}px)` : undefined,
            }}
          >
            <video
              src={post.fileUrl}
              className="object-contain max-w-full max-h-full outline-none focus:outline-none"
              autoPlay={isVideoPlaying}
              loop
              controls
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onError={() => {
                log.error("[ViewerMedia] Video load error:", post.fileUrl);
                setVideoError(true);
              }}
              ref={(el) => {
                if (el) {
                  if (isVideoPlaying && el.paused) el.play().catch(() => {});
                  else if (!isVideoPlaying && !el.paused) el.pause();
                }
              }}
            />
          </div>
        )
      ) : imageError ? (
        <div className="flex flex-col gap-4 justify-center items-center w-full h-full text-muted-foreground">
          <FileText className="w-16 h-16 opacity-50" />
          <div className="text-center">
            <p className="text-lg font-semibold">Failed to load image</p>
            <p className="text-sm">The image file could not be loaded.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setImageError(false);
                setHasTriedFallback(false);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <img
          key={`${post.id}-${hasTriedFallback}`}
          src={
            isZoomed
              ? post.fileUrl
              : hasTriedFallback
                ? post.fileUrl
                : post.sampleUrl || post.fileUrl
          }
          alt={`Post ${post.id}`}
          className={cn(
            "transition-all duration-300 ease-out",
            isZoomed
              ? "max-w-none max-h-none cursor-zoom-out"
              : "object-contain max-w-full max-h-full cursor-zoom-in"
          )}
          onError={(e) => {
            log.error("[ViewerMedia] Image load error:", post.fileUrl);

            if (!hasTriedFallback && post.fileUrl) {
              setHasTriedFallback(true);
              e.currentTarget.src = post.fileUrl;
            } else {
              setImageError(true);
            }
          }}
        />
      )}
    </div>
  );
}
