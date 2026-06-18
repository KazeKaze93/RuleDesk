import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { Play, Check, Heart, List, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeRating } from "@shared/utils/post-normalization";
import type { Post } from "../../../../main/db/schema";
import { useSafeModeStore, shouldBlurPost, getEffectiveBlurAmount } from "../../../store/safeModeStore";
import { useSearchStore } from "../../../store/searchStore";
import { isVideoPost } from "../../../lib/filter-utils";
import { isVideoUrl } from "../../../../shared/utils/media";
import { useVideoProxyUrl } from "../../../lib/hooks/useVideoProxyUrl";
import { QuickAddToPlaylistMenu } from "../../../components/playlists/QuickAddToPlaylistMenu";
import { Checkbox } from "../../../components/ui/checkbox";
import { useBulkSelect } from "../../../hooks/useBulkSelect";
import { getBulkSelectId } from "../../../lib/bulkSelect";

const loadedSampleUrls = new Set<string>();
const LONG_PRESS_DELAY_MS = 300;
const POINTER_MOVE_CANCEL_PX = 5;

type PostCardContext = "browse" | "favorites" | "updates" | "playlist";

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onToggleViewed?: (e: React.MouseEvent) => void;
  onRemoveFromPlaylist?: () => void;
  preserveAspect?: boolean;
  context?: PostCardContext;
}

interface PostCardBadgesProps {
  isFavorited: boolean;
  isViewed: boolean;
  context: PostCardContext;
}

