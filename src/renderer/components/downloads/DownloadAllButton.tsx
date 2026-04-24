import React from "react";
import { Button } from "../ui/button";
import { Download, Loader2, Square, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDownloadStore } from "../../store/downloadStore";

export interface DownloadAllButtonProps {
  onClick: () => void;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isDownloading: boolean;
  isPaused?: boolean;
  progress: { done: number; total: number };
  canDownload: boolean;
  totalLabel: string | number;
  size?: "default" | "sm";
  className?: string;
}

export const DownloadAllButton: React.FC<DownloadAllButtonProps> = ({
  onClick,
  onCancel,
  onPause,
  onResume,
  isDownloading,
  isPaused = false,
  progress,
  canDownload,
  totalLabel,
  size = "sm",
  className,
}) => {
  const isAnyDownloadActive = useDownloadStore((s) => s.isDownloading);
  const pct = progress.total > 0 ? Math.round((progress.done * 100) / progress.total) : 0;
  const disabled = !canDownload || (isAnyDownloadActive && !isDownloading);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        {!isDownloading ? (
          <Button
            variant="outline"
            size={size}
            onClick={onClick}
            disabled={disabled}
            title={disabled && isAnyDownloadActive ? "Download in progress" : `Download ${totalLabel} files`}
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Download All ({totalLabel})</span>
          </Button>
        ) : (
          <>
            <div className="relative flex items-center gap-2 min-w-[140px]">
              <Button
                variant="outline"
                size={size}
                className="relative overflow-hidden pr-16"
                disabled
              >
                <div className="absolute inset-0">
                  <svg
                    className="h-full w-full"
                    viewBox="0 0 100 1"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <rect
                      x={0}
                      y={0}
                      width={pct}
                      height={1}
                      className="fill-primary/20"
                    />
                  </svg>
                </div>
                <span className="relative flex items-center gap-2">
                  {isPaused ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span className="text-xs">
                    {progress.done}/{progress.total}
                  </span>
                </span>
              </Button>
            </div>
            {onPause && onResume && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={isPaused ? onResume : onPause}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </Button>
            )}
            {onCancel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-destructive"
                onClick={onCancel}
                title="Cancel"
              >
                <Square className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
      {isDownloading && progress.total > 0 && (
        <div className="h-1 w-full max-w-[200px] rounded-full bg-muted overflow-hidden">
          <svg
            className="block h-1 w-full"
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
            aria-hidden
          >
            <rect
              x={0}
              y={0}
              width={pct}
              height={1}
              className="fill-primary"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
