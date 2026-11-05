import log from "electron-log/renderer";
import { Download, Pause, Play, Square } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useDownloadStore } from "../../store/downloadStore";

const DOWNLOADING_LABEL = "Downloading";
const PAUSED_LABEL = "Paused";
const PAUSE_ARIA_LABEL = "Pause download";
const RESUME_ARIA_LABEL = "Resume download";
const CANCEL_ARIA_LABEL = "Cancel download";
const PAUSE_TITLE = "Pause";
const RESUME_TITLE = "Resume";
const CANCEL_TITLE = "Cancel";

function formatDownloadCounter(done: number, total: number): string {
  return `${done}/${total}`;
}

/**
 * Persistent sidebar mass-download status: counter, bar, pause/resume, cancel.
 * Visible only while downloadStore.isDownloading.
 * Status (Downloading / Paused) uses aria-live; the per-file counter is visual
 * only and mirrored by the native progress value/max (aria-valuenow/max).
 * Batch end is announced by the result toast, not this indicator.
 */
export function GlobalDownloadIndicator() {
  const isDownloading = useDownloadStore((s) => s.isDownloading);
  const isPaused = useDownloadStore((s) => s.isPaused);
  const progress = useDownloadStore((s) => s.progress);
  const setPaused = useDownloadStore((s) => s.setPaused);

  const handlePause = () => {
    void window.api
      .pauseDownloadAll()
      .then(() => {
        setPaused(true);
      })
      .catch((error: unknown) => {
        log.error("[GlobalDownloadIndicator] pauseDownloadAll failed:", error);
        setPaused(false);
      });
  };

  const handleResume = () => {
    void window.api
      .resumeDownloadAll()
      .then(() => {
        setPaused(false);
      })
      .catch((error: unknown) => {
        log.error("[GlobalDownloadIndicator] resumeDownloadAll failed:", error);
        setPaused(true);
      });
  };

  const handleCancel = () => {
    void window.api.cancelDownloadAll().catch((error: unknown) => {
      log.error("[GlobalDownloadIndicator] cancelDownloadAll failed:", error);
    });
  };

  if (!isDownloading) {
    return null;
  }

  const counterText = formatDownloadCounter(progress.done, progress.total);
  const statusLabel = isPaused ? PAUSED_LABEL : DOWNLOADING_LABEL;

  return (
    <div
      className="space-y-2 rounded-md border bg-background p-2"
      data-testid="global-download-indicator"
    >
      <div className="flex items-center gap-2 min-w-0">
        {isPaused ? (
          <Pause className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <Download className="w-4 h-4 shrink-0 text-primary" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" aria-live="polite">
            {statusLabel}
          </p>
          <p className="truncate text-xs text-muted-foreground" aria-hidden>
            {counterText}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={isPaused ? handleResume : handlePause}
            aria-label={isPaused ? RESUME_ARIA_LABEL : PAUSE_ARIA_LABEL}
            title={isPaused ? RESUME_TITLE : PAUSE_TITLE}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <Pause className="w-3.5 h-3.5" aria-hidden />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleCancel}
            aria-label={CANCEL_ARIA_LABEL}
            title={CANCEL_TITLE}
          >
            <Square className="w-3.5 h-3.5" aria-hidden />
          </Button>
        </div>
      </div>
      {progress.total > 0 ? (
        <Progress
          value={progress.done}
          max={progress.total}
          aria-label={DOWNLOADING_LABEL}
        />
      ) : null}
    </div>
  );
}
