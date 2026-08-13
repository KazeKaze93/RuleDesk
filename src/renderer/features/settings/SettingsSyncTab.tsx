import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface SettingsSyncTabProps {
  autoSyncOnStartup: boolean;
  autoSyncOnArtistAdd: boolean;
  syncIntervalMinutes: string;
  onAutoSyncChange: (checked: boolean) => void;
  onAutoSyncOnArtistAddChange: (checked: boolean) => void;
  onSyncIntervalChange: (value: string) => void;
}

export const SettingsSyncTab = ({
  autoSyncOnStartup,
  autoSyncOnArtistAdd,
  syncIntervalMinutes,
  onAutoSyncChange,
  onAutoSyncOnArtistAddChange,
  onSyncIntervalChange,
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

        <section className="flex items-start justify-between gap-4 rounded-md border p-4">
          <section className="space-y-1">
            <Label htmlFor="auto-sync-on-artist-add">Sync new artist automatically</Label>
            <p className="text-sm text-muted-foreground">
              Automatically sync a new artist right after adding it.
            </p>
          </section>
          <Switch
            id="auto-sync-on-artist-add"
            checked={autoSyncOnArtistAdd}
            onCheckedChange={onAutoSyncOnArtistAddChange}
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
      </CardContent>
    </Card>
  );
};
