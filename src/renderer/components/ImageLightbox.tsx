import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
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
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);

  const isVideo =
    post.fileUrl.endsWith(".mp4") || post.fileUrl.endsWith(".webm");

  // Note: Loading state resets automatically when component remounts (key={post.id} in parent)

  if (isVideo) {
    return (
      <div className="flex relative justify-center items-center w-full h-full">
        <video
          src={post.fileUrl}
          controls
          autoPlay
          loop
          className="object-contain max-w-full max-h-full shadow-2xl"
        />
      </div>
    );
  }

  return (
    <div className="flex relative justify-center items-center w-full h-full select-none">
      {/* 1. LOADING INDICATOR (Visible until at least Sample is loaded) */}
      {!sampleLoaded && !fullLoaded && (
        <div className="flex absolute inset-0 z-50 flex-col justify-center items-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-blue-500 drop-shadow-lg animate-spin" />
        </div>
      )}

      {/* 2. PREVIEW LAYER (Bottom) 
          Always visible as a background base. Loads instantly from cache.
      */}
      <img
        src={post.previewUrl}
        alt="preview"
        className="object-contain absolute inset-0 z-0 w-full h-full opacity-50 blur-xl scale-95"
      />

      {/* 3. SAMPLE LAYER (Middle)
          Loads fast (200-500KB). Once loaded, it covers the blurry preview.
          Hidden once the Full version is ready to save memory.
      */}
      {!fullLoaded && post.sampleUrl && (
        <img
          src={post.sampleUrl}
          alt="sample"
          className={cn(
            "object-contain absolute z-10 max-w-full max-h-full shadow-xl transition-opacity duration-300",
            sampleLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setSampleLoaded(true)}
        />
      )}

      {/* 4. FULL LAYER (Top)
          Loads in background (10MB+). Once loaded, it fades in over everything.
      */}
      <img
        src={post.fileUrl}
        alt={`Post ${post.id} - ${post.tags}`}
        className={cn(
          "object-contain relative z-20 max-w-full max-h-full shadow-2xl transition-opacity duration-500",
          fullLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => {
          setFullLoaded(true);
          setSampleLoaded(true); // Ensure spinner hides if full loads faster than sample
        }}
      />

      {/* Quality Badge (Optional debugging aid) */}
      <div className="absolute bottom-4 left-4 z-50 px-2 py-1 font-mono text-xs text-white rounded border pointer-events-none bg-black/50 border-white/10">
        {fullLoaded ? "ORIGINAL" : sampleLoaded ? "SAMPLE" : "PREVIEW"}
      </div>
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
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-md duration-200 bg-black/95 animate-in fade-in">
      {/* Toolbar */}
      <div className="flex absolute top-0 right-0 left-0 z-50 justify-between items-center p-4 bg-gradient-to-b to-transparent from-black/80">
        <div className="font-mono text-sm text-white/80">ID: {post.postId}</div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => window.api.openExternal(post.fileUrl)}
            title="Open Original in Browser"
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

      {/* Nav Buttons */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-50 p-2 rounded-full transition-colors bg-black/50 text-white/70 hover:bg-white/20 hover:text-white"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      {/* KEY PROP IS CRITICAL: It forces React to re-mount the component when image changes */}
      <LightboxContent key={post.id} post={post} />

      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 z-50 p-2 rounded-full transition-colors bg-black/50 text-white/70 hover:bg-white/20 hover:text-white"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}
    </div>
  );
};
