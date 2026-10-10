import { useEffect, useState } from "react";
import { toast } from "sonner";
import log from "electron-log/renderer";
import { Copy, FolderOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import type { AppInfo } from "@shared/schemas/system";

const LOADING_LABEL = "Loading…";

function formatOsLabel(info: AppInfo): string {
  return `${info.osPlatform} ${info.osRelease} (${info.osArch})`;
}

export const SettingsHelpTab = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isOpeningLogs, setIsOpeningLogs] = useState(false);
  const [isCopyingDiagnostics, setIsCopyingDiagnostics] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.api
      .getAppInfo()
      .then((info) => {
        if (!cancelled) {
          setAppInfo(info);
        }
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Failed to load app info.";
        log.error("[SettingsHelpTab] getAppInfo failed:", message);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenLogsFolder = async () => {
    if (isOpeningLogs) {
      return;
    }
    setIsOpeningLogs(true);
    try {
      const result = await window.api.openLogsFolder();
      if (!result.ok) {
        log.error("[SettingsHelpTab] openLogsFolder failed:", result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Logs folder opened");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not open the logs folder.";
      log.error("[SettingsHelpTab] openLogsFolder failed:", message);
      toast.error(message);
    } finally {
      setIsOpeningLogs(false);
    }
  };

  const handleCopyDiagnostics = async () => {
    if (isCopyingDiagnostics) {
      return;
    }
    setIsCopyingDiagnostics(true);
    try {
      const diagnostics = await window.api.getDiagnostics();
      const wrote = await window.api.writeToClipboard(diagnostics.clipboardText);
      if (!wrote) {
        throw new Error("Could not write diagnostics to the clipboard.");
      }
      toast.success("Diagnostics copied to clipboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not copy diagnostics.";
      log.error("[SettingsHelpTab] getDiagnostics/copy failed:", message);
      toast.error(message);
    } finally {
      setIsCopyingDiagnostics(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Help</CardTitle>
        <CardDescription>
          Version info and diagnostics for bug reports. Log excerpts are redacted
          before copy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-2" aria-label="Application versions">
          <p className="text-sm font-medium">Versions</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">App</dt>
              <dd className="font-mono">{appInfo?.appVersion ?? LOADING_LABEL}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Electron</dt>
              <dd className="font-mono">
                {appInfo?.electronVersion ?? LOADING_LABEL}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Chromium</dt>
              <dd className="font-mono">
                {appInfo?.chromeVersion ?? LOADING_LABEL}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Node</dt>
              <dd className="font-mono">
                {appInfo?.nodeVersion ?? LOADING_LABEL}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">OS</dt>
              <dd className="font-mono">
                {appInfo ? formatOsLabel(appInfo) : LOADING_LABEL}
              </dd>
            </div>
          </dl>
        </section>

        <Separator />

        <section className="flex flex-wrap gap-2" aria-label="Diagnostics actions">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void handleOpenLogsFolder();
            }}
            disabled={isOpeningLogs}
            aria-label="Open logs folder"
          >
            <FolderOpen className="size-4" aria-hidden="true" />
            {isOpeningLogs ? "Opening…" : "Open logs folder"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void handleCopyDiagnostics();
            }}
            disabled={isCopyingDiagnostics}
            aria-label="Copy diagnostics to clipboard"
          >
            <Copy className="size-4" aria-hidden="true" />
            {isCopyingDiagnostics ? "Copying…" : "Copy diagnostics"}
          </Button>
        </section>
      </CardContent>
    </Card>
  );
};
