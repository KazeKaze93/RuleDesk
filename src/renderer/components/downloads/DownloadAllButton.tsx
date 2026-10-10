import React, { useState } from "react";
import { Button } from "../ui/button";
import { Download, Loader2, Square, Pause, Play, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DownloadFailure } from "@shared/types/download";
import { downloadFailureCodeLabel } from "@shared/utils/download-failure";
import { useDownloadStore } from "../../store/downloadStore";

const DOWNLOAD_IN_PROGRESS_TITLE = "Download in progress";
const LOADED_IDLE_LABEL = (count: string | number): string =>
  `Download ${count} loaded posts`;
const LOADED_IDLE_HELP = (count: string | number): string =>
  `Downloads ${count} loaded posts. To download everything from an artist, track them.`;
const ALL_IDLE_LABEL = (count: string | number): string =>
  `Download All (${count})`;
const ALL_IDLE_HELP = (count: string | number): string =>
  `Download ${count} files`;

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
  /**
   * Idle button label mode. Artist library uses "all"; loaded UI slices use "loaded".
   */
  labelMode?: "all" | "loaded";
  failures?: DownloadFailure[];
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
  labelMode = "all",
  failures = [],
  size = "sm",
  className,
}) => {
  const isAnyDownloadActive = useDownloadStore((s) => s.isDownloading);
  const [failuresOpen, setFailuresOpen] = useState(false);
  const pct = progress.total > 0 ? Math.round((progress.done * 100) / progress.total) : 0;
  const disabled = !canDownload || (isAnyDownloadActive && !isDownloading);
  const idleLabel =
    labelMode === "loaded"
      ? LOADED_IDLE_LABEL(totalLabel)
      : ALL_IDLE_LABEL(totalLabel);
  const idleTitle =
    disabled && isAnyDownloadActive
      ? DOWNLOAD_IN_PROGRESS_TITLE
      : labelMode === "loaded"
        ? LOADED_IDLE_HELP(totalLabel)
        : ALL_IDLE_HELP(totalLabel);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        {!isDownloading ? (
          <Button
            variant="outline"
            size={size}
            onClick={onClick}
            disabled={disabled}
            title={idleTitle}
            aria-label={idleTitle}
          >
            <Download className="w-4 h-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">{idleLabel}</span>
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
      {!isDownloading && failures.length > 0 && (
        <div className="max-w-md text-xs text-destructive">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0.5 text-xs text-destructive"
            onClick={() => setFailuresOpen((open) => !open)}
            aria-expanded={failuresOpen}
          >
            {failuresOpen ? (
              <ChevronUp className="w-3 h-3 mr-1" />
            ) : (
              <ChevronDown className="w-3 h-3 mr-1" />
            )}
            {failures.length} failed
          </Button>
          {failuresOpen ? (
            <ul className="mt-1 max-h-32 overflow-y-auto pl-2 space-y-0.5 text-muted-foreground">
              {failures.map((f) => (
                <li key={f.itemId}>
                  {f.itemId}: {downloadFailureCodeLabel(f.code)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
};
