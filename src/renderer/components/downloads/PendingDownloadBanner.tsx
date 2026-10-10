import React, { useEffect, useState } from "react";
import log from "electron-log/renderer";
import { Button } from "../ui/button";
import { Download, X } from "lucide-react";
import { useDownloadStore } from "../../store/downloadStore";
import { presentDownloadAllResult } from "../../lib/download-result-ui";

const checkPending = async () => {
  try {
    const p = await window.api.getPendingDownload();
    if (p?.hasPending) {
      return { total: p.total, done: p.done, folder: p.folder };
    }
  } catch {
    /* ignore */
  }
  return null;
};

export const PendingDownloadBanner: React.FC = () => {
  const isDownloading = useDownloadStore((s) => s.isDownloading);
  const setDownloading = useDownloadStore((s) => s.setDownloading);
  const [pending, setPending] = useState<{
    total: number;
    done: number;
    folder: string;
  } | null>(null);

  useEffect(() => {
    void checkPending().then(setPending);
    const unsub = window.api.onPendingDownloadStateChanged(() => {
      void checkPending().then(setPending);
    });
    return unsub;
  }, []);

  const handleResume = async () => {
    setDownloading(true);
    setPending(null);
    try {
      const result = await window.api.resumePendingDownload();
      presentDownloadAllResult(result);
    } catch (error) {
      presentDownloadAllResult({
        success: false,
        downloaded: 0,
        failed: [],
        canceled: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setDownloading(false);
      void checkPending().then(setPending);
    }
  };

  const handleDismiss = async () => {
    await window.api.dismissPendingDownload();
    setPending(null);
  };

  if (!pending || isDownloading) return null;

  const remaining = pending.total - pending.done;
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-primary" />
        <span>
          Interrupted download: {pending.done}/{pending.total} done. {remaining}{" "}
          remaining.
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            void handleResume();
          }}
        >
          Resume
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void handleDismiss().catch((error: unknown) => {
              log.error("[PendingDownloadBanner] Failed to dismiss pending download:", error);
            });
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
