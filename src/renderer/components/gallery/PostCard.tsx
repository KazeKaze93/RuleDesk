import React from "react";
import { Play, Check, Heart } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Post } from "../../../main/db/schema";

interface PostCardProps {
  post: Post;
  onClick?: (post: Post) => void;
  onToggleFavorite?: (post: Post) => void;
}

const isVideo = (url: string) => url.endsWith(".mp4") || url.endsWith(".webm");

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onClick,
  onToggleFavorite,
}) => {
  const isVid = isVideo(post.fileUrl);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(post);
  };

  return (
    <div className="group relative aspect-[2/3] w-full overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:shadow-primary/10">
      {/* Кликабельная область для открытия (картинка) */}
      <button
        type="button"
        onClick={() => onClick?.(post)}
        className="w-full h-full focus:outline-none cursor-zoom-in"
        aria-label={`View post ${post.id}`}
      >
        {post.previewUrl ? (
          <img
            src={post.previewUrl}
            alt={`Post ${post.id}`}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              "group-hover:scale-105",
              post.isViewed && "opacity-60 grayscale-[0.3]"
            )}
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full text-xs bg-muted text-muted-foreground">
            No Preview
          </div>
        )}
      </button>

      {/* --- Overlays --- */}

      {/* 1. Video Indicator (Top Right) */}
      {isVid && (
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 backdrop-blur-sm pointer-events-none">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
      )}

      {/* 2. Interactive Actions (Top Left) */}
      <div className="flex absolute top-2 left-2 z-10 gap-1 items-center">
        {/* Кнопка ЛАЙКА */}
        <button
          onClick={handleLike}
          className={cn(
            "p-1.5 rounded-full shadow-sm transition-colors backdrop-blur-md",
            post.isFavorited
              ? "bg-red-500/90 hover:bg-red-600"
              : "bg-black/40 hover:bg-black/60"
          )}
        >
          <Heart
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              post.isFavorited
                ? "text-white fill-white"
                : "text-white/70 hover:text-white"
            )}
          />
        </button>

        {/* Индикатор "Просмотрено" (неинтерактивный) */}
        {post.isViewed && (
          <div className="p-1.5 rounded-full shadow-sm bg-primary/90 pointer-events-none">
            <Check className="w-3.5 h-3.5 stroke-[3] text-primary-foreground" />
          </div>
        )}
      </div>

      {/* 3. Rating Gradient (Bottom) */}
      <div className="flex absolute inset-0 flex-col justify-end p-3 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-200 pointer-events-none from-black/80 group-hover:opacity-100">
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
  );
};
