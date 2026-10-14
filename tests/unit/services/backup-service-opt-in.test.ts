import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);

/** Paths only — created on disk in beforeEach so vi.hoisted needs no Node requires. */
const { testUserDataDir, testDbPath } = vi.hoisted(() => {
  const tmpRoot = process.env.TEMP || process.env.TMP || process.env.TMPDIR || ".";
  const needsSep = !(tmpRoot.endsWith("\\") || tmpRoot.endsWith("/"));
  const dir = `${tmpRoot}${needsSep ? "/" : ""}ruledesk-backup-store-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    testUserDataDir: dir,
    testDbPath: `${dir}/data.bin`,
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

const closeDatabaseMock = vi.fn();
const createConsistentBackupMock = vi.fn();

vi.mock("../../../src/main/db/client", () => ({
  getSqliteInstance: vi.fn(),
  closeDatabase: (...args: unknown[]) => closeDatabaseMock(...args),
  initializeDatabase: vi.fn(async () => undefined),
}));

vi.mock("../../../src/main/core/di/databaseRegistration", () => ({
  registerDatabaseInContainerAfterReinit: vi.fn(),
}));

vi.mock("../../../src/main/db/paths", () => ({
  getBackupDirectory: () => testUserDataDir,
  getDatabasePaths: () => ({
    userDataDir: testUserDataDir,
    dbPath: testDbPath,
    walPath: `${testDbPath}-wal`,
    shmPath: `${testDbPath}-shm`,
  }),
}));

const maintenanceQueueState = vi.hoisted(() => ({
  isProcessing: false,
}));

vi.mock("../../../src/main/db/maintenance-queue", () => ({
  maintenanceQueue: {
    isProcessing: () => maintenanceQueueState.isProcessing,
    execute: async <T>(operation: () => Promise<T>): Promise<T> => operation(),
  },
}));

vi.mock("../../../src/main/lib/backup-retention", () => ({
  getBackupRetention: () => 5,
}));

vi.mock("../../../src/main/lib/database-backup", () => ({
  buildAutoBackupFilename: vi.fn(() => "test-auto-backup.db"),
  createConsistentBackup: (...args: unknown[]) => createConsistentBackupMock(...args),
  listAutoBackupFilesOldestFirst: vi.fn(() => []),
  selectAutoBackupFilenamesToDelete: vi.fn(() => []),
}));

vi.mock("../../../src/main/lib/sync-db-maintenance", () => ({
  withSyncPausedForDbWork: async <T>(
    _sync: unknown,
    work: () => Promise<T>
  ): Promise<T> => work(),
}));

import type { SyncService } from "../../../src/main/services/sync-service";
import log from "electron-log";
import {
  AUTO_BACKUP_CHECK_INTERVAL_MS,
  BACKUP_SETTINGS_STORE_NAME,
  BackupService,
  CURRENT_BACKUP_POLICY_VERSION,
  buildBackupStoreDefaultsForTests,
  resetBackupStoreForTests,
  setAutoBackupFreeSpaceProbeForTests,
  setBackupStoreForTests,
  type BackupStoreContract,
} from "../../../src/main/services/backup-service";

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

function createBackupService(options?: {
  isSyncing?: () => boolean;
}): BackupService {
  const syncService = {
    getIsSyncing: options?.isSyncing ?? (() => false),
  };
  // boundary: SyncService stub for BackupService constructor (only getIsSyncing used)
  return new BackupService(syncService as SyncService);
}

function installStoreFromDisk(): void {
  setBackupStoreForTests(openBackupConfStore());
}

function writeDbStub(byteLength: number): void {
  fs.writeFileSync(testDbPath, Buffer.alloc(byteLength));
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
        backupPolicyVersion: 0,
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

describe("BackupService auto-backup default + policy migration", () => {
  beforeEach(() => {
    fs.mkdirSync(testUserDataDir, { recursive: true });
    wipeSettingsFile();
    resetBackupStoreForTests();
    maintenanceQueueState.isProcessing = false;
    closeDatabaseMock.mockReset();
    createConsistentBackupMock.mockReset();
    createConsistentBackupMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    resetBackupStoreForTests();
    fs.rmSync(testUserDataDir, { recursive: true, force: true });
  });

  it("new install (no settings file): defaults to daily and does not show prompt", () => {
    expect(fs.existsSync(settingsPath())).toBe(false);
    installStoreFromDisk();

    const service = createBackupService();
    expect(service.getAutoBackupSchedule()).toBe("daily");
    expect(service.shouldShowAutoBackupPrompt()).toBe(false);
    expect(openBackupConfStore().get("backupPolicyVersion")).toBe(
      CURRENT_BACKUP_POLICY_VERSION
    );
  });

  it("migrates never + hasSeen=false → daily and bumps policy version", () => {
    writeSettingsFile({
      autoBackupInterval: "never",
      lastAutoBackupAt: null,
      hasSeenAutoBackupPrompt: false,
      backupPolicyVersion: 0,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();

    const service = createBackupService();
    expect(service.getAutoBackupSchedule()).toBe("daily");
    expect(service.shouldShowAutoBackupPrompt()).toBe(false);

    const store = openBackupConfStore();
    expect(store.get("autoBackupInterval")).toBe("daily");
    expect(store.get("backupPolicyVersion")).toBe(CURRENT_BACKUP_POLICY_VERSION);
  });

  it("never + hasSeen=true stays never; still bumps policy version", () => {
    writeSettingsFile({
      autoBackupInterval: "never",
      lastAutoBackupAt: null,
      hasSeenAutoBackupPrompt: true,
      backupPolicyVersion: 0,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();

    const service = createBackupService();
    expect(service.getAutoBackupSchedule()).toBe("never");
    expect(service.shouldShowAutoBackupPrompt()).toBe(false);

    const store = openBackupConfStore();
    expect(store.get("autoBackupInterval")).toBe("never");
    expect(store.get("backupPolicyVersion")).toBe(CURRENT_BACKUP_POLICY_VERSION);
  });

  it("policy migration is idempotent across sessions", () => {
    writeSettingsFile({
      autoBackupInterval: "never",
      lastAutoBackupAt: null,
      hasSeenAutoBackupPrompt: false,
      backupPolicyVersion: 0,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();

    const first = createBackupService();
    expect(first.getAutoBackupSchedule()).toBe("daily");

    resetBackupStoreForTests();
    installStoreFromDisk();
    const second = createBackupService();
    expect(second.getAutoBackupSchedule()).toBe("daily");
    expect(second.shouldShowAutoBackupPrompt()).toBe(false);

    const store = openBackupConfStore();
    expect(store.get("autoBackupInterval")).toBe("daily");
    expect(store.get("backupPolicyVersion")).toBe(CURRENT_BACKUP_POLICY_VERSION);
  });

  it("existing install already on daily/weekly: never shows prompt", () => {
    writeSettingsFile({
      autoBackupInterval: "weekly",
      lastAutoBackupAt: 1,
      hasSeenAutoBackupPrompt: false,
      backupPolicyVersion: 0,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();

    const service = createBackupService();
    expect(service.getAutoBackupSchedule()).toBe("weekly");
    expect(service.shouldShowAutoBackupPrompt()).toBe(false);
  });

  it("skips auto-backup when free space is below 2× DB size (no closeDatabase)", async () => {
    writeSettingsFile({
      autoBackupInterval: "daily",
      lastAutoBackupAt: null,
      hasSeenAutoBackupPrompt: false,
      backupPolicyVersion: CURRENT_BACKUP_POLICY_VERSION,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();

    const dbBytes = 1024;
    writeDbStub(dbBytes);
    setAutoBackupFreeSpaceProbeForTests(() => dbBytes * 2 - 1);

    const service = createBackupService();
    service.checkAndRunAutoBackup();

    await vi.waitFor(() => {
      expect(log.warn).toHaveBeenCalled();
    });

    expect(closeDatabaseMock).not.toHaveBeenCalled();
    expect(createConsistentBackupMock).not.toHaveBeenCalled();

    const store = openBackupConfStore();
    expect(store.get("lastAutoBackupAt")).toBeNull();
  });
});

describe("BackupService hourly periodic check", () => {
  let activeService: BackupService | null = null;

  beforeEach(() => {
    fs.mkdirSync(testUserDataDir, { recursive: true });
    wipeSettingsFile();
    resetBackupStoreForTests();
    maintenanceQueueState.isProcessing = false;
    closeDatabaseMock.mockReset();
    createConsistentBackupMock.mockReset();
    createConsistentBackupMock.mockResolvedValue(undefined);
    activeService = null;
  });

  afterEach(() => {
    activeService?.stopPeriodicCheck();
    activeService = null;
    vi.useRealTimers();
    resetBackupStoreForTests();
    fs.rmSync(testUserDataDir, { recursive: true, force: true });
  });

  function prepareDueDailySchedule(): void {
    const dayMs = 24 * 60 * 60 * 1000;
    writeSettingsFile({
      autoBackupInterval: "daily",
      lastAutoBackupAt: Date.now() - dayMs - 1,
      hasSeenAutoBackupPrompt: true,
      backupPolicyVersion: CURRENT_BACKUP_POLICY_VERSION,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();
    writeDbStub(1024);
    setAutoBackupFreeSpaceProbeForTests(() => 1024 * 10);
  }

  it("timer fires auto-backup when the policy period has elapsed", async () => {
    prepareDueDailySchedule();
    vi.useFakeTimers();
    activeService = createBackupService();
    activeService.startPeriodicCheck();

    expect(createConsistentBackupMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(AUTO_BACKUP_CHECK_INTERVAL_MS);

    expect(createConsistentBackupMock).toHaveBeenCalledTimes(1);
    expect(closeDatabaseMock).toHaveBeenCalled();
  });

  it("timer does not fire auto-backup when the policy period has not elapsed", async () => {
    writeSettingsFile({
      autoBackupInterval: "daily",
      lastAutoBackupAt: Date.now() - 60_000,
      hasSeenAutoBackupPrompt: true,
      backupPolicyVersion: CURRENT_BACKUP_POLICY_VERSION,
    });
    resetBackupStoreForTests();
    installStoreFromDisk();
    writeDbStub(1024);
    setAutoBackupFreeSpaceProbeForTests(() => 1024 * 10);

    vi.useFakeTimers();
    activeService = createBackupService();
    activeService.startPeriodicCheck();

    await vi.advanceTimersByTimeAsync(AUTO_BACKUP_CHECK_INTERVAL_MS);

    expect(createConsistentBackupMock).not.toHaveBeenCalled();
    expect(closeDatabaseMock).not.toHaveBeenCalled();
  });

  it("timer respects sync mutex (skips when sync is in progress)", async () => {
    prepareDueDailySchedule();
    vi.useFakeTimers();
    activeService = createBackupService({ isSyncing: () => true });
    activeService.startPeriodicCheck();

    await vi.advanceTimersByTimeAsync(AUTO_BACKUP_CHECK_INTERVAL_MS);

    expect(createConsistentBackupMock).not.toHaveBeenCalled();
    expect(closeDatabaseMock).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
  });

  it("timer respects maintenanceQueue mutex (skips when queue is busy)", async () => {
    prepareDueDailySchedule();
    maintenanceQueueState.isProcessing = true;
    vi.useFakeTimers();
    activeService = createBackupService();
    activeService.startPeriodicCheck();

    await vi.advanceTimersByTimeAsync(AUTO_BACKUP_CHECK_INTERVAL_MS);

    expect(createConsistentBackupMock).not.toHaveBeenCalled();
    expect(closeDatabaseMock).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
  });
});
