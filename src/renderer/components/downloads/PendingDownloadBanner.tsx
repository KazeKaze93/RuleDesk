import React, { useEffect, useState } from "react";
import log from "electron-log/renderer";
import { Button } from "../ui/button";
import { Download, X } from "lucide-react";
import { useDownloadStore } from "../../store/downloadStore";
import { presentDownloadAllResult } from "../../lib/download-result-ui";
import type { PendingDownloadInfo } from "@shared/types/download";

const RESUME_LABEL = "Resume";
const INTERRUPTED_GENERIC_MESSAGE = (
  done: number,
  total: number,
  remaining: number
): string =>
  `Interrupted download: ${done}/${total} done. ${remaining} remaining.`;
const INTERRUPTED_FAVORITES_MESSAGE = (done: number, total: number): string =>
  `Interrupted favorites download — ${done} of ${total}`;

type PendingBannerState = Pick<
  PendingDownloadInfo,
  "total" | "done" | "folder" | "kind"
>;

const checkPending = async (): Promise<PendingBannerState | null> => {
  try {
    const p = await window.api.getPendingDownload();
    if (p?.hasPending) {
      return {
        total: p.total,
        done: p.done,
        folder: p.folder,
        kind: p.kind,
      };
    }
  } catch (error: unknown) {
    log.error("[PendingDownloadBanner] Failed to check pending download:", error);
  }
  return null;
};

export const PendingDownloadBanner: React.FC = () => {
  const isDownloading = useDownloadStore((s) => s.isDownloading);
  const setDownloading = useDownloadStore((s) => s.setDownloading);
  const [pending, setPending] = useState<PendingBannerState | null>(null);

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
  const message =
    pending.kind === "favorites"
      ? INTERRUPTED_FAVORITES_MESSAGE(pending.done, pending.total)
      : INTERRUPTED_GENERIC_MESSAGE(pending.done, pending.total, remaining);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-primary" />
        <span>{message}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            void handleResume();
          }}
        >
          {RESUME_LABEL}
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
