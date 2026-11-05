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

const SYNC_SECTION_TITLE = "Sync";
const SYNC_SECTION_DESCRIPTION = "Automatic behavior and on-demand synchronization.";
const SYNC_ON_STARTUP_LABEL = "Sync on startup";
const SYNC_ON_STARTUP_DESCRIPTION =
  "Automatically run sync when the application opens.";
const SYNC_ON_ARTIST_ADD_LABEL = "Sync new artist automatically";
const SYNC_ON_ARTIST_ADD_DESCRIPTION =
  "Automatically sync a new artist right after adding it.";
const SYNC_INTERVAL_LABEL = "Sync interval";

interface SettingsSyncTabProps {
  autoSyncOnStartup: boolean;
  autoSyncOnArtistAdd: boolean;
  syncIntervalMinutes: string;
  /** When false, omit sync-on-startup (shown in Setup section instead). Default true. */
  showStartupSync?: boolean;
  onAutoSyncChange: (checked: boolean) => void;
  onAutoSyncOnArtistAddChange: (checked: boolean) => void;
  onSyncIntervalChange: (value: string) => void;
}

export const SettingsSyncTab = ({
  autoSyncOnStartup,
  autoSyncOnArtistAdd,
  syncIntervalMinutes,
  showStartupSync = true,
  onAutoSyncChange,
  onAutoSyncOnArtistAddChange,
  onSyncIntervalChange,
}: SettingsSyncTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{SYNC_SECTION_TITLE}</CardTitle>
        <CardDescription>{SYNC_SECTION_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showStartupSync ? (
          <section className="flex items-start justify-between gap-4 rounded-md border p-4">
            <section className="space-y-1">
              <Label htmlFor="auto-sync-on-startup">{SYNC_ON_STARTUP_LABEL}</Label>
              <p className="text-sm text-muted-foreground">{SYNC_ON_STARTUP_DESCRIPTION}</p>
            </section>
            <Switch
              id="auto-sync-on-startup"
              checked={autoSyncOnStartup}
              onCheckedChange={onAutoSyncChange}
            />
          </section>
        ) : null}

        <section className="flex items-start justify-between gap-4 rounded-md border p-4">
          <section className="space-y-1">
            <Label htmlFor="auto-sync-on-artist-add">{SYNC_ON_ARTIST_ADD_LABEL}</Label>
            <p className="text-sm text-muted-foreground">{SYNC_ON_ARTIST_ADD_DESCRIPTION}</p>
          </section>
          <Switch
            id="auto-sync-on-artist-add"
            checked={autoSyncOnArtistAdd}
            onCheckedChange={onAutoSyncOnArtistAddChange}
          />
        </section>

        <section className="space-y-2 rounded-md border p-4">
          <Label htmlFor="sync-interval">{SYNC_INTERVAL_LABEL}</Label>
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
