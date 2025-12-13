import React, { useEffect, useState } from "react";
import { Download, RefreshCw, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button"; // Используем твой компонент кнопки

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
  const [version, setVersion] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const removeStatusListener = window.api.onUpdateStatus((data) => {
      // Игнорируем проверку и отсутствие обновлений (тихий режим)
      if (data.status === "checking" || data.status === "not-available") {
        return;
      }

      setStatus(data.status as UpdateStatus);
      if (data.version) setVersion(data.version);

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
  const handleDownload = () => window.api.startDownload(); // 👈 Вызов скачивания
  const handleInstall = () => window.api.quitAndInstall();

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 p-4 w-80 rounded-lg border shadow-xl bg-slate-900 border-slate-700 animate-in slide-in-from-bottom-5 text-slate-100"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center">
          {status === "downloading" && (
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          )}
          {status === "available" && (
            <Download className="w-5 h-5 text-yellow-400" />
          )}
          {status === "downloaded" && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          {status === "error" && (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}

          <div>
            <h4 className="text-sm font-semibold">
              {status === "available" && `Update v${version} available`}
              {status === "downloading" && "Downloading update..."}
              {status === "downloaded" && "Ready to install"}
              {status === "error" && "Update failed"}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {status === "downloading" && `${progress}% completed`}
              {status === "downloaded" && "Restart required"}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-slate-500 hover:text-slate-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {status === "downloading" && (
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex gap-2 mt-3">
        {status === "available" && (
          <>
            <Button
              size="sm"
              onClick={handleDownload}
              className="w-full bg-blue-600 hover:bg-blue-500"
            >
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClose}
              className="w-full border-slate-700 hover:bg-slate-800"
            >
              Later
            </Button>
          </>
        )}

        {status === "downloaded" && (
          <Button
            size="sm"
            onClick={handleInstall}
            className="w-full bg-green-600 hover:bg-green-500"
          >
            Restart & Install
          </Button>
        )}
      </div>
    </div>
  );
};
