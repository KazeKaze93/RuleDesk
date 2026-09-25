import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertNoUnknownMigrationHashes,
  ensureDrizzleMigrationsTable,
  readMigrationJournal,
  runManualMigrations,
  stampUserVersion,
} from "@/main/db/migration-runner";
import {
  databaseLooksInitialized,
  migrateLegacyDatabase,
  moveFileWithExdevFallback,
  type LegacyMigrateFs,
} from "@/main/db/legacy-database-migrate";

const PROJECT_DRIZZLE = path.resolve(process.cwd(), "drizzle");

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe("downgrade guard and legacy migrate", () => {
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

  it("throws on unknown __drizzle_migrations hash before mutating the DB", () => {
    const tempDir = createTempDir("ruledesk-downgrade-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    const sqlite = new Database(dbPath);
    openDbs.push(sqlite);

    const entries = readMigrationJournal(PROJECT_DRIZZLE);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }

    ensureDrizzleMigrationsTable(sqlite);
    runManualMigrations(sqlite, PROJECT_DRIZZLE, entries.slice(0, 5));

    const knownCountBefore: unknown = sqlite
      .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
      .get();
    if (
      typeof knownCountBefore !== "object" ||
      knownCountBefore === null ||
      !("count" in knownCountBefore) ||
      typeof knownCountBefore.count !== "number"
    ) {
      throw new Error("unexpected count row");
    }

    sqlite
      .prepare(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)"
      )
      .run("9999_future_migration_unknown", Date.now());

    expect(() =>
      assertNoUnknownMigrationHashes(sqlite, entries)
    ).toThrow(/9999_future_migration_unknown/);

    // Guard is read-only: the five known tags remain; only the artificial future row was added by the test.
    for (const entry of entries.slice(0, 5)) {
      expect(
        sqlite
          .prepare("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
          .get(entry.tag)
      ).toBeTruthy();
    }
    expect(knownCountBefore.count).toBe(5);
  });

  it("allows normal upgrade (pending journal tags, no unknown hashes)", () => {
    const tempDir = createTempDir("ruledesk-upgrade-ok-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    const sqlite = new Database(dbPath);
    openDbs.push(sqlite);

    const entries = readMigrationJournal(PROJECT_DRIZZLE);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }

    ensureDrizzleMigrationsTable(sqlite);
    assertNoUnknownMigrationHashes(sqlite, entries);
    runManualMigrations(sqlite, PROJECT_DRIZZLE, entries.slice(0, 10));
    assertNoUnknownMigrationHashes(sqlite, entries);
    runManualMigrations(sqlite, PROJECT_DRIZZLE, entries);

    stampUserVersion(sqlite, entries.length);
    // boundary: better-sqlite3 pragma returns number for user_version
    expect(sqlite.pragma("user_version", { simple: true })).toBe(entries.length);
  });

  it("stamps user_version on fresh install without false-positive guard", () => {
    const tempDir = createTempDir("ruledesk-fresh-user-version-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    const sqlite = new Database(dbPath);
    openDbs.push(sqlite);

    const entries = readMigrationJournal(PROJECT_DRIZZLE);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }

    ensureDrizzleMigrationsTable(sqlite);
    assertNoUnknownMigrationHashes(sqlite, entries);
    runManualMigrations(sqlite, PROJECT_DRIZZLE, entries);
    stampUserVersion(sqlite, entries.length);

    expect(sqlite.pragma("user_version", { simple: true })).toBe(entries.length);
    expect(sqlite.pragma("user_version", { simple: true })).not.toBe(0);
  });

  it("stamps user_version on preexisting DB that had user_version 0", () => {
    const tempDir = createTempDir("ruledesk-bootstrap-user-version-");
    tempDirs.push(tempDir);
    const dbPath = path.join(tempDir, "data.bin");
    const sqlite = new Database(dbPath);
    openDbs.push(sqlite);

    const entries = readMigrationJournal(PROJECT_DRIZZLE);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }

    ensureDrizzleMigrationsTable(sqlite);
    runManualMigrations(sqlite, PROJECT_DRIZZLE, entries);
    expect(sqlite.pragma("user_version", { simple: true })).toBe(0);

    assertNoUnknownMigrationHashes(sqlite, entries);
    stampUserVersion(sqlite, entries.length);
    expect(sqlite.pragma("user_version", { simple: true })).toBe(entries.length);
  });

  it("legacy migrate checkpoints WAL then moves the main file", async () => {
    const tempDir = createTempDir("ruledesk-legacy-move-");
    tempDirs.push(tempDir);
    const legacyDir = path.join(tempDir, "RuleDesk");
    const newDir = path.join(tempDir, ".rdcache");
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.mkdirSync(newDir, { recursive: true });

    const legacyDbPath = path.join(legacyDir, "metadata.db");
    const newDbPath = path.join(newDir, "data.bin");

    const legacy = new Database(legacyDbPath);
    legacy.pragma("journal_mode = WAL");
    legacy.exec(
      "CREATE TABLE artists (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO artists (name) VALUES ('legacy-artist');"
    );
    // Force WAL activity
    legacy.exec("INSERT INTO artists (name) VALUES ('wal-row');");
    legacy.close();

    expect(fs.existsSync(`${legacyDbPath}-wal`) || fs.existsSync(legacyDbPath)).toBe(
      true
    );

    const result = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: "RuleDesk",
          userDataDir: legacyDir,
          dbPath: legacyDbPath,
        },
      ],
    });

    expect(result.migrated).toBe(true);
    expect(result.blockedLegacyPath).toBeNull();
    expect(fs.existsSync(newDbPath)).toBe(true);
    expect(fs.existsSync(legacyDbPath)).toBe(false);
    expect(databaseLooksInitialized(newDbPath)).toBe(true);

    const opened = new Database(newDbPath, { readonly: true });
    openDbs.push(opened);
    const row: unknown = opened
      .prepare("SELECT name FROM artists WHERE name = ?")
      .get("legacy-artist");
    expect(row).toMatchObject({ name: "legacy-artist" });
  });

  it("EXDEV fallback copies, verifies size, then unlinks source", async () => {
    const tempDir = createTempDir("ruledesk-exdev-");
    tempDirs.push(tempDir);
    const source = path.join(tempDir, "source.bin");
    const target = path.join(tempDir, "subdir", "target.bin");
    fs.writeFileSync(source, "consistent-payload-bytes");

    let renameCalls = 0;
    const fileFs: LegacyMigrateFs = {
      access: (p) => fs.promises.access(p),
      mkdir: (p, options) => fs.promises.mkdir(p, options),
      rename: async () => {
        renameCalls += 1;
        const err = new Error("cross-device link not permitted") as NodeJS.ErrnoException;
        err.code = "EXDEV";
        throw err;
      },
      copyFile: (s, t) => fs.promises.copyFile(s, t),
      unlink: (p) => fs.promises.unlink(p),
      stat: (p) => fs.promises.stat(p),
      readdir: (p) => fs.promises.readdir(p),
      rmdir: (p) => fs.promises.rmdir(p),
      rmSync: (p, options) => fs.rmSync(p, options),
      existsSync: (p) => fs.existsSync(p),
    };

    const moved = await moveFileWithExdevFallback(source, target, fileFs);
    expect(moved).toBe(true);
    expect(renameCalls).toBe(1);
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target, "utf-8")).toBe("consistent-payload-bytes");
    expect(fs.existsSync(source)).toBe(false);
  });

  it("checkpoint failure leaves legacy files in place for retry", async () => {
    const tempDir = createTempDir("ruledesk-legacy-checkpoint-fail-");
    tempDirs.push(tempDir);
    const legacyDir = path.join(tempDir, "RuleDesk");
    const newDir = path.join(tempDir, ".rdcache");
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.mkdirSync(newDir, { recursive: true });

    const legacyDbPath = path.join(legacyDir, "metadata.db");
    const newDbPath = path.join(newDir, "data.bin");
    fs.writeFileSync(legacyDbPath, "not-a-sqlite-database");

    const result = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: "RuleDesk",
          userDataDir: legacyDir,
          dbPath: legacyDbPath,
        },
      ],
      deps: {
        openDatabase: () => {
          throw new Error("simulated checkpoint failure");
        },
      },
    });

    expect(result.migrated).toBe(false);
    expect(result.blockedLegacyPath).toBe(legacyDbPath);
    expect(fs.existsSync(legacyDbPath)).toBe(true);
    expect(fs.existsSync(newDbPath)).toBe(false);
  });

  it("does not permanently orphan legacy data after checkpoint fail + empty new DB init", async () => {
    // Seam test: what a buggy client used to do between two launches —
    // (1) migrate fails checkpoint, (2) new Database + full migrations on empty path,
    // (3) second migrate without artificial failure must still move legacy data
    // (not skip via databaseLooksInitialized on the empty-but-valid new DB).
    const tempDir = createTempDir("ruledesk-legacy-orphan-seam-");
    tempDirs.push(tempDir);
    const legacyDir = path.join(tempDir, "RuleDesk");
    const newDir = path.join(tempDir, ".rdcache");
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.mkdirSync(newDir, { recursive: true });

    const legacyDbPath = path.join(legacyDir, "metadata.db");
    const newDbPath = path.join(newDir, "data.bin");

    const legacy = new Database(legacyDbPath);
    legacy.exec(
      "CREATE TABLE artists (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO artists (name) VALUES ('orphan-me');"
    );
    legacy.close();

    const first = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: "RuleDesk",
          userDataDir: legacyDir,
          dbPath: legacyDbPath,
        },
      ],
      deps: {
        openDatabase: () => {
          throw new Error("transient lock");
        },
      },
    });
    expect(first.blockedLegacyPath).toBe(legacyDbPath);
    expect(first.migrated).toBe(false);
    expect(fs.existsSync(newDbPath)).toBe(false);

    // Simulate the old buggy client path: create + migrate an empty new DB anyway.
    const emptyNew = new Database(newDbPath);
    openDbs.push(emptyNew);
    const entries = readMigrationJournal(PROJECT_DRIZZLE);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }
    ensureDrizzleMigrationsTable(emptyNew);
    runManualMigrations(emptyNew, PROJECT_DRIZZLE, entries);
    emptyNew.close();
    openDbs.pop();

    expect(databaseLooksInitialized(newDbPath)).toBe(true);
    expect(fs.existsSync(legacyDbPath)).toBe(true);

    const second = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: "RuleDesk",
          userDataDir: legacyDir,
          dbPath: legacyDbPath,
        },
      ],
    });

    expect(second.migrated).toBe(true);
    expect(second.blockedLegacyPath).toBeNull();
    expect(fs.existsSync(legacyDbPath)).toBe(false);
    expect(fs.existsSync(newDbPath)).toBe(true);

    const opened = new Database(newDbPath, { readonly: true });
    openDbs.push(opened);
    expect(
      opened.prepare("SELECT name FROM artists WHERE name = ?").get("orphan-me")
    ).toMatchObject({ name: "orphan-me" });
  });

  it("does not delete new DB that has settings/ToS but zero artists when legacy remains", async () => {
    // Same seam as the orphan recovery test, but after empty migrate the user
    // already passed AgeGate (tos_accepted_at set) with no artists yet.
    // artists.count===0 must NOT be treated as a removable stub.
    const tempDir = createTempDir("ruledesk-legacy-settings-not-stub-");
    tempDirs.push(tempDir);
    const legacyDir = path.join(tempDir, "RuleDesk");
    const newDir = path.join(tempDir, ".rdcache");
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.mkdirSync(newDir, { recursive: true });

    const legacyDbPath = path.join(legacyDir, "metadata.db");
    const newDbPath = path.join(newDir, "data.bin");

    const legacy = new Database(legacyDbPath);
    legacy.exec(
      "CREATE TABLE artists (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO artists (name) VALUES ('legacy-only');"
    );
    legacy.close();

    const first = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: "RuleDesk",
          userDataDir: legacyDir,
          dbPath: legacyDbPath,
        },
      ],
      deps: {
        openDatabase: () => {
          throw new Error("transient lock");
        },
      },
    });
    expect(first.blockedLegacyPath).toBe(legacyDbPath);

    const seeded = new Database(newDbPath);
    openDbs.push(seeded);
    const entries = readMigrationJournal(PROJECT_DRIZZLE);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }
    ensureDrizzleMigrationsTable(seeded);
    runManualMigrations(seeded, PROJECT_DRIZZLE, entries);
    seeded
      .prepare(
        `INSERT INTO settings (id, is_adult_verified, tos_accepted_at)
         VALUES (1, 1, ?)`
      )
      .run(Date.now());
    seeded.close();
    openDbs.pop();

    const newDbBytesBefore = fs.readFileSync(newDbPath);
    const legacyBytesBefore = fs.readFileSync(legacyDbPath);

    const second = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: "RuleDesk",
          userDataDir: legacyDir,
          dbPath: legacyDbPath,
        },
      ],
    });

    expect(second.migrated).toBe(false);
    expect(second.blockedLegacyPath).toBe(legacyDbPath);
    expect(fs.existsSync(legacyDbPath)).toBe(true);
    expect(fs.existsSync(newDbPath)).toBe(true);
    expect(fs.readFileSync(newDbPath)).toEqual(newDbBytesBefore);
    expect(fs.readFileSync(legacyDbPath)).toEqual(legacyBytesBefore);

    const probe = new Database(newDbPath, { readonly: true });
    openDbs.push(probe);
    expect(
      probe.prepare("SELECT COUNT(*) AS c FROM artists").get()
    ).toMatchObject({ c: 0 });
    expect(
      probe
        .prepare("SELECT tos_accepted_at IS NOT NULL AS has_tos FROM settings WHERE id = 1")
        .get()
    ).toMatchObject({ has_tos: 1 });
  });
});
