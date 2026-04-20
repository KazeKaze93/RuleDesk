import React, { useState, useRef, useEffect } from "react";
import { Play, Check, Heart, List, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "../../../../main/db/schema";
import { useSafeModeStore, shouldBlurPost, getEffectiveBlurAmount } from "../../../store/safeModeStore";
import { useSearchStore } from "../../../store/searchStore";
import { isVideoPost } from "../../../lib/filter-utils";
import { isVideoUrl } from "../../../../shared/utils/media";
import { QuickAddToPlaylistMenu } from "../../../components/playlists/QuickAddToPlaylistMenu";

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onToggleViewed?: (e: React.MouseEvent) => void;
  onRemoveFromPlaylist?: () => void;
  preserveAspect?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onClick,
  onRemoveFromPlaylist,
  preserveAspect,
}) => {
  const isVid = isVideoPost(post.fileUrl);
  const { safeMode, panicMode, blurAmount } = useSafeModeStore();
  // Optimize: subscribe only to viewType, not entire store
  const viewType = useSearchStore((state) => state.viewType);
  const shouldPreserveAspect = preserveAspect ?? viewType === "grid";
  // Normalize rating to 'e', 'q', 's' safely (handles both 'e' and 'explicit' formats)
  const normalizedRating = post.rating ? post.rating.charAt(0).toLowerCase() as "e" | "q" | "s" : "q";
  const shouldBlur = shouldBlurPost(normalizedRating, safeMode, panicMode);
  const effectiveBlur = getEffectiveBlurAmount(safeMode, panicMode, blurAmount);

  // Video hover preview state
  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine video preview URL: prefer sampleUrl if it's a video, otherwise use fileUrl
  const videoPreviewUrl = isVid
    ? (post.sampleUrl && isVideoUrl(post.sampleUrl) ? post.sampleUrl : post.fileUrl)
    : null;

  // IntersectionObserver: only initialize video when card is in viewport
  useEffect(() => {
    if (!isVid || !videoPreviewUrl || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
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
    <button
      ref={cardRef}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`View post ${post.id}. Rating: ${post.rating}. ${
        isVid ? "Video" : "Image"
      }.`}
      className={cn(
        "group relative w-full overflow-hidden rounded-lg border bg-card transition-all cursor-pointer",
        // Grid: fixed aspect ratio, Masonry: natural aspect ratio (height auto)
        shouldPreserveAspect ? "aspect-[3/4]" : "",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "hover:border-primary hover:shadow-md hover:shadow-primary/10",
        "select-none", // Prevent text selection via CSS (user-select: none)
        post.isViewed && "border-muted-foreground/20"
      )}
      style={{ pointerEvents: "auto", userSelect: "none" }} // Ensure button is clickable and prevent text selection
    >
      {/* --- Media Layer (Image + Video Preview) --- */}
      {post.previewUrl ? (
        <div 
          className={cn(
            "relative w-full overflow-hidden",
            shouldPreserveAspect ? "h-full" : ""
          )}
          style={{
            filter: shouldBlur
              ? `blur(${effectiveBlur}px)`
              : undefined,
          }}
        >
          {/* Static Preview Image */}
          <img
            src={post.previewUrl}
            alt={`Post ${post.id}`}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-full transition-all duration-300",
              shouldPreserveAspect
                ? "h-full object-cover" 
                : "h-auto",
              // Only scale on hover when video preview is not showing
              !showVideoPreview && "group-hover:scale-105",
              post.isViewed && "opacity-60 grayscale-[0.3]",
              // Cross-fade: hide image when video is showing
              showVideoPreview && "opacity-0"
            )}
          />

          {/* Video Preview (overlay on hover) */}
          {isVid && shouldLoadVideo && videoPreviewUrl && (
            <video
              key={videoKey}
              ref={videoRef}
              src={videoPreviewUrl}
              muted
              loop
              playsInline
              preload="none"
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
            shouldPreserveAspect ? "h-full" : "min-h-[200px]"
          )}
          style={{
            filter: shouldBlur
              ? `blur(${effectiveBlur}px)`
              : undefined,
          }}
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

      {/* 1.5. Playlist Menu (Top Right, below video indicator if present) */}
      <div
        className={cn(
          "absolute right-2 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
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
        <QuickAddToPlaylistMenu
          post={{ id: post.id, postId: post.postId }}
          trigger={
            <span
              className="inline-flex items-center justify-center rounded-full bg-black/50 p-1.5 backdrop-blur-sm hover:bg-black/70 transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
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
      </div>

      {/* 1.6. Remove from Playlist Button (Top Left, below indicators) */}
      {onRemoveFromPlaylist && (
        <div
          className="absolute left-2 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ top: post.isFavorited || post.isViewed ? "3.5rem" : "0.5rem" }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
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
        </div>
      )}

      {/* 2. Viewed & Favorite Indicator (Top Left/Top Right) */}
      <div className="flex absolute top-2 left-2 z-10 gap-1 items-center">
        {/* Индикатор "Избранное" (Если пост отмечен) */}
        {post.isFavorited && (
          <div className="p-1 rounded-full shadow-sm bg-red-500/90">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
        )}
        {/* Индикатор "Просмотрено" */}
        {post.isViewed && (
          <div className="p-1 rounded-full shadow-sm bg-primary/90">
            <Check className="h-3 w-3 stroke-[3] text-primary-foreground" />
          </div>
        )}
      </div>

      {/* 3. Gradient & Rating (Bottom - visible on hover) */}
      <div style={{ pointerEvents: 'none' }} className="pointer-events-none flex absolute inset-0 flex-col justify-end p-3 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-200 from-black/80 group-hover:opacity-100">
        <div className="flex justify-between items-end">
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
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
    </button>
  );
};
