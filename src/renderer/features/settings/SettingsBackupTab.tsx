import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Input } from "../../components/ui/input";

interface SettingsBackupTabProps {
  databaseLocation: string;
  isBackingUp: boolean;
  isRestoring: boolean;
  isCheckingIntegrity: boolean;
  backupStatus: "idle" | "success" | "error";
  restoreStatus: "idle" | "success" | "error";
  integrityResult: { ok: boolean; details: string } | null;
  backupRetention: string;
  onBackup: () => void;
  onRestore: () => void;
  onIntegrityCheck: () => void;
  onBackupRetentionChange: (value: string) => void;
  onBackupRetentionBlur: () => void;
}

export const SettingsBackupTab = ({
  databaseLocation,
  isBackingUp,
  isRestoring,
  isCheckingIntegrity,
  backupStatus,
  restoreStatus,
  integrityResult,
  backupRetention,
  onBackup,
  onRestore,
  onIntegrityCheck,
  onBackupRetentionChange,
  onBackupRetentionBlur,
}: SettingsBackupTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup</CardTitle>
        <CardDescription>Manage backups and verify database integrity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-1 rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Database location</p>
          <p className="text-sm break-all">{databaseLocation || "Loading..."}</p>
        </section>

        <section className="space-y-2">
          <Button type="button" variant="outline" onClick={onBackup} disabled={isBackingUp}>
            {isBackingUp ? "Creating backup..." : "Create Backup"}
          </Button>
          {backupStatus === "success" ? (
            <Badge className="border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300">
              Backup created
            </Badge>
          ) : null}
          {backupStatus === "error" ? (
            <Badge className="border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300">
              Backup failed
            </Badge>
          ) : null}
        </section>

        <Separator />

        <section className="space-y-2">
          <Button type="button" variant="outline" onClick={onRestore} disabled={isRestoring}>
            {isRestoring ? "Restoring..." : "Restore Backup"}
          </Button>
          {restoreStatus === "success" ? (
            <Badge className="border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300">
              Restore completed, reloading
            </Badge>
          ) : null}
          {restoreStatus === "error" ? (
            <Badge className="border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300">
              Restore failed
            </Badge>
          ) : null}
        </section>

        <Separator />

        <section className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={onIntegrityCheck}
            disabled={isCheckingIntegrity}
          >
            {isCheckingIntegrity ? "Checking integrity..." : "Check Integrity"}
          </Button>
          {integrityResult ? (
            <Badge
              className={
                integrityResult.ok
                  ? "border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300"
                  : "border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300"
              }
            >
              {integrityResult.ok ? "Database integrity OK" : "Integrity issues detected"}
            </Badge>
          ) : null}
          {!integrityResult?.ok && integrityResult ? (
            <p className="text-sm text-destructive whitespace-pre-wrap">{integrityResult.details}</p>
          ) : null}
        </section>

        <Separator />

        <section className="space-y-1">
          <p className="text-sm font-medium">Retention</p>
          <label className="space-y-2">
            <span className="text-sm text-muted-foreground">Keep last N backups</span>
            <Input
              type="number"
              min={1}
              max={20}
              value={backupRetention}
              onChange={(event) => {
                onBackupRetentionChange(event.target.value);
              }}
              onBlur={onBackupRetentionBlur}
            />
          </label>
        </section>
      </CardContent>
    </Card>
  );
};
