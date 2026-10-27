import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

export type GalleryLoadErrorProps = {
  title?: string;
  description?: string;
  onRetry: () => void;
};

export function GalleryLoadError({
  title = "Could not load gallery",
  description = "Failed to load posts.",
  onRetry,
}: GalleryLoadErrorProps) {
  return (
    <div
      className="flex flex-col gap-4 justify-center items-center h-full px-6"
      role="alert"
      aria-live="polite"
    >
      <div className="flex justify-center items-center rounded-full border border-destructive/25 p-4">
        <AlertCircle
          className="w-12 h-12 text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-2 items-center max-w-md text-center">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
