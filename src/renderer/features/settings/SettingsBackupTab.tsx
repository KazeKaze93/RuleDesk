import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import log from "electron-log/renderer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { DatabaseMaintenanceCard } from "./components/DatabaseMaintenanceCard";
import type {
  RunVacuumResponse,
  VacuumSchedule,
  VacuumStatusResponse,
} from "../../../shared/schemas/maintenance";

type AutoBackupInterval = "never" | "daily" | "weekly";

interface SettingsBackupTabProps {
  databaseLocation: string;
  isBackingUp: boolean;
  isRestoring: boolean;
  isCheckingIntegrity: boolean;
  backupStatus: "idle" | "success" | "error";
  restoreStatus: "idle" | "success" | "error";
  integrityResult: { ok: boolean; details: string } | null;
  backupRetention: string;
  autoBackupInterval: AutoBackupInterval;
  onBackup: () => void;
  onRestore: () => void;
  onIntegrityCheck: () => void;
  onBackupRetentionChange: (value: string) => void;
  onBackupRetentionBlur: () => void;
  onAutoBackupIntervalChange: (value: AutoBackupInterval) => void;
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
  autoBackupInterval,
  onBackup,
  onRestore,
  onIntegrityCheck,
  onBackupRetentionChange,
  onBackupRetentionBlur,
  onAutoBackupIntervalChange,
}: SettingsBackupTabProps) => {
  const queryClient = useQueryClient();
  const vacuumStatusQuery = useQuery<VacuumStatusResponse>({
    queryKey: ["maintenance", "vacuum-status"],
    queryFn: () => window.api.getVacuumStatus(),
    refetchInterval: (query) =>
      query.state.data?.isRunning === true ? 5000 : false,
  });
  const vacuumScheduleQuery = useQuery<VacuumSchedule>({
    queryKey: ["maintenance", "vacuum-schedule"],
    queryFn: () => window.api.getVacuumSchedule(),
  });
  const runVacuumMutation = useMutation<RunVacuumResponse>({
    mutationFn: () => window.api.runVacuum(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["maintenance", "vacuum-status"],
      });
    },
    onError: (error) => {
      log.error("[SettingsBackupTab] Failed to run VACUUM:", error);
    },
  });
  const setVacuumScheduleMutation = useMutation<boolean, Error, VacuumSchedule>({
    mutationFn: (schedule) => window.api.setVacuumSchedule({ schedule }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["maintenance", "vacuum-schedule"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["maintenance", "vacuum-status"],
      });
    },
    onError: (error) => {
      log.error("[SettingsBackupTab] Failed to set VACUUM schedule:", error);
    },
  });

  const vacuumStatus = vacuumStatusQuery.data;
  const selectedSchedule = vacuumScheduleQuery.data ?? "manual";

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
          <Label htmlFor="auto-backup-schedule">Auto-backup</Label>
          <Select
            value={autoBackupInterval}
            onValueChange={(value: AutoBackupInterval) => {
              onAutoBackupIntervalChange(value);
            }}
          >
            <SelectTrigger id="auto-backup-schedule">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
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

        <Separator />

        <DatabaseMaintenanceCard
          lastVacuumAt={vacuumStatus?.lastVacuumAt ?? null}
          lastVacuumStatus={vacuumStatus?.lastRunStatus ?? "never"}
          lastVacuumError={vacuumStatus?.lastError ?? null}
          vacuumSchedule={selectedSchedule}
          isVacuumRunning={
            vacuumStatus?.isRunning === true || runVacuumMutation.isPending
          }
          onRunVacuum={() => {
            runVacuumMutation.mutate();
          }}
          onVacuumScheduleChange={(value) => {
            setVacuumScheduleMutation.mutate(value);
          }}
        />
      </CardContent>
    </Card>
  );
};
