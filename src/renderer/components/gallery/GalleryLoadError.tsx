import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const GALLERY_LOAD_ERROR_VARIANT_FULLSCREEN = "fullscreen" as const;
const GALLERY_LOAD_ERROR_VARIANT_INLINE = "inline" as const;

export type GalleryLoadErrorVariant =
  | typeof GALLERY_LOAD_ERROR_VARIANT_FULLSCREEN
  | typeof GALLERY_LOAD_ERROR_VARIANT_INLINE;

export type GalleryLoadErrorProps = {
  title?: string;
  description?: string;
  onRetry: () => void;
  variant?: GalleryLoadErrorVariant;
};

export function GalleryLoadError({
  title = "Could not load gallery",
  description = "Failed to load posts.",
  onRetry,
  variant = GALLERY_LOAD_ERROR_VARIANT_FULLSCREEN,
}: GalleryLoadErrorProps) {
  if (variant === GALLERY_LOAD_ERROR_VARIANT_INLINE) {
    return (
      <Alert className="mx-6 mt-4 shrink-0">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{description}</p>
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 justify-center items-center h-full px-6"
      role="alert"
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
