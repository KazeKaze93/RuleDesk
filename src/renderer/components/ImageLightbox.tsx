import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Post } from "../../main/db/schema";

interface ImageLightboxProps {
  post: Post;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ImageLightbox({
  post,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(post.fileUrl);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-md duration-200 bg-black/95 animate-in fade-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white rounded-full transition-colors bg-black/50 hover:bg-white/20"
      >
        <X size={24} />
      </button>

      <button
        onClick={onPrev}
        aria-label="Previous image"
        className="absolute left-4 top-1/2 z-50 p-3 text-white rounded-full transition-colors -translate-y-1/2 bg-black/50 hover:bg-white/20"
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={onNext}
        aria-label="Next image"
        className="absolute right-4 top-1/2 z-50 p-3 text-white rounded-full transition-colors -translate-y-1/2 bg-black/50 hover:bg-white/20"
      >
        <ChevronRight size={32} />
      </button>

      <div className="flex relative justify-center items-center p-12 w-full h-full">
        {isVideo ? (
          <video
            src={post.fileUrl}
            controls
            autoPlay
            loop
            className="object-contain max-w-full max-h-full shadow-2xl"
          />
        ) : (
          <img
            src={post.sampleUrl || post.fileUrl}
            alt={post.tags}
            className="object-contain max-w-full max-h-full shadow-2xl"
          />
        )}

        <div className="flex absolute bottom-6 left-1/2 gap-4 items-center px-6 py-3 rounded-full backdrop-blur-md -translate-x-1/2 bg-black/60 text-white/90">
          <span className="text-sm font-medium">Rating: {post.rating}</span>
          <span className="w-px h-4 bg-white/20" />
          <a
            href={post.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex gap-2 items-center text-sm transition-colors hover:text-blue-400"
          >
            <ExternalLink size={14} />
            Original
          </a>
        </div>
      </div>
    </div>
  );
}
