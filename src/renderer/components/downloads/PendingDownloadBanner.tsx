import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Download, X } from "lucide-react";
import { useDownloadStore } from "../../store/downloadStore";

export const PendingDownloadBanner: React.FC = () => {
  const { isDownloading, setDownloading } = useDownloadStore();
  const [pending, setPending] = useState<{
    total: number;
    done: number;
    folder: string;
  } | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const p = await window.api.getPendingDownload();
        if (p?.hasPending) {
          setPending({ total: p.total, done: p.done, folder: p.folder });
        } else {
          setPending(null);
        }
      } catch {
        setPending(null);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResume = async () => {
    setDownloading(true);
    setPending(null);
    try {
      const result = await window.api.resumePendingDownload();
      if (result.success) {
        let unsub: () => void;
        const timeout = setTimeout(() => {
          setDownloading(false);
          unsub?.();
        }, 600_000);
        unsub = window.api.onDownloadAllProgress((data) => {
          if (data.total > 0 && data.done >= data.total) {
            clearTimeout(timeout);
            setDownloading(false);
            unsub();
          }
        });
      } else {
        setDownloading(false);
      }
    } catch {
      setDownloading(false);
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
          Interrupted download: {pending.done}/{pending.total} done. {remaining} remaining.
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="default" size="sm" onClick={handleResume}>
          Resume
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
