import { useState } from "react";
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
import { ConfirmActionDialog } from "../../components/dialogs/ConfirmActionDialog";
import { DatabaseMaintenanceCard } from "./components/DatabaseMaintenanceCard";
import { SettingsDangerZone } from "./SettingsGeneralTab";
import type {
  RunVacuumResponse,
  VacuumSchedule,
  VacuumStatusResponse,
} from "../../../shared/schemas/maintenance";

type AutoBackupInterval = "never" | "daily" | "weekly";

const BACKUP_SECTION_TITLE = "Backup";
const BACKUP_SECTION_DESCRIPTION =
  "Manage backups and verify database integrity. Automatic daily backups are on by default; you can change the interval or turn them off below.";
const DATABASE_LOCATION_LABEL = "Database location";
const DATABASE_LOCATION_LOADING = "Loading...";
const AUTO_BACKUP_LABEL = "Auto-backup";
const AUTO_BACKUP_HELP =
  "Default is Daily. Choose Never to disable, or Weekly for less frequent snapshots. Checked when the app starts.";
const CREATE_BACKUP_LABEL = "Create Backup";
const CREATING_BACKUP_LABEL = "Creating backup...";
const BACKUP_CREATED_LABEL = "Backup created";
const BACKUP_FAILED_LABEL = "Backup failed";
const RESTORE_BACKUP_LABEL = "Restore Backup";
const RESTORING_LABEL = "Restoring...";
const RESTORE_SUCCESS_LABEL = "Restore completed, reloading";
const RESTORE_FAILED_LABEL = "Restore failed";
const CHECK_INTEGRITY_LABEL = "Check Integrity";
const CHECKING_INTEGRITY_LABEL = "Checking integrity...";
const INTEGRITY_OK_LABEL = "Database integrity OK";
const INTEGRITY_ISSUES_LABEL = "Integrity issues detected";
const RETENTION_LABEL = "Retention";
const RETENTION_HELP =
  "Keep the last N manual backups and the last N automatic backups separately (not one shared pool). Range 1–20.";
const RESTORE_DIALOG_TITLE = "Restore database?";
const RESTORE_DIALOG_DESCRIPTION =
  "Restoring will overwrite the current database. The application will reload. Continue?";
const RESTORE_CONFIRM_LABEL = "Restore";
const RESTORE_CANCEL_LABEL = "Cancel";

const parseAutoBackupInterval = (value: string): AutoBackupInterval | null => {
  if (value === "never" || value === "daily" || value === "weekly") {
    return value;
  }
  return null;
};

interface SettingsDataTabProps {
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
  onRestore: () => void | Promise<void>;
  onIntegrityCheck: () => void;
  onBackupRetentionChange: (value: string) => void;
  onBackupRetentionBlur: () => void;
  onAutoBackupIntervalChange: (value: AutoBackupInterval) => void;
}

export const SettingsDataTab = ({
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
}: SettingsDataTabProps) => {
  const queryClient = useQueryClient();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const vacuumScheduleQuery = useQuery<VacuumSchedule>({
    queryKey: ["maintenance", "vacuum-schedule"],
    queryFn: () => window.api.getVacuumSchedule(),
  });
  const selectedSchedule = vacuumScheduleQuery.data ?? "manual";

  const vacuumStatusQuery = useQuery<VacuumStatusResponse>({
    queryKey: ["maintenance", "vacuum-status"],
    queryFn: () => window.api.getVacuumStatus(),
    // Default staleTime is 0, but a mounted observer does not auto-refetch when
    // stale. Auto VACUUM never calls invalidateQueries (only the manual mutation
    // does), so without an interval a user sitting on Data would keep a frozen
    // last-run until remount. Poll while scheduled; faster while isRunning.
    refetchInterval: (query) => {
      if (query.state.data?.isRunning === true) {
        return 5_000;
      }
      if (selectedSchedule === "manual") {
        return false;
      }
      return 60_000;
    },
  });
  const runVacuumMutation = useMutation<RunVacuumResponse>({
    mutationFn: () => window.api.runVacuum(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["maintenance", "vacuum-status"],
      });
    },
    onError: (error) => {
      log.error("[SettingsDataTab] Failed to run VACUUM:", error);
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
      log.error("[SettingsDataTab] Failed to set VACUUM schedule:", error);
    },
  });

  const vacuumStatus = vacuumStatusQuery.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{BACKUP_SECTION_TITLE}</CardTitle>
          <CardDescription>{BACKUP_SECTION_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="space-y-1 rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{DATABASE_LOCATION_LABEL}</p>
            <p className="text-sm break-all">
              {databaseLocation || DATABASE_LOCATION_LOADING}
            </p>
          </section>

          <section className="space-y-2">
            <Label htmlFor="auto-backup-schedule">{AUTO_BACKUP_LABEL}</Label>
            <p className="text-sm text-muted-foreground">{AUTO_BACKUP_HELP}</p>
            <Select
              value={autoBackupInterval}
              onValueChange={(value) => {
                const next = parseAutoBackupInterval(value);
                if (next === null) {
                  return;
                }
                onAutoBackupIntervalChange(next);
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
              {isBackingUp ? CREATING_BACKUP_LABEL : CREATE_BACKUP_LABEL}
            </Button>
            {backupStatus === "success" ? (
              <Badge variant="success">{BACKUP_CREATED_LABEL}</Badge>
            ) : null}
            {backupStatus === "error" ? (
              <Badge variant="destructive">{BACKUP_FAILED_LABEL}</Badge>
            ) : null}
          </section>

          <Separator />

          <section className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRestoreDialogOpen(true);
              }}
              disabled={isRestoring}
            >
              {isRestoring ? RESTORING_LABEL : RESTORE_BACKUP_LABEL}
            </Button>
            {restoreStatus === "success" ? (
              <Badge variant="success">{RESTORE_SUCCESS_LABEL}</Badge>
            ) : null}
            {restoreStatus === "error" ? (
              <Badge variant="destructive">{RESTORE_FAILED_LABEL}</Badge>
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
              {isCheckingIntegrity ? CHECKING_INTEGRITY_LABEL : CHECK_INTEGRITY_LABEL}
            </Button>
            {integrityResult ? (
              <Badge variant={integrityResult.ok ? "success" : "destructive"}>
                {integrityResult.ok ? INTEGRITY_OK_LABEL : INTEGRITY_ISSUES_LABEL}
              </Badge>
            ) : null}
            {!integrityResult?.ok && integrityResult ? (
              <p className="text-sm text-destructive whitespace-pre-wrap">
                {integrityResult.details}
              </p>
            ) : null}
          </section>

          <Separator />

          <section className="space-y-1">
            <p className="text-sm font-medium">{RETENTION_LABEL}</p>
            <label className="space-y-2">
              <span className="text-sm text-muted-foreground">{RETENTION_HELP}</span>
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

      <Separator />

      <SettingsDangerZone />

      <ConfirmActionDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title={RESTORE_DIALOG_TITLE}
        description={RESTORE_DIALOG_DESCRIPTION}
        confirmLabel={RESTORE_CONFIRM_LABEL}
        cancelLabel={RESTORE_CANCEL_LABEL}
        variant="destructive"
        onConfirm={onRestore}
      />
    </div>
  );
};
