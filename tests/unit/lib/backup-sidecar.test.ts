import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "rd-sidecar-userdata-"));

vi.mock("electron", () => ({
  app: {
    getPath: (name: string) => {
      if (name === "userData") {
        return userDataDir;
      }
      return userDataDir;
    },
  },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../src/main/db/client", () => ({
  getDb: vi.fn(),
}));

import {
  getBackupSidecarPath,
  restoreBackupSidecar,
  writeBackupSidecar,
} from "../../../src/main/lib/backup-sidecar";
import { resetAtomicWriteStateForTests } from "../../../src/main/lib/atomic-write";

describe("backup-sidecar atomic writes", () => {
  let backupDir: string;

  beforeEach(() => {
    resetAtomicWriteStateForTests();
    backupDir = fs.mkdtempSync(path.join(os.tmpdir(), "rd-sidecar-backup-"));
    fs.mkdirSync(userDataDir, { recursive: true });
    for (const name of fs.readdirSync(userDataDir)) {
      fs.rmSync(path.join(userDataDir, name), { recursive: true, force: true });
    }
  });

  afterEach(() => {
    resetAtomicWriteStateForTests();
    fs.rmSync(backupDir, { recursive: true, force: true });
  });

  it("writeBackupSidecar writes valid JSON via atomic replace", async () => {
    const schedulePath = path.join(userDataDir, "backup-settings.json");
    fs.writeFileSync(
      schedulePath,
      JSON.stringify({
        autoBackupInterval: "daily",
        lastAutoBackupAt: 12345,
      }),
      "utf-8"
    );

    const backupDbPath = path.join(backupDir, "snap.db");
    fs.writeFileSync(backupDbPath, "db-bytes");
    await writeBackupSidecar(backupDbPath);

    const sidecarPath = getBackupSidecarPath(backupDbPath);
    const parsed: unknown = JSON.parse(fs.readFileSync(sidecarPath, "utf-8"));
    expect(parsed).toMatchObject({
      version: 1,
      backupSchedule: {
        autoBackupInterval: "daily",
        lastAutoBackupAt: 12345,
      },
    });
    expect(
      fs.readdirSync(backupDir).filter((n) => n.includes(".tmp."))
    ).toEqual([]);
  });

  it("restoreBackupSidecar atomically restores backup-settings.json", async () => {
    const backupDbPath = path.join(backupDir, "snap.db");
    const sidecarPath = getBackupSidecarPath(backupDbPath);
    fs.writeFileSync(
      sidecarPath,
      JSON.stringify({
        version: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        backupSchedule: {
          autoBackupInterval: "weekly",
          lastAutoBackupAt: 99,
        },
      }),
      "utf-8"
    );

    const ok = await restoreBackupSidecar(backupDbPath);
    expect(ok).toBe(true);

    const configPath = path.join(userDataDir, "backup-settings.json");
    expect(JSON.parse(fs.readFileSync(configPath, "utf-8"))).toEqual({
      autoBackupInterval: "weekly",
      lastAutoBackupAt: 99,
    });
    expect(
      fs.readdirSync(userDataDir).filter((n) => n.includes(".tmp."))
    ).toEqual([]);
  });
});
