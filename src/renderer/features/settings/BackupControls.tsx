import { useState } from "react";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { ConfirmActionDialog } from "../../components/dialogs/ConfirmActionDialog";
import { resolveErrorMessage } from "../../utils/error-message";

const RESTORE_CANCELED = "Canceled by user";

export function BackupControls() {
  const [isLoading, setIsLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const handleBackup = async () => {
    try {
      setIsLoading(true);

      const result = await window.api.createBackup();

      if (result.success) {
        toast.success(`Backup created successfully. Path: ${result.path}`);
      } else {
        toast.error(result.error || "Backup failed");
      }
    } catch (error: unknown) {
      log.error("[BackupControls] Backup failed:", error);
      toast.error(resolveErrorMessage(error, "Backup failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreConfirm = async () => {
    try {
      setIsLoading(true);
      const result = await window.api.restoreBackup();

      if (result?.success) {
        toast.success("Restore completed. Reloading…");
        window.setTimeout(() => {
          window.location.reload();
        }, 500);
        return;
      }
      if (result && !result.success && result.error !== RESTORE_CANCELED) {
        toast.error(result.error || "Restore failed");
      }
    } catch (error: unknown) {
      log.error("[BackupControls] Restore failed:", error);
      toast.error(resolveErrorMessage(error, "Restore failed"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-foreground">
      <h3 className="mb-4 text-lg font-semibold">Database Management</h3>
      <div className="flex gap-4">
        <Button
          type="button"
          variant="success"
          onClick={() => {
            void handleBackup();
          }}
          disabled={isLoading}
          aria-label="Create a full backup of the database"
        >
          {isLoading ? "Loading…" : "Create backup"}
        </Button>

        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setRestoreDialogOpen(true);
          }}
          disabled={isLoading}
          aria-label="Restore database from a backup file"
        >
          {isLoading ? "Processing…" : "Restore from File"}
        </Button>
      </div>

      <ConfirmActionDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Restore database?"
        description="Restoring will overwrite the current database. The application will reload. Continue?"
        confirmLabel="Restore"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