const PostCardBadges: React.FC<PostCardBadgesProps> = ({
  isFavorited,
  isViewed,
  context,
}) => (
  <div className="flex absolute top-2 left-2 z-10 gap-1 items-center">
    {isFavorited && context !== "favorites" && (
      <div className="p-1 rounded-full shadow-sm bg-red-500/90">
        <Heart className="w-3 h-3 text-white fill-white" />
      </div>
    )}
    {isViewed && (
      <div className="p-1 rounded-full shadow-sm bg-primary/90">
        <Check className="h-3 w-3 stroke-[3] text-primary-foreground" />
      </div>
    )}
  </div>
);

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onClick,
  onRemoveFromPlaylist,
  preserveAspect,
  context = "browse",
}) => {
  const isVid = isVideoPost(post.fileUrl);
  const { safeMode, panicMode, blurAmount } = useSafeModeStore(
    useShallow((s) => ({
      safeMode: s.safeMode,
      panicMode: s.panicMode,
      blurAmount: s.blurAmount,
    })),
  );
  // Optimize: subscribe only to viewType, not entire store
  const viewType = useSearchStore((state) => state.viewType);
  const shouldPreserveAspect = preserveAspect ?? viewType === "grid";
  const normalizedRating = normalizeRating(post.rating);
  const shouldBlur = shouldBlurPost(normalizedRating, safeMode, panicMode);
  const effectiveBlur = getEffectiveBlurAmount(safeMode, panicMode, blurAmount);
  const blurFilterClass =
    shouldBlur && effectiveBlur > 0
      ? `[filter:blur(${Math.min(100, Math.round(effectiveBlur))}px)]`
      : undefined;

  // Video hover preview state
  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const [sampleSrc, setSampleSrc] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contextMenuAnchorRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const bulkSelectId = getBulkSelectId(post);
  const isBulkMode = useBulkSelect((state) => state.isBulkMode);
  const toggleId = useBulkSelect((state) => state.toggleId);
  const activateBulkMode = useBulkSelect((state) => state.activateBulkMode);
  const isSelected = useBulkSelect((state) => state.selectedIds.has(bulkSelectId));

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Determine video preview URL: prefer sampleUrl if it's a video, otherwise use fileUrl
  const videoPreviewUrl = isVid
    ? (post.sampleUrl && isVideoUrl(post.sampleUrl) ? post.sampleUrl : post.fileUrl)
    : null;

  const videoProxySrc = useVideoProxyUrl(
    isVid && videoPreviewUrl ? videoPreviewUrl : null,
  );

  // IntersectionObserver: only initialize video when card is in viewport
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
          // Only allow video loading when in viewport
          if (entry.isIntersecting) {
            setShouldLoadVideo(true);
          }
        });
      },
      {
        rootMargin: "100px", // Start loading slightly before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isVid, videoPreviewUrl]);

  useEffect(() => {
    // Only upgrade if: in viewport, not a video, sampleUrl exists and is different from previewUrl
    if (!isInViewport || isVid || !post.sampleUrl || post.sampleUrl === post.previewUrl) return;
    if (sampleLoaded) return;
    if (loadedSampleUrls.has(post.sampleUrl)) {
      queueMicrotask(() => {
        setSampleSrc(post.sampleUrl);
        setSampleLoaded(true);
      });
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      const promoteSample = () => {
        if (cancelled) return;
        loadedSampleUrls.add(post.sampleUrl);
        setSampleSrc(post.sampleUrl);
        setSampleLoaded(true);
      };

      const decodeResult = img.decode();
      decodeResult.then(promoteSample).catch(promoteSample);
    };
    img.onerror = () => {
      // Sample failed to load — keep showing preview, no error shown to user
    };
    img.src = post.sampleUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [isInViewport, isVid, post.sampleUrl, post.previewUrl, sampleLoaded]);

  // Handle video playback on hover
  useEffect(() => {
    if (!videoRef.current || !shouldLoadVideo || !isHovered) return;

    const video = videoRef.current;
    
    // Play video on hover
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Video play failed (e.g., autoplay policy, network error)
        // Silently handle - we'll fallback to static image
        setVideoError(true);
      });
    }

    return () => {
      // Pause video when not hovered
      if (video && !video.paused) {
        video.pause();
      }
    };
  }, [isHovered, shouldLoadVideo]);

  useLayoutEffect(() => {
    const el = contextMenuAnchorRef.current;
    if (!el) {
      return;
    }
    if (contextMenuPosition) {
      el.style.left = `${contextMenuPosition.x}px`;
      el.style.top = `${contextMenuPosition.y}px`;
    } else {
      el.style.removeProperty("left");
      el.style.removeProperty("top");
    }
  }, [contextMenuPosition]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, []);

  // Use key prop on video element to reset state when post changes
  // This avoids useEffect setState (which causes cascading renders)
  // The key prop will cause React to unmount/remount the video element when post.id changes,
  // which naturally resets the video error state
  const videoKey = `${post.id}`;

  // Show video preview only if: video post, in viewport, hovered, video URL available, and no error
  const showVideoPreview = isVid && 
    shouldLoadVideo && 
    isHovered && 
    videoPreviewUrl && 
    !videoError;

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isBulkMode) {
          toggleId(bulkSelectId);
          return;
        }
        onClick();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (isBulkMode) {
          toggleId(bulkSelectId);
          return;
        }
        onClick();
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || isBulkMode) {
          return;
        }
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
        clearLongPressTimer();
        longPressTimerRef.current = setTimeout(() => {
          activateBulkMode();
          if (!isSelected) {
            toggleId(bulkSelectId);
          }
        }, LONG_PRESS_DELAY_MS);
      }}
      onPointerMove={(event) => {
        if (!pointerStartRef.current || longPressTimerRef.current === null) {
          return;
        }
        const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
        const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);
        if (deltaX > POINTER_MOVE_CANCEL_PX || deltaY > POINTER_MOVE_CANCEL_PX) {
          clearLongPressTimer();
        }
      }}
      onPointerUp={() => {
        pointerStartRef.current = null;
        clearLongPressTimer();
      }}
      onPointerCancel={() => {
        pointerStartRef.current = null;
        clearLongPressTimer();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setIsPlaylistMenuOpen(true);
      }}
      aria-label={`View post ${post.id}. Rating: ${post.rating}. ${
        isVid ? "Video" : "Image"
      }.`}
      className={cn(
        "group relative w-full overflow-hidden rounded-[var(--card-radius)] border bg-card transition-all cursor-pointer",
        // Grid: fixed aspect ratio, Masonry: natural aspect ratio (height auto)
        shouldPreserveAspect ? "aspect-[2/3]" : "",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "hover:border-primary hover:shadow-md hover:shadow-primary/10",
        "select-none", // Prevent text selection via CSS (user-select: none)
        post.isViewed && "border-muted-foreground/20",
        isBulkMode && isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {isBulkMode && (
        <div className="absolute left-2 top-2 z-30">
          <Checkbox
            checked={isSelected}
            aria-label={`Select post ${post.id}`}
            className="h-5 w-5 rounded-sm border-white/70 bg-black/60 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:border-white data-[state=checked]:bg-primary"
            onCheckedChange={() => {
              toggleId(bulkSelectId);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          />
        </div>
      )}
      {/* --- Media Layer (Image + Video Preview) --- */}
      {post.previewUrl ? (
        <div
          className={cn(
            "relative w-full overflow-hidden",
            shouldPreserveAspect ? "h-full" : "",
            blurFilterClass,
          )}
        >
          {/* Static Preview Image */}
          <img
            src={sampleSrc ?? post.previewUrl}
            alt={`Post ${post.id}`}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-full transition-all duration-500",
              shouldPreserveAspect
                ? "h-full object-cover" 
                : "h-auto",
              // Only scale on hover when video preview is not showing
              !showVideoPreview && "group-hover:scale-105",
              post.isViewed && "opacity-60 grayscale-[0.3]",
              // Cross-fade: hide image when video is showing
              showVideoPreview && "opacity-0",
              sampleLoaded && "opacity-100"
            )}
          />

          {/* Video Preview (overlay on hover) */}
          {isVid && shouldLoadVideo && videoPreviewUrl && (
            <video
              key={videoKey}
              ref={videoRef}
              src={videoProxySrc ?? videoPreviewUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className={cn(
                "absolute inset-0 w-full transition-opacity duration-300 z-10",
                shouldPreserveAspect
                  ? "h-full object-cover" 
                  : "h-auto",
                // Cross-fade: show video when hovered, hide otherwise
                showVideoPreview ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              onError={() => {
                setVideoError(true);
              }}
              onLoadedData={() => {
                // Reset error state if video loads successfully
                setVideoError(false);
              }}
            />
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex justify-center items-center w-full text-xs bg-muted text-muted-foreground",
            shouldPreserveAspect ? "h-full" : "min-h-[200px]",
            blurFilterClass,
          )}
        >
          No Preview
        </div>
      )}

      {/* --- Overlays --- */}

      {/* 1. Video Indicator (Top Right) */}
      {isVid && (
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 backdrop-blur-sm z-20">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
      )}

      {/* 1.5. Playlist actions (Top Right, below video indicator if present) */}
      <div
        className={cn(
          "absolute right-2 z-20 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          isVid ? "top-12" : "top-2"
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
      >
        {context !== "playlist" && (
          <QuickAddToPlaylistMenu
            post={{ id: post.id, postId: post.postId }}
            open={isPlaylistMenuOpen}
            onOpenChange={(open) => {
              setIsPlaylistMenuOpen(open);
              if (!open) {
                setContextMenuPosition(null);
              }
            }}
            trigger={
              <span
                ref={contextMenuAnchorRef}
                className={cn(
                  "inline-flex items-center justify-center rounded-full bg-black/50 p-1.5 backdrop-blur-sm hover:bg-black/70 transition-colors cursor-pointer",
                  contextMenuPosition && "fixed w-0 h-0 overflow-hidden p-0 opacity-0 pointer-events-none"
                )}
                role="button"
                tabIndex={0}
                aria-label="Add to playlist"
                title="Add to playlist"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenuPosition(null);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <List className="w-3 h-3 text-white" />
              </span>
            }
          />
        )}
        {onRemoveFromPlaylist && (
          <span
            className="inline-flex items-center justify-center rounded-full bg-red-500/90 p-1.5 backdrop-blur-sm hover:bg-red-600 transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="Remove from playlist"
            title="Remove from playlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveFromPlaylist();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onRemoveFromPlaylist();
              }
            }}
          >
            <Trash2 className="w-3 h-3 text-white" />
          </span>
        )}
      </div>

      {/* 2. Viewed & Favorite Indicator (Top Left/Top Right) */}
      <PostCardBadges
        isFavorited={post.isFavorited}
        isViewed={post.isViewed}
        context={context}
      />

      {/* 3. Gradient & Rating (Bottom - visible on hover) */}
      <div className="flex absolute inset-0 flex-col justify-end p-[var(--card-padding)] bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-200 from-black/80 group-hover:opacity-100 pointer-events-none">
        <div className="flex justify-between items-end">
          <span
            className={cn(
              "text-[length:var(--card-meta-size)] font-bold uppercase tracking-wider",
              post.rating === "e"
                ? "text-red-400"
                : post.rating === "q"
                ? "text-yellow-400"
                : "text-green-400"
            )}
          >
            {post.rating === "s"
              ? "Safe"
              : post.rating === "q"
              ? "Quest."
              : "Explicit"}
          </span>
        </div>
      </div>
    </div>
  );
};
