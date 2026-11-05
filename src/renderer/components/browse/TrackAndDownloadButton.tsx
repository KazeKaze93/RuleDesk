import { Button } from "../ui/button";
import {
  Download,
  Loader2,
  Pause,
  Play,
  Square,
  UserPlus,
} from "lucide-react";
import { useDownloadStore } from "../../store/downloadStore";
import type { TrackAndDownloadPhase } from "../../hooks/useTrackAndDownloadArtist";
import {
  TRACK_AND_DOWNLOAD_ARIA_LABEL,
  TRACK_AND_DOWNLOAD_LABEL,
} from "../../lib/browse-track-download";
import { Progress } from "../ui/progress";

const SYNCING_LABEL = "Syncing…";
const PROGRESS_MAX_PERCENT = 100;

export type TrackAndDownloadButtonProps = {
  onClick: () => void;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  phase: TrackAndDownloadPhase;
};

export function TrackAndDownloadButton({
  onClick,
  onCancel,
  onPause,
  onResume,
  phase,
}: TrackAndDownloadButtonProps) {
  const isAnyDownloadActive = useDownloadStore((s) => s.isDownloading);
  const isPaused = useDownloadStore((s) => s.isPaused);
  const progress = useDownloadStore((s) => s.progress);
  const isSyncing = phase === "syncing";
  const isDownloading = phase === "downloading";
  const isBusy = isSyncing || isDownloading;
  const pct =
    progress.total > 0
      ? Math.round((progress.done * PROGRESS_MAX_PERCENT) / progress.total)
      : 0;
  const idleDisabled = isAnyDownloadActive && !isDownloading;

  if (!isBusy) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={idleDisabled}
        aria-label={TRACK_AND_DOWNLOAD_ARIA_LABEL}
        title={
          idleDisabled
            ? "Download in progress"
            : TRACK_AND_DOWNLOAD_ARIA_LABEL
        }
      >
        <UserPlus className="w-4 h-4 sm:mr-2" aria-hidden />
        <span className="hidden sm:inline">{TRACK_AND_DOWNLOAD_LABEL}</span>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative overflow-hidden pr-16"
          disabled
          aria-busy
          aria-label={
            isSyncing
              ? SYNCING_LABEL
              : `Downloading ${progress.done} of ${progress.total}`
          }
        >
          {isDownloading && progress.total > 0 ? (
            <div className="absolute inset-0" aria-hidden>
              <Progress
                value={pct}
                max={PROGRESS_MAX_PERCENT}
                className="h-full rounded-none border-0"
              />
            </div>
          ) : null}
          <span className="relative flex items-center gap-2">
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : isPaused ? (
              <Pause className="w-4 h-4" aria-hidden />
            ) : (
              <Download className="w-4 h-4" aria-hidden />
            )}
            <span className="text-xs" aria-live="polite">
              {isSyncing
                ? SYNCING_LABEL
                : `${progress.done}/${progress.total}`}
            </span>
          </span>
        </Button>
        {isDownloading && onPause && onResume ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={isPaused ? onResume : onPause}
            aria-label={isPaused ? "Resume download" : "Pause download"}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="w-4 h-4" aria-hidden />
            ) : (
              <Pause className="w-4 h-4" aria-hidden />
            )}
          </Button>
        ) : null}
        {isDownloading && onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive"
            onClick={onCancel}
            aria-label="Cancel download"
            title="Cancel"
          >
            <Square className="w-4 h-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      {isDownloading && progress.total > 0 ? (
        <Progress
          value={pct}
          max={PROGRESS_MAX_PERCENT}
          className="h-1 max-w-[200px]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
