import React, { useState, useRef, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { Play, Check, Heart, List, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeRating } from "@shared/utils/post-normalization";
import type { Post } from "@shared/types/db";
import { useSafeModeStore, shouldBlurPost, getEffectiveBlurAmount } from "../../../store/safeModeStore";
import { useSearchStore } from "../../../store/searchStore";
import { isVideoPost } from "../../../lib/filter-utils";
import { isVideoUrl } from "../../../../shared/utils/media";
import { useVideoProxyUrl } from "../../../lib/hooks/useVideoProxyUrl";
import { QuickAddToPlaylistMenu } from "../../../components/playlists/QuickAddToPlaylistMenu";
import { Checkbox } from "../../../components/ui/checkbox";
import { Button } from "../../../components/ui/button";
import { useBulkSelect } from "../../../hooks/useBulkSelect";
import { getBulkSelectId } from "../../../lib/bulkSelect";
import { getRatingMeta } from "../../../lib/rating";

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
      <div className="p-1 rounded-full shadow-sm bg-destructive/90">
        <Heart className="w-3 h-3 text-destructive-foreground fill-destructive-foreground" />
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
  const viewType = useSearchStore((state) => state.viewType);
  const shouldPreserveAspect = preserveAspect ?? viewType === "grid";
  const normalizedRating = normalizeRating(post.rating);
  const ratingMeta = getRatingMeta(post.rating);
  const shouldBlur = shouldBlurPost(normalizedRating, safeMode, panicMode);
  const effectiveBlur = getEffectiveBlurAmount(safeMode, panicMode, blurAmount);
  const blurFilterClass =
    shouldBlur && effectiveBlur > 0
      ? `[filter:blur(${Math.min(100, Math.round(effectiveBlur))}px)]`
      : undefined;

  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const [sampleSrc, setSampleSrc] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
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

  const videoPreviewUrl = isVid
    ? (post.sampleUrl && isVideoUrl(post.sampleUrl) ? post.sampleUrl : post.fileUrl)
    : null;

  const videoProxySrc = useVideoProxyUrl(
    isVid && videoPreviewUrl ? videoPreviewUrl : null,
  );

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
          if (entry.isIntersecting) {
            setShouldLoadVideo(true);
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.01,
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isVid, videoPreviewUrl]);

  useEffect(() => {
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
      // Sample failed to load — keep showing preview.
    };
    img.src = post.sampleUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [isInViewport, isVid, post.sampleUrl, post.previewUrl, sampleLoaded]);

  useEffect(() => {
    if (!videoRef.current || !shouldLoadVideo || !isHovered) return;

    const video = videoRef.current;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setVideoError(true);
      });
    }

    return () => {
      if (video && !video.paused) {
        video.pause();
      }
    };
  }, [isHovered, shouldLoadVideo]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, []);

  // Key remounts the video when the post changes, resetting error state without cascading setState.
  const videoKey = `${post.id}`;

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
        // Opens centered AddToPlaylist modal — no cursor-anchored trigger needed.
        if (context !== "playlist") {
          setIsPlaylistMenuOpen(true);
        }
      }}
      aria-label={`View post ${post.id}. Rating: ${ratingMeta.label}. ${
        isVid ? "Video" : "Image"
      }.`}
      className={cn(
        "group relative w-full overflow-hidden rounded-[var(--card-radius)] border bg-card transition-all cursor-pointer",
        shouldPreserveAspect ? "aspect-[2/3]" : "",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "hover:border-primary hover:shadow-md hover:shadow-primary/10",
        "select-none",
        post.isViewed && "border-muted-foreground/20",
        isBulkMode && isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {isBulkMode && (
        <div className="absolute left-2 top-2 z-30">
          <Checkbox
            checked={isSelected}
            aria-label={`Select post ${post.id}`}
            className="h-5 w-5 rounded-sm border-primary-foreground/70 bg-background/60 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:border-primary-foreground data-[state=checked]:bg-primary"
            onCheckedChange={() => {
              toggleId(bulkSelectId);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          />
        </div>
      )}
      {post.previewUrl ? (
        <div
          className={cn(
            "relative w-full overflow-hidden bg-muted",
            shouldPreserveAspect ? "h-full" : "",
            blurFilterClass,
          )}
        >
          <img
            src={sampleSrc ?? post.previewUrl}
            alt={`Post ${post.id}`}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-full transition-all duration-500",
              shouldPreserveAspect
                ? "h-full object-contain"
                : "h-auto",
              !showVideoPreview && "group-hover:scale-105",
              post.isViewed && "opacity-60 grayscale-[0.3]",
              showVideoPreview && "opacity-0",
              sampleLoaded && "opacity-100"
            )}
          />

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
                  ? "h-full object-contain"
                  : "h-auto",
                showVideoPreview ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              onError={() => {
                setVideoError(true);
              }}
              onLoadedData={() => {
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

      {isVid && (
        <div className="absolute right-2 top-2 rounded-full bg-background/50 p-1.5 backdrop-blur-sm z-20">
          <Play className="w-3 h-3 text-foreground fill-foreground" />
        </div>
      )}

      {/*
        Nested interactive decision: card root stays role="button" for the primary
        open-viewer action (click / Enter / Space). Overlay actions are real Buttons
        with stopPropagation so they do not activate the card.
      */}
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
            post={{ id: post.id, postId: post.postId, provider: post.provider }}
            open={isPlaylistMenuOpen}
            onOpenChange={setIsPlaylistMenuOpen}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-auto w-auto min-h-0 min-w-0 rounded-full bg-background/50 p-1.5 backdrop-blur-sm hover:bg-background/70"
                aria-label="Add to playlist"
                title="Add to playlist"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <List className="w-3 h-3 text-foreground" />
              </Button>
            }
          />
        )}
        {onRemoveFromPlaylist && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-auto w-auto min-h-0 min-w-0 rounded-full bg-destructive/90 p-1.5 backdrop-blur-sm hover:bg-destructive"
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
          >
            <Trash2 className="w-3 h-3 text-destructive-foreground" />
          </Button>
        )}
      </div>

      <PostCardBadges
        isFavorited={post.isFavorited}
        isViewed={post.isViewed}
        context={context}
      />

      <div className="flex absolute inset-0 flex-col justify-end p-[var(--card-padding)] bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-200 from-background/80 group-hover:opacity-100 pointer-events-none">
        <div className="flex justify-between items-end">
          <span
            className={cn(
              "text-[length:var(--card-meta-size)] font-bold uppercase tracking-wider",
              ratingMeta.textClassName
            )}
          >
            {ratingMeta.shortLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
