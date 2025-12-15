import { useState } from "react";

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
      console.error(e);
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

      if (result && !result.success && result.error !== "Canceled by user") {
        alert(`❌ Restore failed: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("IPC call error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-slate-700 bg-slate-900 text-slate-100">
      <h3 className="mb-4 text-lg font-semibold text-slate-200">
        📦 Database Management
      </h3>
      <div className="flex gap-4">
        <button
          onClick={handleBackup}
          disabled={isLoading}
          aria-label="Create a full backup of the database"
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isLoading
              ? "cursor-not-allowed bg-slate-700 text-slate-400"
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
              ? "cursor-not-allowed bg-slate-700 text-slate-400"
              : "text-white bg-red-600 hover:bg-red-700"
          }`}
        >
          {isLoading ? "Processing..." : "♻️ Restore from File"}{" "}
        </button>
      </div>
    </div>
  );
}
