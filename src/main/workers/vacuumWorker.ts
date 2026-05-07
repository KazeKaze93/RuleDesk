import Database from "better-sqlite3";
import { parentPort, workerData } from "worker_threads";

interface VacuumWorkerData {
  dbPath: string;
}

function runVacuumInWorker(): void {
  const { dbPath } = workerData as VacuumWorkerData;
  let db: Database.Database | null = null;

  try {
    db = new Database(dbPath);
    db.exec("VACUUM;");
    parentPort?.postMessage({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "VACUUM failed";
    parentPort?.postMessage({ success: false, error: message });
  } finally {
    if (db) {
      db.close();
    }
  }
}

runVacuumInWorker();
