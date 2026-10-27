import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restoreDatabaseFromBackup } from "../../../src/main/lib/database-restore";
import {
  resetQuitRequestedForTests,
  setQuitRequested,
} from "../../../src/main/lib/quit-state";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    transports: {
      file: {
        level: false,
        fileName: "app.log",
        resolvePathFn: vi.fn(),
      },
      console: { level: false, format: "" },
      ipc: {},
    },
    errorHandler: { startCatching: vi.fn() },
  },
}));

vi.mock("electron", () => ({
  app: {
    getPath: (name: string) =>
      name === "userData" ? "/tmp/ruledesk-test-userdata" : "/tmp",
  },
}));

const runBackupIntegrityWorkerMock = vi.fn();

vi.mock("../../../src/main/workers/runBackupIntegrityWorker", () => ({
  runBackupIntegrityWorker: (...args: unknown[]) =>
    runBackupIntegrityWorkerMock(...args),
}));

describe("restoreDatabaseFromBackup under quit", () => {
  let tempDir: string;
  let dbPath: string;
  let walPath: string;
  let shmPath: string;
  let backupPath: string;

  beforeEach(() => {
    resetQuitRequestedForTests();
    runBackupIntegrityWorkerMock.mockReset();
    runBackupIntegrityWorkerMock.mockResolvedValue({
      success: true,
      ok: true,
      details: "ok",
    });

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ruledesk-restore-quit-"));
    dbPath = path.join(tempDir, "data.db");
    walPath = `${dbPath}-wal`;
    shmPath = `${dbPath}-shm`;
    backupPath = path.join(tempDir, "backup.db");
    fs.writeFileSync(dbPath, "live-db");
    fs.writeFileSync(backupPath, "backup-db");
  });

  afterEach(() => {
    resetQuitRequestedForTests();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("still calls initializeDatabase before deleting .bak when quit was requested", async () => {
    const callOrder: string[] = [];
    const initializeDatabase = vi.fn().mockImplementation(async () => {
      callOrder.push("initializeDatabase");
      expect(fs.existsSync(`${dbPath}.bak`)).toBe(true);
    });
    const afterSuccessfulReinit = vi.fn().mockImplementation(() => {
      callOrder.push("afterSuccessfulReinit");
    });
    setQuitRequested();

    const result = await restoreDatabaseFromBackup(backupPath, {
      getPaths: () => ({ dbPath, walPath, shmPath }),
      closeDatabase: vi.fn(),
      initializeDatabase,
      afterSuccessfulReinit,
      restoreSidecar: vi.fn().mockResolvedValue(false),
      logSettingsSnapshot: vi.fn(),
    });

    expect(result.success).toBe(true);
    expect(initializeDatabase).toHaveBeenCalledTimes(1);
    expect(afterSuccessfulReinit).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["initializeDatabase", "afterSuccessfulReinit"]);
    expect(fs.existsSync(`${dbPath}.bak`)).toBe(false);
  });

  it("calls initializeDatabase when quit was not requested", async () => {
    const initializeDatabase = vi.fn().mockResolvedValue(undefined);
    const afterSuccessfulReinit = vi.fn();

    const result = await restoreDatabaseFromBackup(backupPath, {
      getPaths: () => ({ dbPath, walPath, shmPath }),
      closeDatabase: vi.fn(),
      initializeDatabase,
      afterSuccessfulReinit,
      restoreSidecar: vi.fn().mockResolvedValue(false),
      logSettingsSnapshot: vi.fn(),
    });

    expect(result.success).toBe(true);
    expect(initializeDatabase).toHaveBeenCalledTimes(1);
    expect(afterSuccessfulReinit).toHaveBeenCalledTimes(1);
  });
});
