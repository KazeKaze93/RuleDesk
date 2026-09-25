import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import {
  databaseLooksInitialized,
  migrateLegacyDatabase,
  moveFileWithExdevFallback,
  type LegacyMigrateFs,
} from "@/main/db/legacy-database-migrate";
import {
  LOCAL_STATE_FILE_NAME,
  migrateLightUserDataSidecars,
} from "@/main/lib/light-user-data-migrate";
import {
  BACKUP_DIR_NAME,
  DB_FILE_NAME,
  LEGACY_DB_FILE_NAME,
  LEGACY_NEUTRAL_USER_DATA_DIR_NAME,
  LEGACY_USER_DATA_DIR_NAMES,
  USER_DATA_DIR_NAME,
} from "@/main/db/paths";

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function assertNoNameCollision(dirName: string): void {
  expect(LEGACY_USER_DATA_DIR_NAMES).not.toContain(dirName);
  expect(dirName).not.toBe(BACKUP_DIR_NAME);
  expect(dirName).not.toBe(LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
  for (const legacyName of LEGACY_USER_DATA_DIR_NAMES) {
    expect(dirName).not.toBe(legacyName);
    expect(dirName.startsWith(`${legacyName}${path.sep}`)).toBe(false);
    expect(dirName.startsWith(`${legacyName}/`)).toBe(false);
  }
  expect(dirName.startsWith(`${BACKUP_DIR_NAME}${path.sep}`)).toBe(false);
  expect(dirName.startsWith(`${BACKUP_DIR_NAME}/`)).toBe(false);
  expect(BACKUP_DIR_NAME.startsWith(`${dirName}${path.sep}`)).toBe(false);
  expect(BACKUP_DIR_NAME.startsWith(`${dirName}/`)).toBe(false);
}

describe("live DB relocate path constants", () => {
  it("USER_DATA_DIR_NAME never collides with legacy or backup dir names", () => {
    assertNoNameCollision(USER_DATA_DIR_NAME);
  });

  it("BACKUP_DIR_NAME still never collides with LEGACY_USER_DATA_DIR_NAMES", () => {
    expect(LEGACY_USER_DATA_DIR_NAMES).not.toContain(BACKUP_DIR_NAME);
    for (const legacyName of LEGACY_USER_DATA_DIR_NAMES) {
      expect(BACKUP_DIR_NAME).not.toBe(legacyName);
      expect(BACKUP_DIR_NAME.startsWith(`${legacyName}${path.sep}`)).toBe(false);
      expect(BACKUP_DIR_NAME.startsWith(`${legacyName}/`)).toBe(false);
    }
  });
});

describe("relocate live DB out of .rdcache", () => {
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

  it("fresh install target: migrate is a no-op when neither legacy source exists", async () => {
    const root = createTempDir("ruledesk-relocate-fresh-");
    tempDirs.push(root);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(liveDir, { recursive: true });
    const newDbPath = path.join(liveDir, DB_FILE_NAME);

    const fromProduct = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: "RuleDesk",
          userDataDir: path.join(root, "RuleDesk"),
          dbPath: path.join(root, "RuleDesk", LEGACY_DB_FILE_NAME),
        },
      ],
    });
    const fromRdcache = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: LEGACY_NEUTRAL_USER_DATA_DIR_NAME,
          userDataDir: path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME),
          dbPath: path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME, DB_FILE_NAME),
        },
      ],
    });

    expect(fromProduct.migrated).toBe(false);
    expect(fromRdcache.migrated).toBe(false);
    expect(fs.existsSync(newDbPath)).toBe(false);
    expect(fs.existsSync(path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME))).toBe(
      false
    );
  });

  it("moves .rdcache/data.bin into RuleDesk-Data via checkpoint+move", async () => {
    const root = createTempDir("ruledesk-relocate-rdcache-");
    tempDirs.push(root);
    const rdcacheDir = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(rdcacheDir, { recursive: true });
    fs.mkdirSync(liveDir, { recursive: true });

    const sourceDb = path.join(rdcacheDir, DB_FILE_NAME);
    const newDbPath = path.join(liveDir, DB_FILE_NAME);

    const source = new Database(sourceDb);
    source.pragma("journal_mode = WAL");
    source.exec(
      "CREATE TABLE artists (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO artists (name) VALUES ('from-rdcache');"
    );
    source.exec("INSERT INTO artists (name) VALUES ('wal-row');");
    source.close();

    const result = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: LEGACY_NEUTRAL_USER_DATA_DIR_NAME,
          userDataDir: rdcacheDir,
          dbPath: sourceDb,
        },
      ],
    });

    expect(result.migrated).toBe(true);
    expect(result.blockedLegacyPath).toBeNull();
    expect(fs.existsSync(newDbPath)).toBe(true);
    expect(fs.existsSync(sourceDb)).toBe(false);
    expect(databaseLooksInitialized(newDbPath)).toBe(true);

    const opened = new Database(newDbPath, { readonly: true });
    openDbs.push(opened);
    expect(
      opened.prepare("SELECT name FROM artists WHERE name = ?").get("from-rdcache")
    ).toMatchObject({ name: "from-rdcache" });
  });

  it("full ancient chain in one pass: metadata.db then empty .rdcache step", async () => {
    const root = createTempDir("ruledesk-relocate-chain-");
    tempDirs.push(root);
    const productDir = path.join(root, "RuleDesk");
    const rdcacheDir = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(productDir, { recursive: true });
    fs.mkdirSync(liveDir, { recursive: true });

    const legacyDbPath = path.join(productDir, LEGACY_DB_FILE_NAME);
    const newDbPath = path.join(liveDir, DB_FILE_NAME);

    const legacy = new Database(legacyDbPath);
    legacy.exec(
      "CREATE TABLE artists (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO artists (name) VALUES ('ancient');"
    );
    legacy.close();

    const step1 = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: "RuleDesk",
          userDataDir: productDir,
          dbPath: legacyDbPath,
        },
      ],
    });
    expect(step1.migrated).toBe(true);
    expect(fs.existsSync(newDbPath)).toBe(true);
    expect(fs.existsSync(legacyDbPath)).toBe(false);

    const step2 = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: LEGACY_NEUTRAL_USER_DATA_DIR_NAME,
          userDataDir: rdcacheDir,
          dbPath: path.join(rdcacheDir, DB_FILE_NAME),
        },
      ],
    });
    // No .rdcache source — leave the already-migrated live DB alone.
    expect(step2.migrated).toBe(false);
    expect(step2.blockedLegacyPath).toBeNull();
    expect(fs.existsSync(newDbPath)).toBe(true);

    const opened = new Database(newDbPath, { readonly: true });
    openDbs.push(opened);
    expect(
      opened.prepare("SELECT name FROM artists WHERE name = ?").get("ancient")
    ).toMatchObject({ name: "ancient" });
  });

  it("checkpoint failure on .rdcache leaves data there and does not create empty target", async () => {
    const root = createTempDir("ruledesk-relocate-checkpoint-");
    tempDirs.push(root);
    const rdcacheDir = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(rdcacheDir, { recursive: true });
    fs.mkdirSync(liveDir, { recursive: true });

    const sourceDb = path.join(rdcacheDir, DB_FILE_NAME);
    const newDbPath = path.join(liveDir, DB_FILE_NAME);
    fs.writeFileSync(sourceDb, "not-a-sqlite-database");

    const result = await migrateLegacyDatabase({
      newDbPath,
      legacyCandidates: [
        {
          userDataDirName: LEGACY_NEUTRAL_USER_DATA_DIR_NAME,
          userDataDir: rdcacheDir,
          dbPath: sourceDb,
        },
      ],
      deps: {
        openDatabase: () => {
          throw new Error("simulated checkpoint failure");
        },
      },
    });

    expect(result.migrated).toBe(false);
    expect(result.blockedLegacyPath).toBe(sourceDb);
    expect(fs.existsSync(sourceDb)).toBe(true);
    expect(fs.existsSync(newDbPath)).toBe(false);
  });

  it("EXDEV between .rdcache and RuleDesk-Data uses copy+verify+unlink", async () => {
    const root = createTempDir("ruledesk-relocate-exdev-");
    tempDirs.push(root);
    const source = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME, DB_FILE_NAME);
    const target = path.join(root, USER_DATA_DIR_NAME, DB_FILE_NAME);
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.writeFileSync(source, "relocate-exdev-payload");

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
    expect(fs.readFileSync(target, "utf-8")).toBe("relocate-exdev-payload");
    expect(fs.existsSync(source)).toBe(false);
  });

  it("light sidecars: fresher .rdcache app.log wins over stale Electron-default copy", () => {
    const root = createTempDir("ruledesk-relocate-sidecars-");
    tempDirs.push(root);
    const productDir = path.join(root, "RuleDesk");
    const rdcacheDir = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(path.join(productDir, "logs"), { recursive: true });
    fs.mkdirSync(path.join(rdcacheDir, "logs"), { recursive: true });
    fs.mkdirSync(liveDir, { recursive: true });

    const staleLog = "stale-electron-default-log\n";
    const freshLog = "fresh-rdcache-log-from-recent-months\n";
    fs.writeFileSync(path.join(productDir, "logs", "app.log"), staleLog, "utf-8");
    fs.writeFileSync(path.join(rdcacheDir, "logs", "app.log"), freshLog, "utf-8");

    migrateLightUserDataSidecars({
      rdcacheUserDataDir: rdcacheDir,
      electronDefaultUserDataDir: productDir,
      targetUserDataDir: liveDir,
    });

    const targetLog = path.join(liveDir, "logs", "app.log");
    expect(fs.existsSync(targetLog)).toBe(true);
    expect(fs.readFileSync(targetLog, "utf-8")).toBe(freshLog);
    // Sources are copy-not-rename — both leftovers remain on disk.
    expect(fs.readFileSync(path.join(productDir, "logs", "app.log"), "utf-8")).toBe(
      staleLog
    );
    expect(fs.readFileSync(path.join(rdcacheDir, "logs", "app.log"), "utf-8")).toBe(
      freshLog
    );
  });

  it("light sidecars: Electron-default is fallback when .rdcache has no app.log", () => {
    const root = createTempDir("ruledesk-relocate-sidecar-fallback-");
    tempDirs.push(root);
    const productDir = path.join(root, "RuleDesk");
    const rdcacheDir = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(path.join(productDir, "logs"), { recursive: true });
    fs.mkdirSync(rdcacheDir, { recursive: true });
    fs.mkdirSync(liveDir, { recursive: true });

    const onlyAncient = "only-ancient-log\n";
    fs.writeFileSync(path.join(productDir, "logs", "app.log"), onlyAncient, "utf-8");

    migrateLightUserDataSidecars({
      rdcacheUserDataDir: rdcacheDir,
      electronDefaultUserDataDir: productDir,
      targetUserDataDir: liveDir,
    });

    expect(fs.readFileSync(path.join(liveDir, "logs", "app.log"), "utf-8")).toBe(
      onlyAncient
    );
  });

  it("light sidecars: pending data.bin migrate overwrites stale target Local State from .rdcache", () => {
    const root = createTempDir("ruledesk-relocate-local-state-pending-");
    tempDirs.push(root);
    const productDir = path.join(root, "RuleDesk");
    const rdcacheDir = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(rdcacheDir, { recursive: true });
    fs.mkdirSync(liveDir, { recursive: true });
    fs.mkdirSync(productDir, { recursive: true });

    const legacyOsCrypt = '{"os_crypt":{"encrypted_key":"legacy-key"}}\n';
    const staleOsCrypt = '{"os_crypt":{"encrypted_key":"fresh-wrong-key"}}\n';
    fs.writeFileSync(path.join(rdcacheDir, DB_FILE_NAME), "legacy-db", "utf-8");
    fs.writeFileSync(
      path.join(rdcacheDir, LOCAL_STATE_FILE_NAME),
      legacyOsCrypt,
      "utf-8"
    );
    // Failed earlier launch already wrote a new Chromium profile key.
    fs.writeFileSync(
      path.join(liveDir, LOCAL_STATE_FILE_NAME),
      staleOsCrypt,
      "utf-8"
    );

    migrateLightUserDataSidecars({
      rdcacheUserDataDir: rdcacheDir,
      electronDefaultUserDataDir: productDir,
      targetUserDataDir: liveDir,
    });

    expect(
      fs.readFileSync(path.join(liveDir, LOCAL_STATE_FILE_NAME), "utf-8")
    ).toBe(legacyOsCrypt);
  });

  it("light sidecars: pending metadata.db migrate overwrites stale Local State from Electron-default", () => {
    const root = createTempDir("ruledesk-relocate-local-state-metadata-");
    tempDirs.push(root);
    const productDir = path.join(root, "RuleDesk");
    const rdcacheDir = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(productDir, { recursive: true });
    fs.mkdirSync(rdcacheDir, { recursive: true });
    fs.mkdirSync(liveDir, { recursive: true });

    const legacyOsCrypt = '{"os_crypt":{"encrypted_key":"ancient-product-key"}}\n';
    const staleOsCrypt = '{"os_crypt":{"encrypted_key":"fresh-wrong-key"}}\n';
    fs.writeFileSync(
      path.join(productDir, LEGACY_DB_FILE_NAME),
      "ancient-db",
      "utf-8"
    );
    fs.writeFileSync(
      path.join(productDir, LOCAL_STATE_FILE_NAME),
      legacyOsCrypt,
      "utf-8"
    );
    fs.writeFileSync(
      path.join(liveDir, LOCAL_STATE_FILE_NAME),
      staleOsCrypt,
      "utf-8"
    );

    migrateLightUserDataSidecars({
      rdcacheUserDataDir: rdcacheDir,
      electronDefaultUserDataDir: productDir,
      targetUserDataDir: liveDir,
    });

    expect(
      fs.readFileSync(path.join(liveDir, LOCAL_STATE_FILE_NAME), "utf-8")
    ).toBe(legacyOsCrypt);
  });

  it("light sidecars: Local State first-write-wins when target already has data.bin", () => {
    const root = createTempDir("ruledesk-relocate-local-state-stable-");
    tempDirs.push(root);
    const productDir = path.join(root, "RuleDesk");
    const rdcacheDir = path.join(root, LEGACY_NEUTRAL_USER_DATA_DIR_NAME);
    const liveDir = path.join(root, USER_DATA_DIR_NAME);
    fs.mkdirSync(rdcacheDir, { recursive: true });
    fs.mkdirSync(liveDir, { recursive: true });
    fs.mkdirSync(productDir, { recursive: true });

    const liveOsCrypt = '{"os_crypt":{"encrypted_key":"live-key"}}\n';
    const leftoverOsCrypt = '{"os_crypt":{"encrypted_key":"leftover-key"}}\n';
    fs.writeFileSync(path.join(liveDir, DB_FILE_NAME), "already-migrated", "utf-8");
    fs.writeFileSync(
      path.join(liveDir, LOCAL_STATE_FILE_NAME),
      liveOsCrypt,
      "utf-8"
    );
    fs.writeFileSync(
      path.join(rdcacheDir, LOCAL_STATE_FILE_NAME),
      leftoverOsCrypt,
      "utf-8"
    );

    migrateLightUserDataSidecars({
      rdcacheUserDataDir: rdcacheDir,
      electronDefaultUserDataDir: productDir,
      targetUserDataDir: liveDir,
    });

    expect(
      fs.readFileSync(path.join(liveDir, LOCAL_STATE_FILE_NAME), "utf-8")
    ).toBe(liveOsCrypt);
  });
});
