import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

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
  return (
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
          <Select value={downloadFolderStructure} onValueChange={onDownloadFolderStructureChange}>
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
  );
};
