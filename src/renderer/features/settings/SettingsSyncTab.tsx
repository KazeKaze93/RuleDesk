import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface SettingsSyncTabProps {
  autoSyncOnStartup: boolean;
  syncIntervalMinutes: string;
  isManualSyncRunning: boolean;
  manualSyncStatus: "idle" | "success" | "error";
  lastSyncStatusText: string;
  onAutoSyncChange: (checked: boolean) => void;
  onSyncIntervalChange: (value: string) => void;
  onManualSync: () => void;
}

export const SettingsSyncTab = ({
  autoSyncOnStartup,
  syncIntervalMinutes,
  isManualSyncRunning,
  manualSyncStatus,
  lastSyncStatusText,
  onAutoSyncChange,
  onSyncIntervalChange,
  onManualSync,
}: SettingsSyncTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync</CardTitle>
        <CardDescription>Automatic behavior and on-demand synchronization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="flex items-start justify-between gap-4 rounded-md border p-4">
          <section className="space-y-1">
            <Label htmlFor="auto-sync-on-startup">Sync on startup</Label>
            <p className="text-sm text-muted-foreground">
              Automatically run sync when the application opens.
            </p>
          </section>
          <Switch
            id="auto-sync-on-startup"
            checked={autoSyncOnStartup}
            onCheckedChange={onAutoSyncChange}
          />
        </section>

        <section className="space-y-2 rounded-md border p-4">
          <Label htmlFor="sync-interval">Sync interval</Label>
          <Select value={syncIntervalMinutes} onValueChange={onSyncIntervalChange}>
            <SelectTrigger id="sync-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Disabled</SelectItem>
              <SelectItem value="15">Every 15 minutes</SelectItem>
              <SelectItem value="30">Every 30 minutes</SelectItem>
              <SelectItem value="60">Every hour</SelectItem>
              <SelectItem value="120">Every 2 hours</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-2 rounded-md border p-4">
          <Label>Manual sync</Label>
          <section className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onManualSync}
              disabled={isManualSyncRunning}
            >
              {isManualSyncRunning ? "Syncing..." : "Sync Now"}
            </Button>
            {manualSyncStatus === "success" ? (
              <Badge className="border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300">
                Completed
              </Badge>
            ) : null}
            {manualSyncStatus === "error" ? (
              <Badge className="border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300">
                Failed
              </Badge>
            ) : null}
          </section>
          <p className="text-sm text-muted-foreground">{lastSyncStatusText}</p>
        </section>
      </CardContent>
    </Card>
  );
};
