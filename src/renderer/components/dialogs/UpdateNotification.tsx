import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useTranslation } from "react-i18next";
import { Loader2, Download, RefreshCw } from "lucide-react";
import type { UpdateStatusData } from "../../../main/bridge";

export const UpdateNotification = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<
    "available" | "downloading" | "downloaded" | "error"
  >("available");
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState("");
  const [isPortable, setIsPortable] = useState(false);

  useEffect(() => {
    const removeStatusListener = window.api.onUpdateStatus(
      (data: UpdateStatusData) => {
        console.log("Update status:", data);

        if (data.status === "available") {
          setVersion(data.version || "");
          setIsPortable(!!data.isPortable);
          setIsOpen(true);
          setStatus("available");
        } else if (data.status === "downloading") {
          setStatus("downloading");
        } else if (data.status === "downloaded") {
          setStatus("downloaded");
        } else if (data.status === "error") {
          setStatus("error");
          console.error("Update error:", data.message);
        }
      }
    );

    const removeProgressListener = window.api.onUpdateProgress(
      (percent: number) => {
        setProgress(percent);
      }
    );

    return () => {
      removeStatusListener();
      removeProgressListener();
    };
  }, []);

  const handleAction = () => {
    if (status === "available") {
      window.api.startDownload();
      if (!isPortable) {
        setStatus("downloading");
      } else {
        setIsOpen(false);
      }
    } else if (status === "downloaded") {
      window.api.quitAndInstall();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <RefreshCw className="w-5 h-5 text-primary" />
            {t("updates.newVersionTitle", "Update Available")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "updates.newVersionDesc",
              "A new version {{version}} is available.",
              { version }
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {status === "downloading" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Downloading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {status === "downloaded" && (
            <div className="p-3 text-sm text-green-500 rounded-md bg-green-500/10">
              Update downloaded and ready to install.
            </div>
          )}

          {status === "error" && (
            <div className="p-3 text-sm text-red-500 rounded-md bg-red-500/10">
              Failed to download update. Please try again later.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t("common.cancel", "Cancel")}
          </Button>

          <Button onClick={handleAction} disabled={status === "downloading"}>
            {status === "available" && (
              <>
                <Download className="mr-2 w-4 h-4" />
                {isPortable
                  ? "Open Download Page"
                  : t("updates.download", "Download")}
              </>
            )}
            {status === "downloading" && (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Downloading...
              </>
            )}
            {status === "downloaded" &&
              t("updates.restart", "Restart & Install")}
            {status === "error" && "Retry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
