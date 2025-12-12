import React, { useEffect, useState } from "react";
import { Download, RefreshCw, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export const UpdateNotification: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const removeStatusListener = window.api.onUpdateStatus((data) => {
      if (data.status === "checking" || data.status === "not-available") {
        return;
      }

      setStatus(data.status as UpdateStatus);
      if (data.message) setMessage(data.message);

      setVisible(true);
    });

    const removeProgressListener = window.api.onUpdateProgress((percent) => {
      setStatus("downloading");
      setProgress(Math.round(percent));
      setVisible(true);
    });

    return () => {
      removeStatusListener();
      removeProgressListener();
    };
  }, []);

  const handleClose = () => setVisible(false);

  const handleInstall = () => {
    window.api.quitAndInstall();
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 p-4 w-80 rounded-lg border shadow-lg bg-background border-border animate-in slide-in-from-bottom-5"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          {status === "downloading" && (
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          {status === "available" && (
            <Download className="w-5 h-5 text-yellow-500" />
          )}
          {status === "downloaded" && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {status === "error" && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}

          <div>
            <h4 className="text-sm font-semibold">
              {status === "available" && "New version found!"}
              {status === "downloading" && "Downloading update..."}
              {status === "downloaded" && "Update ready"}
              {status === "error" && "Update failed"}
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {status === "downloading" && `${progress}% completed`}
              {status === "downloaded" && "Restart to install new features"}
              {status === "error" && message}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {status === "downloading" && (
        <div className="overflow-hidden mt-3 w-full h-2 rounded-full bg-secondary">
          <div
            className="h-full transition-all duration-300 ease-out bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === "downloaded" && (
        <button
          onClick={handleInstall}
          className="px-4 py-2 mt-3 w-full text-sm font-medium rounded transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Restart & Install
        </button>
      )}
    </div>
  );
};
