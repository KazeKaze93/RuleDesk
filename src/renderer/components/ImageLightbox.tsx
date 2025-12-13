import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import type { Post } from "../../main/db/schema";
import { cn } from "../lib/utils";

interface ImageLightboxProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const LightboxContent: React.FC<{ post: Post }> = ({ post }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const isVideo =
    post.fileUrl.endsWith(".mp4") || post.fileUrl.endsWith(".webm");

  return (
    <div className="flex relative justify-center items-center p-4 w-full h-full">
      {!isLoaded && !isVideo && (
        <div className="flex absolute inset-0 justify-center items-center text-white/50">
          Loading full quality...
        </div>
      )}

      {isVideo ? (
        <video
          src={post.fileUrl}
          controls
          autoPlay
          loop
          preload="auto"
          className="object-contain max-w-full max-h-full shadow-2xl"
        />
      ) : (
        <img
          src={post.fileUrl}
          alt={`Post ${post.id}`}
          className={cn(
            "object-contain max-w-full max-h-full shadow-2xl transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  post,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNext && onNext) onNext();
      if (e.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm duration-200 bg-black/95 animate-in fade-in">
      {/* Toolbar */}
      <div className="flex absolute top-0 right-0 left-0 z-50 justify-between items-center p-4 bg-gradient-to-b to-transparent from-black/60">
        <div className="font-mono text-sm text-white/80">
          ID: {post.postId} | {post.rating?.toUpperCase()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => window.api.openExternal(post.fileUrl)}
            title="Open Original"
          >
            <ExternalLink className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Navigation Buttons (Left) */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-50 p-2 rounded-full transition-colors bg-black/50 text-white/70 hover:bg-white/20 hover:text-white"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      <LightboxContent key={post.id} post={post} />

      {/* Navigation Buttons (Right) */}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 z-50 p-2 rounded-full transition-colors bg-black/50 text-white/70 hover:bg-white/20 hover:text-white"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
};
