import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);

/** Path only — created on disk in beforeEach so vi.hoisted needs no Node requires. */
const { testUserDataDir } = vi.hoisted(() => {
  const tmpRoot = process.env.TEMP || process.env.TMP || process.env.TMPDIR || ".";
  const needsSep = !(tmpRoot.endsWith("\\") || tmpRoot.endsWith("/"));
  return {
    testUserDataDir: `${tmpRoot}${needsSep ? "/" : ""}ruledesk-backup-store-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
});

vi.mock("electron", () => ({
  app: {
    getPath: (name: string) => {
      if (name === "userData") {
        return testUserDataDir;
      }
      return testUserDataDir;
    },
    getVersion: () => "0.0.0-test",
  },
  ipcMain: {
    on: vi.fn(),
  },
  shell: {
    openPath: vi.fn(),
  },
}));

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      file: {
        level: "info",
        resolvePathFn: vi.fn(),
      },
    },
  },
}));

vi.mock("@/main/db/client", () => ({
  getSqliteInstance: vi.fn(),
}));

vi.mock("@/main/db/paths", () => ({
  getBackupDirectory: () => testUserDataDir,
}));

vi.mock("@/main/db/maintenance-queue", () => ({
  maintenanceQueue: {
    isProcessing: () => false,
  },
}));

vi.mock("@/main/lib/backup-retention", () => ({
  getBackupRetention: () => 5,
}));

vi.mock("@/main/lib/database-backup", () => ({
  buildAutoBackupFilename: vi.fn(),
  createConsistentBackup: vi.fn(),
  listAutoBackupFilesOldestFirst: vi.fn(() => []),
  selectAutoBackupFilenamesToDelete: vi.fn(() => []),
}));

import type { SyncService } from "@/main/services/sync-service";
import {
  BACKUP_SETTINGS_STORE_NAME,
  BackupService,
  backupSettingsFileExistedBeforeInit,
  buildBackupStoreDefaultsForTests,
  resetBackupStoreForTests,
  setBackupStoreForTests,
  type BackupStoreContract,
} from "@/main/services/backup-service";

type ConfConstructor = new (options: {
  cwd: string;
  configName: string;
  projectName: string;
  defaults: Record<string, unknown>;
}) => BackupStoreContract;

function resolveConfConstructor(): ConfConstructor {
  const confModule: unknown = require("conf");
  const confDefault: unknown =
    typeof confModule === "object" && confModule !== null && "default" in confModule
      ? confModule.default
      : null;
  const resolved = typeof confModule === "function" ? confModule : confDefault;
  if (typeof resolved !== "function") {
    throw new Error("conf constructor unavailable in test");
  }
  // boundary: conf CJS/ESM constructor shape after require()
  return resolved as ConfConstructor;
}

function settingsPath(): string {
  return path.join(testUserDataDir, `${BACKUP_SETTINGS_STORE_NAME}.json`);
}

function wipeSettingsFile(): void {
  fs.rmSync(settingsPath(), { force: true });
}

function writeSettingsFile(data: Record<string, unknown>): void {
  fs.mkdirSync(testUserDataDir, { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(data, null, 2), "utf-8");
}

function openBackupConfStore(): BackupStoreContract {
  const Conf = resolveConfConstructor();
  return new Conf({
    cwd: testUserDataDir,
    configName: BACKUP_SETTINGS_STORE_NAME,
    projectName: "ruledesk-backup-opt-in-test",
    defaults: buildBackupStoreDefaultsForTests(),
  });
}

function createBackupService(): BackupService {
  const syncService = {
    getIsSyncing: () => false,
  };
  // boundary: SyncService stub for BackupService constructor (only getIsSyncing used)
  return new BackupService(syncService as SyncService);
}

function installStoreFromDisk(): void {
  // Probe before constructing Conf — same ordering rule as production.
  backupSettingsFileExistedBeforeInit();
  setBackupStoreForTests(openBackupConfStore());
}

describe("conf persist semantics", () => {
  it("keeps on-disk autoBackupInterval over a newer constructor default", () => {
    const Conf = resolveConfConstructor();
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "ruledesk-conf-persist-"));
    const storeFile = path.join(cwd, "backup-settings.json");
    fs.writeFileSync(
      storeFile,
      JSON.stringify({ autoBackupInterval: "never", lastAutoBackupAt: null }),
      "utf-8"
    );

    const store = new Conf({
      cwd,
      configName: "backup-settings",
      projectName: "ruledesk-conf-persist-test",
      defaults: {
        autoBackupInterval: "daily",
        lastAutoBackupAt: null,
        hasSeenAutoBackupPrompt: false,
      },
    });

    expect(store.get("autoBackupInterval")).toBe("never");
    expect(fs.existsSync(storeFile)).toBe(true);

    const persisted = JSON.parse(fs.readFileSync(storeFile, "utf-8")) as {
      autoBackupInterval?: string;
    };
    expect(persisted.autoBackupInterval).toBe("never");

    fs.rmSync(cwd, { recursive: true, force: true });
  });
});

describe("BackupService auto-backup default + opt-in prompt", () => {
  beforeEach(() => {
    fs.mkdirSync(testUserDataDir, { recursive: true });
    wipeSettingsFile();
    resetBackupStoreForTests();
  });

  afterEach(() => {
    wipeSettingsFile();
    resetBackupStoreForTests();
  });

  it("new install (no settings file): defaults to daily and does not show prompt", () => {
    expect(fs.existsSync(settingsPath())).toBe(false);
    installStoreFromDisk();
    expect(backupSettingsFileExistedBeforeInit()).toBe(false);

    const service = createBackupService();
    expect(service.getAutoBackupSchedule()).toBe("daily");
    expect(service.shouldShowAutoBackupPrompt()).toBe(false);
  });

  it("existing install with never: keeps never and shows prompt once", () => {
    writeSettingsFile({
      autoBackupInterval: "never",
      lastAutoBackupAt: null,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();
    expect(backupSettingsFileExistedBeforeInit()).toBe(true);

    const service = createBackupService();
    expect(service.getAutoBackupSchedule()).toBe("never");
    expect(service.shouldShowAutoBackupPrompt()).toBe(true);

    service.markAutoBackupPromptSeen();
    expect(service.shouldShowAutoBackupPrompt()).toBe(false);

    // Simulate a new process: clear singleton, keep the same file on disk.
    resetBackupStoreForTests();
    installStoreFromDisk();
    expect(backupSettingsFileExistedBeforeInit()).toBe(true);
    const nextSession = createBackupService();
    expect(nextSession.getAutoBackupSchedule()).toBe("never");
    expect(nextSession.shouldShowAutoBackupPrompt()).toBe(false);
  });

  it("existing install already on daily/weekly: never shows prompt", () => {
    writeSettingsFile({
      autoBackupInterval: "weekly",
      lastAutoBackupAt: 1,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();
    expect(backupSettingsFileExistedBeforeInit()).toBe(true);

    const service = createBackupService();
    expect(service.getAutoBackupSchedule()).toBe("weekly");
    expect(service.shouldShowAutoBackupPrompt()).toBe(false);
  });
});
