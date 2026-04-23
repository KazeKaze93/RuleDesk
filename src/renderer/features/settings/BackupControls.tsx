import { useState } from "react";
import log from "electron-log/renderer";

export function BackupControls() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBackup = async () => {
    try {
      setIsLoading(true);

      const result = await window.api.createBackup();

      if (result.success) {
        alert(`✅ Backup created successfully!\nPath: ${result.path}`);
      } else {
        alert(`❌ IPC call error: ${result.error}`);
      }
    } catch (e) {
      log.error("[BackupControls] Backup failed:", e);
      alert(
        "Ошибка IPC вызова: " + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (
      !confirm(
        "⚠️ WARNING: Restoring will overwrite the current database. The application will restart. Continue?"
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await window.api.restoreBackup();

      if (result?.success) {
        window.setTimeout(() => {
          window.location.reload();
        }, 500);
        return;
      }
      if (result && !result.success && result.error !== "Canceled by user") {
        alert(`❌ Restore failed: ${result.error}`);
      }
    } catch (e) {
      log.error("[BackupControls] Restore failed:", e);
      alert("IPC call error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-card text-foreground">
      <h3 className="mb-4 text-lg font-semibold">
        📦 Database Management
      </h3>
      <div className="flex gap-4">
        <button
          onClick={handleBackup}
          disabled={isLoading}
          aria-label="Create a full backup of the database"
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isLoading
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "text-white bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isLoading ? "Загрузка..." : "💾 Создать бэкап"}
        </button>

        <button
          onClick={handleRestore}
          disabled={isLoading}
          aria-label="Restore database from a backup file"
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isLoading
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "text-white bg-red-600 hover:bg-red-700"
          }`}
        >
          {isLoading ? "Processing..." : "♻️ Restore from File"}{" "}
        </button>
      </div>
    </div>
  );
}
