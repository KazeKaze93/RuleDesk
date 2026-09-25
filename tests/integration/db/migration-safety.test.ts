import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import {
  createPreMigrationSnapshot,
  deletePreMigrationSnapshot,
  ensureDrizzleMigrationsTable,
  getPreMigrationSnapshotPath,
  hasPendingMigrations,
  readMigrationJournal,
  runManualMigrations,
  splitMigrationStatements,
  executeMigrationStatement,
  applyMigrationInTransaction,
} from "@/main/db/migration-runner";

const PROJECT_DRIZZLE = path.resolve(process.cwd(), "drizzle");

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function copyDrizzleFolder(targetDir: string): string {
  const dest = path.join(targetDir, "drizzle");
  fs.cpSync(PROJECT_DRIZZLE, dest, { recursive: true });
  return dest;
}

function readCount(sqlite: InstanceType<typeof Database>): number {
  const row: unknown = sqlite
    .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
    .get();
  if (
    typeof row !== "object" ||
    row === null ||
    !("count" in row) ||
    typeof row.count !== "number"
  ) {
    throw new Error("unexpected migration count row");
  }
  return row.count;
}

function readColumnNames(
  sqlite: InstanceType<typeof Database>,
  table: string
): string[] {
  const rows: unknown = sqlite.prepare(`PRAGMA table_info(${table})`).all();
  if (!Array.isArray(rows)) {
    throw new Error("PRAGMA table_info did not return an array");
  }
  return rows.map((row) => {
    if (
      typeof row !== "object" ||
      row === null ||
      !("name" in row) ||
      typeof row.name !== "string"
    ) {
      throw new Error("unexpected PRAGMA table_info row");
    }
    return row.name;
  });
}

