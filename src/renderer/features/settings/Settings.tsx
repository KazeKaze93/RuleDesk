import { useState } from "react";
import log from "electron-log/renderer";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Loader2, Database, Upload } from "lucide-react";

export const Settings = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupStatus, setBackupStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [restoreStatus, setRestoreStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus("idle");

    try {
      const result = await window.api.createBackup();
      if (result.success) {
        setBackupStatus("success");
        setTimeout(() => setBackupStatus("idle"), 3000);
      } else {
        setBackupStatus("error");
        setTimeout(() => setBackupStatus("idle"), 3000);
      }
    } catch (error) {
      log.error("[Settings] Failed to create backup:", error);
      setBackupStatus("error");
      setTimeout(() => setBackupStatus("idle"), 3000);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setRestoreStatus("idle");

    try {
      const result = await window.api.restoreBackup();
      if (result.success) {
        setRestoreStatus("success");
        setTimeout(() => setRestoreStatus("idle"), 3000);
      } else {
        setRestoreStatus("error");
        setTimeout(() => setRestoreStatus("idle"), 3000);
      }
    } catch (error) {
      log.error("[Settings] Failed to restore backup:", error);
      setRestoreStatus("error");
      setTimeout(() => setRestoreStatus("idle"), 3000);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="container py-10 space-y-8 max-w-2xl duration-500 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your database backups and application preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>
            Create backups of your database or restore from a previous backup.
            Backups include all your tracked artists, posts, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center p-4 rounded-lg border">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Backup Database</h3>
                <p className="text-sm text-muted-foreground">
                  Create a backup file of your current database. The backup will
                  be saved and the folder will open automatically.
                </p>
              </div>
              <Button
                onClick={handleBackup}
                disabled={isBackingUp}
                variant="outline"
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 w-4 h-4" />
                    Backup Database
                  </>
                )}
              </Button>
            </div>

            {backupStatus === "success" && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md dark:bg-green-950">
                Backup created successfully!
              </div>
            )}
            {backupStatus === "error" && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:bg-red-950">
                Failed to create backup. Please try again.
              </div>
            )}

            <div className="flex justify-between items-center p-4 rounded-lg border">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Restore Database</h3>
                <p className="text-sm text-muted-foreground">
                  Restore your database from a previous backup file. This will
                  replace your current database.
                </p>
              </div>
              <Button
                onClick={handleRestore}
                disabled={isRestoring}
                variant="outline"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 w-4 h-4" />
                    Restore Database
                  </>
                )}
              </Button>
            </div>

            {restoreStatus === "success" && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md dark:bg-green-950">
                Database restored successfully! The page will reload.
              </div>
            )}
            {restoreStatus === "error" && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:bg-red-950">
                Failed to restore backup. Please try again.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
