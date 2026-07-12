import { useState } from "react";
import { toast } from "sonner";
import log from "electron-log/renderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

interface SettingsGeneralTabProps {
  downloadFolder: string | null;
  downloadFolderStatus: "idle" | "success" | "error";
  duplicateFileBehavior: "skip" | "overwrite";
  downloadFolderStructure: "flat" | "{artist_id}";
  proxyUrl: string | null;
  proxyError: string | null;
  proxyStatus: "idle" | "success" | "error";
  onSelectDownloadFolder: () => void;
  onResetDownloadFolder: () => void;
  onDuplicateFileBehaviorChange: (value: "skip" | "overwrite") => void;
  onDownloadFolderStructureChange: (value: "flat" | "{artist_id}") => void;
  onProxyUrlChange: (value: string) => void;
  onProxyBlur: () => void;
  onSaveProxy: () => void;
}

export const SettingsGeneralTab = ({
  downloadFolder,
  downloadFolderStatus,
  duplicateFileBehavior,
  downloadFolderStructure,
  proxyUrl,
  proxyError,
  proxyStatus,
  onSelectDownloadFolder,
  onResetDownloadFolder,
  onDuplicateFileBehaviorChange,
  onDownloadFolderStructureChange,
  onProxyUrlChange,
  onProxyBlur,
  onSaveProxy,
}: SettingsGeneralTabProps) => {
  const [wipeDialogOpen, setWipeDialogOpen] = useState(false);
  const [wipeAcknowledged, setWipeAcknowledged] = useState(false);
  const [wipeInProgress, setWipeInProgress] = useState(false);

  const handleWipeDialogOpenChange = (open: boolean) => {
    if (wipeInProgress) {
      return;
    }
    setWipeDialogOpen(open);
    if (!open) {
      setWipeAcknowledged(false);
    }
  };

  const handleWipeAllData = async () => {
    if (!wipeAcknowledged || wipeInProgress) {
      return;
    }
    setWipeInProgress(true);
    try {
      await window.api.wipeAllData();
      // Process exits on success; if we return, something went wrong upstream.
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete application data.";
      log.error("[Settings] wipeAllData failed:", message);
      toast.error(message);
      setWipeInProgress(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Default download and connection preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="space-y-3">
            <Label>Default download folder</Label>
            <p className="text-sm text-muted-foreground break-all">
              {downloadFolder ?? "Default (Downloads/BooruClient)"}
            </p>
            <section className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onSelectDownloadFolder}>
                Choose Folder
              </Button>
              {downloadFolder ? (
                <Button type="button" variant="ghost" size="sm" onClick={onResetDownloadFolder}>
                  Reset to Default
                </Button>
              ) : null}
              {downloadFolderStatus === "success" ? (
                <Badge className="border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300">
                  Updated
                </Badge>
              ) : null}
              {downloadFolderStatus === "error" ? (
                <Badge className="border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300">
                  Update failed
                </Badge>
              ) : null}
            </section>
          </section>

          <Separator />

          <section className="space-y-2">
            <Label htmlFor="duplicate-file-behavior">When file already exists</Label>
            <Select value={duplicateFileBehavior} onValueChange={onDuplicateFileBehaviorChange}>
              <SelectTrigger id="duplicate-file-behavior">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">Skip (keep existing)</SelectItem>
                <SelectItem value="overwrite">Overwrite</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-2">
            <Label htmlFor="download-folder-structure">Folder structure</Label>
            <Select
              value={downloadFolderStructure}
              onValueChange={onDownloadFolderStructureChange}
            >
              <SelectTrigger id="download-folder-structure">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat (single folder)</SelectItem>
                <SelectItem value="{artist_id}">By artist (subfolder)</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <Separator />

          <section className="space-y-2">
            <Label htmlFor="proxy-url">Proxy URL</Label>
            <Input
              id="proxy-url"
              placeholder="https://proxy.example.com:8080"
              value={proxyUrl ?? ""}
              onChange={(event) => onProxyUrlChange(event.target.value)}
              onBlur={onProxyBlur}
            />
            <p className="text-xs text-muted-foreground">
              Optional HTTP/HTTPS proxy for requests and downloads.
            </p>
            {proxyError ? <p className="text-sm text-destructive">{proxyError}</p> : null}
            <section className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onSaveProxy}>
                Save Proxy
              </Button>
              {proxyStatus === "success" ? (
                <Badge className="border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300">
                  Saved
                </Badge>
              ) : null}
              {proxyStatus === "error" ? (
                <Badge className="border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300">
                  Save failed
                </Badge>
              ) : null}
            </section>
          </section>
        </CardContent>
      </Card>

      <Card className="mt-4 border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete all local RuleDesk data stored under the hidden{" "}
            <span className="font-mono">.rdcache</span> folder, then quit the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This removes the database (<span className="font-mono">data.bin</span> and
            WAL/SHM), video cache, logs, backup schedule, in-app DB backups, download
            queue, and other Electron cache files inside{" "}
            <span className="font-mono">.rdcache</span>. Your chosen media download folder
            outside that directory is not touched. After restart you will see the age gate
            and onboarding again.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              setWipeAcknowledged(false);
              setWipeDialogOpen(true);
            }}
          >
            Delete all data…
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={wipeDialogOpen} onOpenChange={handleWipeDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all local data?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Everything in{" "}
              <span className="font-mono">.rdcache</span> will be erased and the app will
              quit. Reinstalling or deleting the .exe alone does not remove this folder —
              use this action (or delete{" "}
              <span className="font-mono">.rdcache</span> manually) when you want a clean
              wipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <section className="flex items-start gap-3 py-2">
            <Checkbox
              id="wipe-acknowledge"
              checked={wipeAcknowledged}
              disabled={wipeInProgress}
              onCheckedChange={(checked) => {
                setWipeAcknowledged(checked === true);
              }}
            />
            <Label htmlFor="wipe-acknowledge" className="text-sm font-normal leading-snug">
              I understand this permanently deletes my local library, settings, and
              credentials.
            </Label>
          </section>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={wipeInProgress}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!wipeAcknowledged || wipeInProgress}
              onClick={() => {
                void handleWipeAllData();
              }}
            >
              {wipeInProgress ? "Deleting…" : "Delete all data"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
