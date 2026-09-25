import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/main/lib/backup-sidecar", () => ({
  BACKUP_SIDECAR_SUFFIX: ".settings.json",
  getBackupSidecarPath: (backupDbPath: string) => `${backupDbPath}.settings.json`,
  writeBackupSidecar: vi.fn(),
  restoreBackupSidecar: vi.fn(() => false),
  logRestoredSettingsSnapshot: vi.fn(),
}));

import {
  buildAutoBackupFilename,
  createConsistentBackup,
  isAutoBackupFilename,
  isManualBackupFilename,
  isLegacyAutoBackupFilename,
} from "@/main/lib/database-backup";
import { restoreDatabaseFromBackup } from "@/main/lib/database-restore";
import { writeBackupSidecar } from "@/main/lib/backup-sidecar";
import {
  ensureDrizzleMigrationsTable,
  readMigrationJournal,
  runManualMigrations,
} from "@/main/db/migration-runner";

const PROJECT_DRIZZLE = path.resolve(process.cwd(), "drizzle");

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function seedDatabase(dbPath: string): void {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  const entries = readMigrationJournal(PROJECT_DRIZZLE);
  if (!entries) {
    sqlite.close();
    throw new Error("migration journal missing");
  }
  ensureDrizzleMigrationsTable(sqlite);
  runManualMigrations(sqlite, PROJECT_DRIZZLE, entries);
  sqlite
    .prepare(
      `INSERT INTO artists (name, tag, provider, type, api_endpoint, last_post_id, new_posts_count, created_at)
       VALUES (?, ?, 'rule34', 'tag', 'https://example.test', 0, 0, ?)`
    )
    .run("Backup Artist", "backup_artist", Date.now());
  sqlite
    .prepare(
      `INSERT INTO settings (id, user_id, encrypted_api_key, provider)
       VALUES (1, 'backup-user', 'enc-key', 'rule34')`
    )
    .run();
  sqlite.close();
}

function readArtistTag(dbPath: string): string | undefined {
  const sqlite = new Database(dbPath, { readonly: true });
  try {
    const row: unknown = sqlite
      .prepare("SELECT tag FROM artists WHERE name = ?")
      .get("Backup Artist");
    if (
      typeof row !== "object" ||
      row === null ||
      !("tag" in row) ||
      typeof row.tag !== "string"
    ) {
      return undefined;
    }
    return row.tag;
  } finally {
    sqlite.close();
  }
}

function readSettingsUserId(dbPath: string): string | undefined {
  const sqlite = new Database(dbPath, { readonly: true });
  try {
    const row: unknown = sqlite
      .prepare("SELECT user_id AS userId FROM settings WHERE id = 1")
      .get();
    if (
      typeof row !== "object" ||
      row === null ||
      !("userId" in row) ||
      typeof row.userId !== "string"
    ) {
      return undefined;
    }
    return row.userId;
  } finally {
    sqlite.close();
  }
}

