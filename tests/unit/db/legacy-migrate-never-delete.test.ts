import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import {
  databaseLooksInitialized,
  migrateLegacyDatabase,
} from "../../../src/main/db/legacy-database-migrate";
import {
  ensureDrizzleMigrationsTable,
  readMigrationJournal,
  runManualMigrations,
} from "../../../src/main/db/migration-runner";
import { ErrorCode } from "../../../src/shared/types/error-codes";
import { getErrorCode } from "../../../src/shared/utils/type-guards";

const PROJECT_DRIZZLE = path.resolve(process.cwd(), "drizzle");

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe("legacy migrate never deletes on open/read error", () => {
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

  it("openDatabase throw (ABI/EBUSY sim) leaves existing file and throws DATABASE_UNREADABLE", async () => {
    const tempDir = createTempDir("ruledesk-never-delete-unreadable-");
    tempDirs.push(tempDir);
    const newDir = path.join(tempDir, "live");
    const legacyDir = path.join(tempDir, "RuleDesk");
    fs.mkdirSync(newDir, { recursive: true });
    fs.mkdirSync(legacyDir, { recursive: true });

    const newDbPath = path.join(newDir, "data.bin");
    const legacyDbPath = path.join(legacyDir, "metadata.db");
    const payload = Buffer.from("user-db-bytes-must-survive");
    fs.writeFileSync(newDbPath, payload);
    fs.writeFileSync(legacyDbPath, "legacy-present");

    const before = fs.readFileSync(newDbPath);
    let openCalls = 0;

    await expect(
      migrateLegacyDatabase({
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
            openCalls += 1;
            throw new Error("simulated ABI / EBUSY open failure");
          },
        },
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(getErrorCode(error)).toBe(ErrorCode.DATABASE_UNREADABLE);
      expect(error).toBeInstanceOf(Error);
      if (!(error instanceof Error)) {
        return false;
      }
      expect(error.message).toContain(newDbPath);
      expect(error.message).toContain("simulated ABI / EBUSY open failure");
      return true;
    });

    expect(openCalls).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(newDbPath)).toBe(true);
    expect(fs.readFileSync(newDbPath)).toEqual(before);
    expect(
      fs.readdirSync(newDir).some((name) => name.includes(".quarantine-"))
    ).toBe(false);
    expect(databaseLooksInitialized(newDbPath, () => {
      throw new Error("still unreadable");
    })).toBe("unreadable");
  });

  it("file exists, no legacy candidates, readable uninitialized stub — never deleted", async () => {
    const tempDir = createTempDir("ruledesk-never-delete-empty-stub-");
    tempDirs.push(tempDir);
    const newDir = path.join(tempDir, "live");
    fs.mkdirSync(newDir, { recursive: true });
    const newDbPath = path.join(newDir, "data.bin");

    const stub = new Database(newDbPath);
    // Valid SQLite with no artists / no __drizzle_migrations rows.
    stub.exec("CREATE TABLE unrelated (id INTEGER PRIMARY KEY);");
    stub.close();

    expect(databaseLooksInitialized(newDbPath)).toBe("uninitialized");
    const before = fs.readFileSync(newDbPath);

    const result = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [],
    });

    expect(result.migrated).toBe(false);
    expect(result.blockedLegacyPath).toBeNull();
    expect(fs.existsSync(newDbPath)).toBe(true);
    expect(fs.readFileSync(newDbPath)).toEqual(before);
    expect(
      fs.readdirSync(newDir).some((name) => name.includes(".quarantine-"))
    ).toBe(false);
  });

  it("file exists, no legacy candidates — unreadable still throws and does not mutate", async () => {
    const tempDir = createTempDir("ruledesk-never-delete-no-legacy-unread-");
    tempDirs.push(tempDir);
    const newDir = path.join(tempDir, "live");
    fs.mkdirSync(newDir, { recursive: true });
    const newDbPath = path.join(newDir, "data.bin");
    const payload = Buffer.from("opaque-bytes");
    fs.writeFileSync(newDbPath, payload);
    const before = fs.readFileSync(newDbPath);

    await expect(
      migrateLegacyDatabase({
        newDbPath,
        legacyCandidates: [],
        deps: {
          openDatabase: () => {
            throw new Error("EBUSY");
          },
        },
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(getErrorCode(error)).toBe(ErrorCode.DATABASE_UNREADABLE);
      return true;
    });

    expect(fs.readFileSync(newDbPath)).toEqual(before);
    expect(
      fs.readdirSync(newDir).some((name) => name.includes(".quarantine-"))
    ).toBe(false);
  });

  it("empty-but-migrated stub + accessible legacy migrates and quarantines stub", async () => {
    const tempDir = createTempDir("ruledesk-never-delete-quarantine-");
    tempDirs.push(tempDir);
    const legacyDir = path.join(tempDir, "RuleDesk");
    const newDir = path.join(tempDir, "live");
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.mkdirSync(newDir, { recursive: true });

    const legacyDbPath = path.join(legacyDir, "metadata.db");
    const newDbPath = path.join(newDir, "data.bin");

    const legacy = new Database(legacyDbPath);
    legacy.exec(
      "CREATE TABLE artists (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO artists (name) VALUES ('from-legacy');"
    );
    legacy.close();

    const stub = new Database(newDbPath);
    openDbs.push(stub);
    const entries = readMigrationJournal(PROJECT_DRIZZLE);
    expect(entries).not.toBeNull();
    if (!entries) {
      throw new Error("journal missing");
    }
    ensureDrizzleMigrationsTable(stub);
    runManualMigrations(stub, PROJECT_DRIZZLE, entries);
    stub.close();
    openDbs.pop();

    expect(databaseLooksInitialized(newDbPath)).toBe("initialized");
    const stubBytes = fs.readFileSync(newDbPath);

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
    expect(fs.existsSync(legacyDbPath)).toBe(false);
    expect(fs.existsSync(newDbPath)).toBe(true);

    const quarantined = fs
      .readdirSync(newDir)
      .filter((name) => name.startsWith("data.bin.quarantine-"));
    expect(quarantined).toHaveLength(1);
    const quarantinedName = quarantined[0];
    if (quarantinedName === undefined) {
      throw new Error("expected quarantined stub filename");
    }
    expect(fs.readFileSync(path.join(newDir, quarantinedName))).toEqual(
      stubBytes
    );

    const opened = new Database(newDbPath, { readonly: true });
    openDbs.push(opened);
    expect(
      opened.prepare("SELECT name FROM artists WHERE name = ?").get("from-legacy")
    ).toMatchObject({ name: "from-legacy" });
  });
});
