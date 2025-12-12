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
      console.log("[Updater]", data);

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
        "fixed bottom-4 right-4 z-50 w-80 bg-background border border-border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-5"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {status === "downloading" && (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          )}
          {status === "available" && (
            <Download className="h-5 w-5 text-yellow-500" />
          )}
          {status === "downloaded" && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {status === "error" && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}

          <div>
            <h4 className="font-semibold text-sm">
              {status === "available" && "New version found!"}
              {status === "downloading" && "Downloading update..."}
              {status === "downloaded" && "Update ready"}
              {status === "error" && "Update failed"}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
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
          <X className="h-4 w-4" />
        </button>
      </div>

      {status === "downloading" && (
        <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === "downloaded" && (
        <button
          onClick={handleInstall}
          className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Restart & Install
        </button>
      )}
    </div>
  );
};