describe("backup/restore consistency", () => {
  const tempDirs: string[] = [];
  let openSqlite: InstanceType<typeof Database> | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (openSqlite) {
      try {
        openSqlite.close();
      } catch {
        // ignore
      }
      openSqlite = null;
    }
    for (const dir of tempDirs.splice(0)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  it("classifies legacy and unified backup filenames for separate retention", () => {
    expect(isLegacyAutoBackupFilename("data.backup.2026-09-25.bin")).toBe(true);
    expect(isAutoBackupFilename("data.backup.2026-09-25.bin")).toBe(true);
    expect(isAutoBackupFilename(".ruledesk-backup-auto-2026-09-25.db")).toBe(true);
    expect(isManualBackupFilename(".ruledesk-backup-2026-09-25T01-02-03-000Z.db")).toBe(
      true
    );
    expect(isManualBackupFilename(".ruledesk-backup-auto-2026-09-25.db")).toBe(false);
    expect(isAutoBackupFilename(".ruledesk-backup-2026-09-25T01-02-03-000Z.db")).toBe(
      false
    );
    expect(buildAutoBackupFilename(new Date("2026-09-25T12:00:00Z"))).toBe(
      ".ruledesk-backup-auto-2026-09-25.db"
    );
  });

  it("VACUUM INTO backup then restore recovers artists/settings bit-for-bit for key rows", async () => {
    const tempDir = createTempDir("ruledesk-backup-cycle-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    seedDatabase(dbPath);

    openSqlite = new Database(dbPath);
    openSqlite.pragma("journal_mode = WAL");

    const backupPath = path.join(tempDir, buildAutoBackupFilename(new Date()));
    const vacuumStartedAt = Date.now();
    createConsistentBackup(openSqlite, backupPath);
    const vacuumMs = Date.now() - vacuumStartedAt;
    // Medium/small fixture — expect sub-second; recorded for PR notes.
    expect(vacuumMs).toBeLessThan(5000);
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(writeBackupSidecar).toHaveBeenCalledWith(backupPath);

    openSqlite.close();
    openSqlite = null;
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(`${dbPath}-wal`, { force: true });
    fs.rmSync(`${dbPath}-shm`, { force: true });

    const restoreResult = await restoreDatabaseFromBackup(backupPath, {
      getPaths: () => ({
        dbPath,
        walPath: `${dbPath}-wal`,
        shmPath: `${dbPath}-shm`,
      }),
      closeDatabase: () => {
        // already closed
      },
      initializeDatabase: async () => {
        // Touch the restored file to prove reopen works
        const probe = new Database(dbPath);
        probe.close();
      },
    });

    expect(restoreResult.success).toBe(true);
    expect(readArtistTag(dbPath)).toBe("backup_artist");
    expect(readSettingsUserId(dbPath)).toBe("backup-user");
    expect(fs.existsSync(`${dbPath}.bak`)).toBe(false);
  });

  it("restores a legacy .bin backup file the same way as .db", async () => {
    const tempDir = createTempDir("ruledesk-backup-legacy-bin-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    seedDatabase(dbPath);

    openSqlite = new Database(dbPath);
    const legacyBinPath = path.join(tempDir, "data.backup.2026-01-15.bin");
    createConsistentBackup(openSqlite, legacyBinPath);
    openSqlite.close();
    openSqlite = null;

    // Mutate live DB so restore is observable
    const live = new Database(dbPath);
    live.prepare("UPDATE settings SET user_id = 'mutated' WHERE id = 1").run();
    live.close();

    const restoreResult = await restoreDatabaseFromBackup(legacyBinPath, {
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

    expect(restoreResult.success).toBe(true);
    expect(readSettingsUserId(dbPath)).toBe("backup-user");
    expect(readArtistTag(dbPath)).toBe("backup_artist");
  });

  it("keeps .bak and rolls back when reinit fails after rename", async () => {
    const tempDir = createTempDir("ruledesk-backup-rollback-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    seedDatabase(dbPath);

    openSqlite = new Database(dbPath);
    const backupPath = path.join(tempDir, ".ruledesk-backup-test.db");
    createConsistentBackup(openSqlite, backupPath);
    openSqlite.close();
    openSqlite = null;

    // Live DB has distinct marker value
    const live = new Database(dbPath);
    live.prepare("UPDATE settings SET user_id = 'pre-restore-live' WHERE id = 1").run();
    live.close();

    let initializeCalls = 0;
    const restoreResult = await restoreDatabaseFromBackup(backupPath, {
      getPaths: () => ({
        dbPath,
        walPath: `${dbPath}-wal`,
        shmPath: `${dbPath}-shm`,
      }),
      closeDatabase: () => undefined,
      initializeDatabase: async () => {
        initializeCalls += 1;
        if (initializeCalls === 1) {
          // Simulate migration/init failure after the live file was replaced.
          expect(fs.existsSync(`${dbPath}.bak`)).toBe(true);
          throw new Error("intentional initializeDatabase failure");
        }
      },
    });

    expect(restoreResult.success).toBe(false);
    expect(restoreResult.error).toContain("intentional initializeDatabase failure");
    // Rollback restored the pre-restore live marker
    expect(readSettingsUserId(dbPath)).toBe("pre-restore-live");
    // After successful rollback rename, .bak should be consumed (moved back)
    expect(fs.existsSync(`${dbPath}.bak`)).toBe(false);
    expect(initializeCalls).toBe(2);
  });
});
