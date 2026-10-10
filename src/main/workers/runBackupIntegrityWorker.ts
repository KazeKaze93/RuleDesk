import fs from "node:fs";
import path from "node:path";
import { Worker } from "worker_threads";

/**
 * electron-vite emits workers under `out/main/workers/*.cjs` while callers
 * (including this module) are bundled into `out/main/main.cjs`. Mirror vacuum /
 * download: `__dirname/workers/<name>.cjs`.
 */
export function resolveBackupIntegrityWorkerPath(): string {
  const packaged = path.join(
    __dirname,
    "workers",
    "backupIntegrityWorker.cjs"
  );
  if (fs.existsSync(packaged)) {
    return packaged;
  }
  // Vitest loads from src/main/workers/; built artifact is still under out/main/workers/
  const fromRepoOut = path.resolve(
    __dirname,
    "../../../out/main/workers/backupIntegrityWorker.cjs"
  );
  if (fs.existsSync(fromRepoOut)) {
    return fromRepoOut;
  }
  return packaged;
}

export type BackupIntegrityVacuumIntoRequest = {
  op: "vacuumInto";
  dbPath: string;
  targetPath: string;
};

export type BackupIntegrityCheckRequest = {
  op: "integrityCheck";
  dbPath: string;
};

export type BackupIntegrityWorkerRequest =
  | BackupIntegrityVacuumIntoRequest
  | BackupIntegrityCheckRequest;

export type BackupIntegrityVacuumIntoResult = {
  success: true;
};

export type BackupIntegrityCheckResult = {
  success: true;
  ok: boolean;
  details: string;
};

export type BackupIntegrityWorkerFailure = {
  success: false;
  error: string;
};

export type BackupIntegrityWorkerResult =
  | BackupIntegrityVacuumIntoResult
  | BackupIntegrityCheckResult
  | BackupIntegrityWorkerFailure;

type WorkerMessage = {
  success?: boolean;
  ok?: boolean;
  details?: string;
  error?: string;
};

/** Active worker so quit/cancel can terminate mid-op without leaving a final corrupt backup. */
let activeWorker: Worker | null = null;

export function terminateBackupIntegrityWorker(): void {
  const worker = activeWorker;
  activeWorker = null;
  if (!worker) {
    return;
  }
  void worker.terminate().catch(() => {
    // Ignore terminate races on process shutdown
  });
}

/**
 * Spawn `backupIntegrityWorker.cjs` (same connect/close protocol as vacuumWorker).
 * Caller must close the Main DB handle before vacuumInto / live integrityCheck.
 */
export function runBackupIntegrityWorker(
  request: BackupIntegrityVacuumIntoRequest
): Promise<BackupIntegrityVacuumIntoResult | BackupIntegrityWorkerFailure>;
export function runBackupIntegrityWorker(
  request: BackupIntegrityCheckRequest
): Promise<BackupIntegrityCheckResult | BackupIntegrityWorkerFailure>;
export function runBackupIntegrityWorker(
  request: BackupIntegrityWorkerRequest
): Promise<BackupIntegrityWorkerResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(resolveBackupIntegrityWorkerPath(), {
      workerData: request,
    });
    activeWorker = worker;
    let settled = false;

    const clearActive = (): void => {
      if (activeWorker === worker) {
        activeWorker = null;
      }
    };

    const resolveOnce = (result: BackupIntegrityWorkerResult) => {
      if (settled) {
        return;
      }
      settled = true;
      clearActive();
      resolve(result);
    };

    const rejectOnce = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearActive();
      reject(error);
    };

    worker.once("message", (message: WorkerMessage) => {
      if (!message.success) {
        resolveOnce({
          success: false,
          error: message.error ?? "Backup integrity worker failed",
        });
        return;
      }

      if (request.op === "integrityCheck") {
        resolveOnce({
          success: true,
          ok: message.ok === true,
          details: typeof message.details === "string" ? message.details : "",
        });
        return;
      }

      resolveOnce({ success: true });
    });

    worker.once("error", (error) => {
      rejectOnce(error);
    });

    worker.once("exit", (code) => {
      if (settled) {
        return;
      }
      if (code !== 0) {
        rejectOnce(
          new Error(`Backup integrity worker exited with code ${code}`)
        );
        return;
      }
      setImmediate(() => {
        if (!settled) {
          rejectOnce(
            new Error("Backup integrity worker exited without result")
          );
        }
      });
    });
  });
}
