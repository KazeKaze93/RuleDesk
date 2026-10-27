import { ImageOff } from "lucide-react";
import { cn } from "../../lib/utils";

const DEFAULT_ARIA_LABEL = "Failed to load image";

type MediaLoadPlaceholderProps = {
  className?: string;
  "aria-label"?: string;
};

/**
 * Broken-image placeholder for gallery thumbnails / preview slots.
 * Keeps the same container footprint as the failed media via className.
 */
export function MediaLoadPlaceholder({
  className,
  "aria-label": ariaLabel = DEFAULT_ARIA_LABEL,
}: MediaLoadPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "flex justify-center items-center w-full bg-muted text-muted-foreground",
        className
      )}
    >
      <ImageOff className="w-8 h-8 opacity-50" aria-hidden="true" />
    </div>
  );
}
