import React, { useEffect, useState } from "react";
import log from "electron-log/renderer";
import { z } from "zod";
import { Download, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const UpdateStatusSchema = z.enum(["available"]);
type UpdateStatus = z.infer<typeof UpdateStatusSchema>;

export const UpdateNotification: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus | "idle">("idle");
  const [version, setVersion] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const removeStatusListener = window.api.onUpdateStatus((data) => {
      // Quiet for checking / not-available / any unexpected statuses (incl. legacy error).
      if (data.status !== "available") {
        return;
      }

      const parsed = UpdateStatusSchema.safeParse(data.status);
      if (!parsed.success) return;
      setStatus(parsed.data);
      if (data.version) setVersion(data.version);
      setVisible(true);
    });

    return () => {
      removeStatusListener();
    };
  }, []);

  const handleClose = () => setVisible(false);
  const handleOpenRelease = () => {
    void window.api.openReleasePage().catch((error: unknown) => {
      log.error("[UpdateNotification] Failed to open release page:", error);
    });
  };

  if (!visible || status !== "available") return null;

  const openReleaseLabel = version
    ? `Open release page for version ${version}`
    : "Open GitHub release page";

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 p-4 w-80 rounded-lg border shadow-xl bg-slate-900 border-slate-700 animate-in slide-in-from-bottom-5 text-slate-100"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center">
          <Download className="w-5 h-5 text-yellow-400" aria-hidden />
          <div>
            <h4 className="text-sm font-semibold">
              {version
                ? `Update v${version} available`
                : "Update available"}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Open the GitHub release page to download the ZIP or AppImage.
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-slate-500 hover:text-slate-300"
          aria-label="Close update notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={handleOpenRelease}
          className="w-full bg-blue-600 hover:bg-blue-500"
          aria-label={openReleaseLabel}
        >
          Open release page
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClose}
          className="w-full border-slate-700 hover:bg-slate-800"
          aria-label="Dismiss update notification"
        >
          Later
        </Button>
      </div>
    </div>
  );
};