describe("migration safety (pre-snapshot + transactional apply)", () => {
  const tempDirs: string[] = [];
  const openDbs: InstanceType<typeof Database>[] = [];

  afterEach(() => {
    for (const db of openDbs.splice(0)) {
      try {
        db.close();
      } catch {
        // ignore
      }
    }
    for (const dir of tempDirs.splice(0)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  it("fresh install applies all journal migrations without creating a snapshot", () => {
    const tempDir = createTempDir("ruledesk-mig-fresh-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    const migrationsFolder = copyDrizzleFolder(tempDir);

    const sqlite = new Database(dbPath);
    openDbs.push(sqlite);
    sqlite.pragma("journal_mode = WAL");

    const entries = readMigrationJournal(migrationsFolder);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }

    ensureDrizzleMigrationsTable(sqlite);
    expect(hasPendingMigrations(sqlite, entries)).toBe(false);

    runManualMigrations(sqlite, migrationsFolder, entries);

    expect(readCount(sqlite)).toBe(entries.length);
    expect(fs.existsSync(getPreMigrationSnapshotPath(dbPath))).toBe(false);

    const artists = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='artists'")
      .get();
    expect(artists).toBeTruthy();
  });

  it("upgrade with pending migrations creates then deletes snapshot after success", () => {
    const tempDir = createTempDir("ruledesk-mig-upgrade-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    const migrationsFolder = copyDrizzleFolder(tempDir);

    const entries = readMigrationJournal(migrationsFolder);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }

    const firstBatch = entries.slice(0, 20);
    const sqlite1 = new Database(dbPath);
    sqlite1.pragma("journal_mode = WAL");
    ensureDrizzleMigrationsTable(sqlite1);
    runManualMigrations(sqlite1, migrationsFolder, firstBatch);
    sqlite1
      .prepare(
        "INSERT INTO settings (id, user_id, encrypted_api_key) VALUES (1, 'upgrade-user', 'key')"
      )
      .run();
    sqlite1.close();

    const sqlite2 = new Database(dbPath);
    openDbs.push(sqlite2);
    sqlite2.pragma("journal_mode = WAL");
    ensureDrizzleMigrationsTable(sqlite2);

    expect(hasPendingMigrations(sqlite2, entries)).toBe(true);

    const snapshotPath = createPreMigrationSnapshot(sqlite2, dbPath);
    expect(fs.existsSync(snapshotPath)).toBe(true);

    runManualMigrations(sqlite2, migrationsFolder, entries);

    expect(readCount(sqlite2)).toBe(entries.length);

    deletePreMigrationSnapshot(snapshotPath);
    expect(fs.existsSync(snapshotPath)).toBe(false);

    const settingsRow: unknown = sqlite2
      .prepare("SELECT user_id AS userId FROM settings WHERE id = 1")
      .get();
    if (
      typeof settingsRow !== "object" ||
      settingsRow === null ||
      !("userId" in settingsRow) ||
      typeof settingsRow.userId !== "string"
    ) {
      throw new Error("settings row missing");
    }
    expect(settingsRow.userId).toBe("upgrade-user");
  });

  it("failed multi-statement migration rolls back fully and leaves snapshot on disk", () => {
    const tempDir = createTempDir("ruledesk-mig-fail-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    const migrationsFolder = copyDrizzleFolder(tempDir);

    const entries = readMigrationJournal(migrationsFolder);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }

    const prefix = entries.slice(0, 20);
    const sqlite1 = new Database(dbPath);
    sqlite1.pragma("journal_mode = WAL");
    ensureDrizzleMigrationsTable(sqlite1);
    runManualMigrations(sqlite1, migrationsFolder, prefix);
    sqlite1.close();

    const failingTag = "9999_intentional_fail";
    fs.writeFileSync(
      path.join(migrationsFolder, `${failingTag}.sql`),
      [
        "ALTER TABLE settings ADD COLUMN intentional_probe_col INTEGER DEFAULT 0;",
        "CREATE TABLE this_will_fail_because_syntax ERROR;",
      ].join("\n"),
      "utf-8"
    );

    const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
    const journalParsed: unknown = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
    if (
      typeof journalParsed !== "object" ||
      journalParsed === null ||
      !("entries" in journalParsed) ||
      !Array.isArray(journalParsed.entries)
    ) {
      throw new Error("invalid journal shape");
    }
    journalParsed.entries.push({
      idx: 9999,
      version: "6",
      when: Date.now(),
      tag: failingTag,
      breakpoints: true,
    });
    fs.writeFileSync(journalPath, JSON.stringify(journalParsed, null, 2), "utf-8");

    const allEntries = readMigrationJournal(migrationsFolder);
    expect(allEntries).not.toBeNull();
    if (!allEntries) {
      throw new Error("journal missing after inject");
    }

    const sqlite2 = new Database(dbPath);
    openDbs.push(sqlite2);
    sqlite2.pragma("journal_mode = WAL");
    ensureDrizzleMigrationsTable(sqlite2);

    expect(hasPendingMigrations(sqlite2, allEntries)).toBe(true);
    const snapshotPath = createPreMigrationSnapshot(sqlite2, dbPath);

    expect(() =>
      runManualMigrations(sqlite2, migrationsFolder, allEntries)
    ).toThrow();

    const failingHash = sqlite2
      .prepare("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
      .get(failingTag);
    expect(failingHash).toBeUndefined();

    expect(readColumnNames(sqlite2, "settings")).not.toContain(
      "intentional_probe_col"
    );
    expect(fs.existsSync(snapshotPath)).toBe(true);

    expect(() =>
      runManualMigrations(sqlite2, migrationsFolder, allEntries)
    ).toThrow();
    expect(
      sqlite2
        .prepare("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
        .get(failingTag)
    ).toBeUndefined();
  });

  it("skips individual ADD COLUMN when column already exists without failing the file", () => {
    const sqlite = new Database(":memory:");
    openDbs.push(sqlite);
    sqlite.exec(`
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY,
        is_adult_verified integer DEFAULT 0 NOT NULL
      );
    `);

    const statements = splitMigrationStatements(`
      ALTER TABLE settings ADD COLUMN is_adult_verified integer DEFAULT 0 NOT NULL;
      ALTER TABLE settings ADD COLUMN tos_accepted_at integer;
    `);
    expect(statements).toHaveLength(2);

    for (const statement of statements) {
      executeMigrationStatement(sqlite, statement);
    }

    expect(readColumnNames(sqlite, "settings").sort()).toEqual([
      "id",
      "is_adult_verified",
      "tos_accepted_at",
    ]);
  });

  it("applyMigrationInTransaction records tag only on full success", () => {
    const sqlite = new Database(":memory:");
    openDbs.push(sqlite);
    ensureDrizzleMigrationsTable(sqlite);
    sqlite.exec("CREATE TABLE settings (id INTEGER PRIMARY KEY);");

    expect(() =>
      applyMigrationInTransaction(
        sqlite,
        "bad_tag",
        "ALTER TABLE settings ADD COLUMN ok_col INTEGER; SELECT * FROM definitely_missing;"
      )
    ).toThrow();

    expect(
      sqlite.prepare("SELECT hash FROM __drizzle_migrations WHERE hash = ?").get("bad_tag")
    ).toBeUndefined();

    expect(readColumnNames(sqlite, "settings")).not.toContain("ok_col");
  });
});
