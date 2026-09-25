import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { migrateBackupDirectory } from "@/main/db/backup-dir-migrate";
import {
  BACKUP_DIR_NAME,
  BACKUP_FILE_PREFIX,
  LEGACY_USER_DATA_DIR_NAMES,
} from "@/main/db/paths";
import {
  buildAutoBackupFilename,
  buildManualBackupFilename,
} from "@/main/lib/database-backup";
import { getBackupSidecarPath } from "@/main/lib/backup-sidecar";

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFile(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf-8");
}

describe("backup directory path constants", () => {
  it("BACKUP_DIR_NAME never collides with LEGACY_USER_DATA_DIR_NAMES", () => {
    expect(LEGACY_USER_DATA_DIR_NAMES).not.toContain(BACKUP_DIR_NAME);
    for (const legacyName of LEGACY_USER_DATA_DIR_NAMES) {
      expect(BACKUP_DIR_NAME).not.toBe(legacyName);
      // Backup folder must not be nested under a legacy product dir name either.
      expect(BACKUP_DIR_NAME.startsWith(`${legacyName}${path.sep}`)).toBe(false);
      expect(BACKUP_DIR_NAME.startsWith(`${legacyName}/`)).toBe(false);
    }
  });
});

describe("backup directory migrate", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  it("moves auto, manual, and legacy backups plus sidecars out of source", async () => {
    const root = createTempDir("ruledesk-backup-migrate-");
    tempDirs.push(root);
    const sourceDir = path.join(root, ".rdcache");
    const targetDir = path.join(root, "RuleDesk-Backups");
    fs.mkdirSync(sourceDir, { recursive: true });

    const autoName = buildAutoBackupFilename(new Date("2026-01-15T00:00:00Z"));
    const manualName = buildManualBackupFilename(new Date("2026-01-16T12:00:00Z"));
    const legacyName = "data.backup.2026-01-14.bin";
    const liveDb = "data.bin";

    writeFile(path.join(sourceDir, autoName), "auto-bytes");
    writeFile(path.join(sourceDir, `${autoName}.settings.json`), '{"v":1}');
    writeFile(path.join(sourceDir, manualName), "manual-bytes");
    // Manual without sidecar — allowed
    writeFile(path.join(sourceDir, legacyName), "legacy-bytes");
    writeFile(
      path.join(sourceDir, `${legacyName}.settings.json`),
      '{"legacy":true}'
    );
    writeFile(path.join(sourceDir, liveDb), "LIVE-DB-MUST-STAY");
    writeFile(path.join(sourceDir, "unrelated.txt"), "ignore-me");

    const result = await migrateBackupDirectory({ sourceDir, targetDir });

    expect(result.failed).toEqual([]);
    expect(result.moved.sort()).toEqual(
      [autoName, manualName, legacyName].sort()
    );
    expect(fs.existsSync(path.join(sourceDir, autoName))).toBe(false);
    expect(fs.existsSync(path.join(sourceDir, manualName))).toBe(false);
    expect(fs.existsSync(path.join(sourceDir, legacyName))).toBe(false);
    expect(fs.readFileSync(path.join(targetDir, autoName), "utf-8")).toBe(
      "auto-bytes"
    );
    expect(
      fs.readFileSync(path.join(targetDir, `${autoName}.settings.json`), "utf-8")
    ).toBe('{"v":1}');
    expect(fs.readFileSync(path.join(targetDir, manualName), "utf-8")).toBe(
      "manual-bytes"
    );
    expect(fs.existsSync(getBackupSidecarPath(path.join(targetDir, manualName)))).toBe(
      false
    );
    expect(fs.readFileSync(path.join(targetDir, legacyName), "utf-8")).toBe(
      "legacy-bytes"
    );
    expect(
      fs.readFileSync(path.join(targetDir, `${legacyName}.settings.json`), "utf-8")
    ).toBe('{"legacy":true}');

    // Live DB and unrelated files stay in source
    expect(fs.readFileSync(path.join(sourceDir, liveDb), "utf-8")).toBe(
      "LIVE-DB-MUST-STAY"
    );
    expect(fs.existsSync(path.join(sourceDir, "unrelated.txt"))).toBe(true);
    expect(autoName.startsWith(BACKUP_FILE_PREFIX)).toBe(true);
  });

  it("skips targets that already exist and retries only remaining sources", async () => {
    const root = createTempDir("ruledesk-backup-migrate-idempotent-");
    tempDirs.push(root);
    const sourceDir = path.join(root, ".rdcache");
    const targetDir = path.join(root, "RuleDesk-Backups");
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(targetDir, { recursive: true });

    const alreadyMoved = buildAutoBackupFilename(new Date("2026-02-01T00:00:00Z"));
    const remaining = buildManualBackupFilename(new Date("2026-02-02T00:00:00Z"));

    writeFile(path.join(sourceDir, alreadyMoved), "source-copy");
    writeFile(path.join(targetDir, alreadyMoved), "target-original");
    writeFile(path.join(sourceDir, remaining), "remaining-bytes");

    const first = await migrateBackupDirectory({ sourceDir, targetDir });
    expect(first.skippedExisting).toEqual([alreadyMoved]);
    expect(first.moved).toEqual([remaining]);
    expect(fs.readFileSync(path.join(targetDir, alreadyMoved), "utf-8")).toBe(
      "target-original"
    );
    expect(fs.existsSync(path.join(sourceDir, alreadyMoved))).toBe(true);
    expect(fs.existsSync(path.join(sourceDir, remaining))).toBe(false);

    const second = await migrateBackupDirectory({ sourceDir, targetDir });
    expect(second.moved).toEqual([]);
    expect(second.skippedExisting).toEqual([alreadyMoved]);
    expect(second.failed).toEqual([]);
  });

  it("continues after a per-file failure (injected move error)", async () => {
    const root = createTempDir("ruledesk-backup-migrate-partial-");
    tempDirs.push(root);
    const sourceDir = path.join(root, ".rdcache");
    const targetDir = path.join(root, "RuleDesk-Backups");
    fs.mkdirSync(sourceDir, { recursive: true });

    const good = buildManualBackupFilename(new Date("2026-03-01T00:00:00Z"));
    const bad = buildAutoBackupFilename(new Date("2026-03-02T00:00:00Z"));
    writeFile(path.join(sourceDir, good), "good");
    writeFile(path.join(sourceDir, bad), "bad");

    const result = await migrateBackupDirectory({
      sourceDir,
      targetDir,
      deps: {
        moveFile: async (sourcePath, targetPath) => {
          if (path.basename(sourcePath) === bad) {
            throw new Error("simulated lock");
          }
          fs.renameSync(sourcePath, targetPath);
          return true;
        },
      },
    });
    expect(result.moved).toEqual([good]);
    expect(result.failed.length).toBe(1);
    expect(result.failed[0]?.filename).toBe(bad);
    expect(fs.existsSync(path.join(targetDir, good))).toBe(true);
    expect(fs.existsSync(path.join(sourceDir, bad))).toBe(true);
  });

  it("no-ops when source has no backup files", async () => {
    const root = createTempDir("ruledesk-backup-migrate-empty-");
    tempDirs.push(root);
    const sourceDir = path.join(root, ".rdcache");
    const targetDir = path.join(root, "RuleDesk-Backups");
    fs.mkdirSync(sourceDir, { recursive: true });
    writeFile(path.join(sourceDir, "data.bin"), "live");

    const result = await migrateBackupDirectory({ sourceDir, targetDir });
    expect(result).toEqual({ moved: [], skippedExisting: [], failed: [] });
    expect(fs.existsSync(path.join(sourceDir, "data.bin"))).toBe(true);
  });
});
