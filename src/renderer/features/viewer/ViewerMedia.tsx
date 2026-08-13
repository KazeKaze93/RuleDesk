import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import log from "electron-log/renderer";
import type { Post } from "@shared/types/db";
import { Button } from "../../components/ui/button";
import { FileText, RefreshCw } from "lucide-react";
import { normalizeRating } from "../../../shared/utils/post-normalization";
import { useSafeModeStore, shouldBlurPost, getEffectiveBlurAmount } from "../../store/safeModeStore";
import { cn } from "../../lib/utils";
import { isVideoPost } from "../../lib/filter-utils";
import { useVideoProxyUrl } from "../../lib/hooks/useVideoProxyUrl";
import { buildViewerFullImageChain } from "./viewer-media-urls";

export const ViewerMedia = ({
  post,
  onBackgroundClick,
}: {
  post: Post;
  onBackgroundClick: () => void;
}) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const isVideo = isVideoPost(post.fileUrl);
  const fullImageChain = useMemo(() => buildViewerFullImageChain(post), [post]);
  const [fileUrlIndex, setFileUrlIndex] = useState(0);
  const imageDisplaySrc = fullImageChain[fileUrlIndex] ?? post.fileUrl;
  const { safeMode, panicMode, blurAmount } = useSafeModeStore(
    useShallow((s) => ({
      safeMode: s.safeMode,
      panicMode: s.panicMode,
      blurAmount: s.blurAmount,
    })),
  );

  // Reset fallback flag when post changes
  // Use key prop on img element instead of useEffect to avoid cascading renders
  // Key change forces React to remount component, resetting state naturally
  const normalizedRating = normalizeRating(post.rating);
  const shouldBlur = shouldBlurPost(normalizedRating, safeMode, panicMode);
  const effectiveBlur = getEffectiveBlurAmount(safeMode, panicMode, blurAmount);
  const videoBlurClass =
    shouldBlur && effectiveBlur > 0
      ? `[filter:blur(${Math.min(100, Math.round(effectiveBlur))}px)]`
      : undefined;

  const videoProxySrc = useVideoProxyUrl(
    isVideo && post.fileUrl ? post.fileUrl : null,
  );

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

  // No reset effect needed: ViewerContent is keyed by post id at the call site,
  // so ViewerMedia remounts on post change and the initial useState/useMemo above
  // already derive fresh fallback state from the new post.

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) {
      return;
    }

    const clickedMedia = e.target.closest("img,video");
    if (!clickedMedia) {
      onBackgroundClick();
      return;
    }

    if (isVideo && !(e.target instanceof HTMLVideoElement)) {
      setIsVideoPlaying((v) => !v);
    }
  };

  return (
    <div
      className="flex relative justify-center items-center pb-20 w-full h-full min-h-0 cursor-default overflow-auto"
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
            className={cn("flex justify-center items-center w-full h-full", videoBlurClass)}
          >
            <video
              src={videoProxySrc ?? post.fileUrl}
              className="object-contain max-w-full max-h-full outline-none focus:outline-none"
              autoPlay={isVideoPlaying}
              loop
              controls
              playsInline
              poster={post.previewUrl}
              preload="auto"
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
                setFileUrlIndex(0);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full min-h-0 p-4 box-border">
          <img
            key={`${post.id}-${fileUrlIndex}-${imageDisplaySrc}`}
            src={imageDisplaySrc}
            alt={`Post ${post.id}`}
            referrerPolicy="no-referrer"
            className="block object-contain select-none w-auto h-auto max-w-[min(100vw,100%)] max-h-[min(calc(100dvh-8rem),100%)]"
            onError={(e) => {
              const failedUrl = e.currentTarget.currentSrc || e.currentTarget.src;
              log.error("[ViewerMedia] Image load error:", failedUrl);

              const nextIndex = fileUrlIndex + 1;
              if (nextIndex < fullImageChain.length) {
                setFileUrlIndex(nextIndex);
                return;
              }

              setImageError(true);
            }}
          />
        </div>
      )}
    </div>
  );
};
