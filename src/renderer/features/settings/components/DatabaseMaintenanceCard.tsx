import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { formatRelativeTime } from "../../../lib/formatRelativeTime";
import type {
  OrphanDetectionReport,
  VacuumSchedule,
  VacuumStatusResponse,
} from "../../../../shared/schemas/maintenance";

type LastVacuumStatus = VacuumStatusResponse["lastRunStatus"];

interface DatabaseMaintenanceCardProps {
  lastVacuumAt: number | null;
  lastVacuumStatus: LastVacuumStatus;
  lastVacuumError: string | null;
  vacuumSchedule: VacuumSchedule;
  isVacuumRunning: boolean;
  onRunVacuum: () => void;
  onVacuumScheduleChange: (value: VacuumSchedule) => void;
}

export const DatabaseMaintenanceCard = ({
  lastVacuumAt,
  lastVacuumStatus,
  lastVacuumError,
  vacuumSchedule,
  isVacuumRunning,
  onRunVacuum,
  onVacuumScheduleChange,
}: DatabaseMaintenanceCardProps) => {
  const [orphanReport, setOrphanReport] = useState<OrphanDetectionReport | null>(
    null
  );
  const [orphanError, setOrphanError] = useState<string | null>(null);
  const [isDetectingOrphans, setIsDetectingOrphans] = useState(false);

  const absoluteDate =
    lastVacuumAt === null ? "Never" : new Date(lastVacuumAt).toLocaleString();
  const relativeDate =
    lastVacuumAt === null ? "Never" : formatRelativeTime(lastVacuumAt);

  const statusLabel =
    lastVacuumStatus === "success"
      ? "Last run: success"
      : lastVacuumStatus === "error"
        ? "Last run: error"
        : "Last run: never";

  const handleDetectOrphans = async () => {
    setIsDetectingOrphans(true);
    setOrphanError(null);
    try {
      const report = await window.api.detectOrphans();
      setOrphanReport(report);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Orphan detection failed";
      setOrphanError(message);
      setOrphanReport(null);
    } finally {
      setIsDetectingOrphans(false);
    }
  };

  const orphanTotal =
    orphanReport === null
      ? 0
      : orphanReport.orphanedPostsCount +
        orphanReport.orphanedPlaylistEntriesCount +
        orphanReport.ftsRowsWithoutPostCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Maintenance</CardTitle>
        <CardDescription>
          VACUUM reclaims space and compacts the local database file. Orphan
          check is read-only (no cleanup yet).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-1">
          <p className="text-sm font-medium">Last VACUUM</p>
          <p className="text-sm text-muted-foreground">
            {relativeDate} ({absoluteDate})
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-medium">Schedule</p>
          <Select
            value={vacuumSchedule}
            onValueChange={(value: VacuumSchedule) => {
              onVacuumScheduleChange(value);
            }}
          >
            <SelectTrigger id="vacuum-schedule">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <Badge
          className={
            lastVacuumStatus === "success"
              ? "border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300"
              : lastVacuumStatus === "error"
                ? "border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300"
                : "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300"
          }
        >
          {statusLabel}
        </Badge>

        {lastVacuumError ? (
          <Alert variant="destructive">
            <AlertTitle>Last VACUUM error</AlertTitle>
            <AlertDescription>{lastVacuumError}</AlertDescription>
          </Alert>
        ) : null}

        <p className="text-xs text-muted-foreground">
          VACUUM may take several seconds on large databases.
        </p>

        <section className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Orphaned data check</p>
          <p className="text-xs text-muted-foreground">
            Known issue: foreign keys are not enforced, so deleting an artist can
            leave posts behind. This report counts them; cleanup is a separate
            follow-up.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void handleDetectOrphans();
            }}
            disabled={isDetectingOrphans || isVacuumRunning}
          >
            {isDetectingOrphans ? "Checking..." : "Check for orphaned data"}
          </Button>
          {orphanError ? (
            <Alert variant="destructive">
              <AlertTitle>Orphan check failed</AlertTitle>
              <AlertDescription>{orphanError}</AlertDescription>
            </Alert>
          ) : null}
          {orphanReport ? (
            <Alert>
              <AlertTitle>
                {orphanTotal === 0
                  ? "No orphaned rows found"
                  : `Found ${orphanTotal} orphaned row(s)`}
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                  <li>
                    Orphaned posts (no artist): {orphanReport.orphanedPostsCount}
                  </li>
                  <li>
                    Orphaned playlist entries (no post):{" "}
                    {orphanReport.orphanedPlaylistEntriesCount}
                  </li>
                  <li>
                    FTS index rows without post:{" "}
                    {orphanReport.ftsRowsWithoutPostCount}
                  </li>
                  <li>
                    Ghost artist ids: {orphanReport.ghostArtistIds.length}
                    {orphanReport.postsPerGhostArtist.length > 0
                      ? ` (e.g. ${orphanReport.postsPerGhostArtist
                          .slice(0, 5)
                          .map((g) => `${g.artistId}:${g.postCount}`)
                          .join(", ")})`
                      : ""}
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </section>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onRunVacuum}
          disabled={isVacuumRunning}
        >
          {isVacuumRunning ? "Running..." : "Run VACUUM now"}
        </Button>
      </CardFooter>
    </Card>
  );
};
