import fs from "node:fs";
import Database from "better-sqlite3";
import { parentPort, workerData } from "worker_threads";

type VacuumIntoWorkerData = {
  op: "vacuumInto";
  dbPath: string;
  targetPath: string;
};

type IntegrityCheckWorkerData = {
  op: "integrityCheck";
  dbPath: string;
};

type BackupIntegrityWorkerData = VacuumIntoWorkerData | IntegrityCheckWorkerData;

function isVacuumIntoData(data: BackupIntegrityWorkerData): data is VacuumIntoWorkerData {
  return data.op === "vacuumInto";
}

function vacuumInto(dbPath: string, targetPath: string): void {
  const tempPath = `${targetPath}.tmp`;
  if (fs.existsSync(tempPath)) {
    fs.rmSync(tempPath, { force: true });
  }

  let db: Database.Database | null = null;
  try {
    db = new Database(dbPath);
    db.prepare("VACUUM INTO ?").run(tempPath);
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { force: true });
      }
    } catch {
      // Best-effort temp cleanup after failed VACUUM INTO
    }
    throw error;
  } finally {
    if (db) {
      db.close();
    }
  }

  // Atomic publish: final path appears only after a complete VACUUM INTO.
  // Quit/kill mid-op leaves at most a `.tmp` (never a truncated final backup).
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { force: true });
  }
  fs.renameSync(tempPath, targetPath);
}

function integrityCheck(dbPath: string): { ok: boolean; details: string } {
  let db: Database.Database | null = null;
  try {
    db = new Database(dbPath, { readonly: true });
    // boundary: better-sqlite3 raw row
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
    const rows = db
      .prepare("PRAGMA integrity_check")
      .all() as { integrity_check: string }[];
    const ok = rows.length === 1 && rows[0]?.integrity_check === "ok";
    const details = rows.map((row) => row.integrity_check).join("\n");
    return { ok, details };
  } finally {
    if (db) {
      db.close();
    }
  }
}

function runBackupIntegrityInWorker(): void {
  // boundary: worker message — workerData payload after trust/Zod
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: worker message
  const data = workerData as BackupIntegrityWorkerData;

  try {
    if (isVacuumIntoData(data)) {
      vacuumInto(data.dbPath, data.targetPath);
      parentPort?.postMessage({ success: true });
      return;
    }

    const result = integrityCheck(data.dbPath);
    parentPort?.postMessage({
      success: true,
      ok: result.ok,
      details: result.details,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backup integrity worker failed";
    parentPort?.postMessage({ success: false, error: message });
  }
}

runBackupIntegrityInWorker();
