/**
 * Spawns built backupIntegrityWorker.cjs against a temp DB copy.
 * Requires `out/main/workers/backupIntegrityWorker.cjs` (npm run build).
 * Never opens a live RuleDesk-Data data.bin — copies into %TEMP%\rd-p5\ when present.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

vi.mock("electron", () => ({
  app: {
    getPath: () => os.tmpdir(),
    getVersion: () => "0.0.0-test",
  },
}));

vi.mock("@/main/lib/backup-sidecar", () => ({
  BACKUP_SIDECAR_SUFFIX: ".settings.json",
  getBackupSidecarPath: (backupDbPath: string) => `${backupDbPath}.settings.json`,
  writeBackupSidecar: vi.fn(async () => undefined),
  restoreBackupSidecar: vi.fn(async () => false),
  logRestoredSettingsSnapshot: vi.fn(),
}));

import { MAX_MAIN_EVENT_LOOP_LAG_DURING_BACKUP_MS } from "../../../src/main/config/constants";
import { createConsistentBackup } from "../../../src/main/lib/database-backup";
import { restoreDatabaseFromBackup } from "../../../src/main/lib/database-restore";
import {
  runBackupIntegrityWorker,
  terminateBackupIntegrityWorker,
} from "../../../src/main/workers/runBackupIntegrityWorker";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.resolve(
  __dirname,
  "../../../out/main/workers/backupIntegrityWorker.cjs"
);

const RD_P5_DIR = path.join(os.tmpdir(), "rd-p5");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function measureEventLoopLagWhile(
  work: Promise<unknown>
): Promise<{ maxLagMs: number }> {
  let maxLagMs = 0;
  let stop = false;
  const probe = (async () => {
    while (!stop) {
      const started = Date.now();
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });
      maxLagMs = Math.max(maxLagMs, Date.now() - started);
      await sleep(5);
    }
  })();
  try {
    await work;
  } finally {
    stop = true;
    await probe;
  }
  return { maxLagMs };
}

function seedSmallDb(dbPath: string): void {
  const sqlite = new Database(dbPath);
  sqlite.exec(`
    CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT);
    INSERT INTO t (v) VALUES ('a'), ('b'), ('c');
  `);
  sqlite.close();
}

function findLiveDataBinCopySource(): string | null {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    return null;
  }
  const candidate = path.join(localAppData, "RuleDesk-Data", "data.bin");
  return fs.existsSync(candidate) ? candidate : null;
}

describe("backupIntegrityWorker behavior", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    if (!fs.existsSync(WORKER_PATH)) {
      throw new Error(
        `Missing ${WORKER_PATH}. Run npm run build before this suite.`
      );
    }
  });

  afterEach(() => {
    terminateBackupIntegrityWorker();
    for (const dir of tempDirs.splice(0)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  it("VACUUM INTO keeps Main event-loop lag under the named constant", async () => {
    fs.mkdirSync(RD_P5_DIR, { recursive: true });
    const workDir = fs.mkdtempSync(path.join(RD_P5_DIR, "lag-"));
    tempDirs.push(workDir);

    const liveSource = findLiveDataBinCopySource();
    const dbPath = path.join(workDir, "data.bin");
    if (liveSource) {
      fs.copyFileSync(liveSource, dbPath);
      const wal = `${liveSource}-wal`;
      const shm = `${liveSource}-shm`;
      if (fs.existsSync(wal)) {
        fs.copyFileSync(wal, `${dbPath}-wal`);
      }
      if (fs.existsSync(shm)) {
        fs.copyFileSync(shm, `${dbPath}-shm`);
      }
    } else {
      seedSmallDb(dbPath);
      // Inflate so VACUUM INTO takes long enough for lag probes to sample.
      const sqlite = new Database(dbPath);
      sqlite.exec("CREATE TABLE pad (id INTEGER PRIMARY KEY, blob BLOB)");
      const insert = sqlite.prepare("INSERT INTO pad (blob) VALUES (?)");
      const chunk = Buffer.alloc(1024 * 64, 7);
      sqlite.transaction(() => {
        for (let i = 0; i < 400; i += 1) {
          insert.run(chunk);
        }
      })();
      sqlite.close();
    }

    const targetPath = path.join(workDir, "backup.db");
    const { maxLagMs } = await measureEventLoopLagWhile(
      runBackupIntegrityWorker({
        op: "vacuumInto",
        dbPath,
        targetPath,
      })
    );

    expect(fs.existsSync(targetPath)).toBe(true);
    expect(maxLagMs).toBeLessThanOrEqual(MAX_MAIN_EVENT_LOOP_LAG_DURING_BACKUP_MS);

    const integrity = await runBackupIntegrityWorker({
      op: "integrityCheck",
      dbPath: targetPath,
    });
    expect(integrity.success).toBe(true);
    if (integrity.success) {
      expect(integrity.ok).toBe(true);
    }
  }, 120_000);

  it("restore + integrity_check via worker succeeds", async () => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "rd-p5-restore-"));
    tempDirs.push(workDir);
    const dbPath = path.join(workDir, "data.bin");
    seedSmallDb(dbPath);

    const backupPath = path.join(workDir, "backup.db");
    await createConsistentBackup(dbPath, backupPath);

    fs.rmSync(dbPath, { force: true });

    const result = await restoreDatabaseFromBackup(backupPath, {
      getPaths: () => ({
        dbPath,
        walPath: `${dbPath}-wal`,
        shmPath: `${dbPath}-shm`,
      }),
      closeDatabase: () => undefined,
      initializeDatabase: async () => {
        const probe = new Database(dbPath);
        probe.close();
      },
    });
    expect(result.success).toBe(true);
  });

  it("terminate mid VACUUM INTO leaves no corrupt final backup file", async () => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "rd-p5-cancel-"));
    tempDirs.push(workDir);
    const dbPath = path.join(workDir, "data.bin");
    seedSmallDb(dbPath);
    const sqlite = new Database(dbPath);
    sqlite.exec("CREATE TABLE pad (id INTEGER PRIMARY KEY, blob BLOB)");
    const insert = sqlite.prepare("INSERT INTO pad (blob) VALUES (?)");
    const chunk = Buffer.alloc(1024 * 128, 9);
    sqlite.transaction(() => {
      for (let i = 0; i < 800; i += 1) {
        insert.run(chunk);
      }
    })();
    sqlite.close();

    const targetPath = path.join(workDir, "backup.db");

    const worker = new Worker(WORKER_PATH, {
      workerData: {
        op: "vacuumInto",
        dbPath,
        targetPath,
      },
    });

    await sleep(30);
    await worker.terminate();

    // Final path must not be a truncated VACUUM INTO product.
    if (fs.existsSync(targetPath)) {
      const integrity = await runBackupIntegrityWorker({
        op: "integrityCheck",
        dbPath: targetPath,
      });
      expect(integrity.success && integrity.ok).toBe(true);
    } else {
      expect(fs.existsSync(targetPath)).toBe(false);
    }
    // Stale tmp is allowed; it is not a published backup name.
    const tmpPath = `${targetPath}.tmp`;
    if (fs.existsSync(tmpPath)) {
      const stat = fs.statSync(tmpPath);
      expect(stat.isFile()).toBe(true);
    }
  }, 60_000);
});
