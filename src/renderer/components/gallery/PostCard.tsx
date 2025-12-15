import React from "react";
import { Play, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Post } from "../../../main/db/schema"; // Проверь путь к схеме

interface PostCardProps {
  post: Post;
  onClick: () => void;
  // Пока опционально, добавим функционал позже
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onToggleViewed?: (e: React.MouseEvent) => void;
}

const isVideo = (url: string) => url.endsWith(".mp4") || url.endsWith(".webm");

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const isVid = isVideo(post.fileUrl);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative aspect-[2/3] w-full overflow-hidden rounded-lg border bg-card transition-all cursor-zoom-in",
        "hover:border-primary hover:shadow-md hover:shadow-primary/10",
        // Если просмотрен - чуть приглушаем рамку
        post.isViewed && "border-muted-foreground/20"
      )}
    >
      {/* --- Image Layer --- */}
      {post.previewUrl ? (
        <img
          src={post.previewUrl}
          alt={`Post ${post.id}`}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-transform duration-300",
            "group-hover:scale-105",
            // Если просмотрен - делаем тусклее и чб
            post.isViewed && "opacity-60 grayscale-[0.3]"
          )}
        />
      ) : (
        <div className="flex justify-center items-center w-full h-full text-xs bg-muted text-muted-foreground">
          No Preview
        </div>
      )}

      {/* --- Overlays --- */}

      {/* 1. Video Indicator (Top Right) */}
      {isVid && (
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 backdrop-blur-sm">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
      )}

      {/* 2. Viewed Indicator (Top Left) */}
      {post.isViewed && (
        <div className="absolute top-2 left-2 z-10 p-1 rounded-full shadow-sm bg-primary/90">
          <Check className="h-3 w-3 stroke-[3] text-primary-foreground" />
        </div>
      )}

      {/* 3. Gradient & Rating (Bottom - visible on hover) */}
      <div className="flex absolute inset-0 flex-col justify-end p-3 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-200 from-black/80 group-hover:opacity-100">
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

          {/* Сюда можно будет добавить размер файла или разрешение */}
        </div>
      </div>
    </div>
  );
};
