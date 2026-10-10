import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensureDrizzleMigrationsTable,
  readMigrationJournal,
  runManualMigrations,
} from "@/main/db/migration-runner";

const PROJECT_DRIZZLE = path.resolve(process.cwd(), "drizzle");
const LIVE_DB = path.join(
  process.env.LOCALAPPDATA ?? "",
  "RuleDesk-Data",
  "data.bin"
);

function count(sqlite: InstanceType<typeof Database>, sql: string): number {
  const row: unknown = sqlite.prepare(sql).get();
  if (
    typeof row !== "object" ||
    row === null ||
    !("c" in row) ||
    typeof row.c !== "number"
  ) {
    throw new Error(`unexpected count row for: ${sql}`);
  }
  return row.c;
}

describe("posts.provider migration on real DB copy", () => {
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

  it.skipIf(!fs.existsSync(LIVE_DB))(
    "upgrades copy: row counts, provider distribution, integrity, FTS, FK, indexes",
    () => {
      const tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "ruledesk-posts-provider-mig-")
      );
      tempDirs.push(tempDir);
      const copyPath = path.join(tempDir, "data.bin");
      fs.copyFileSync(LIVE_DB, copyPath);

      const sqlite = new Database(copyPath);
      openDbs.push(sqlite);

      const beforeTotal = count(sqlite, "SELECT COUNT(*) AS c FROM posts");
      const beforeExternal = count(
        sqlite,
        "SELECT COUNT(*) AS c FROM posts WHERE artist_id = 0"
      );

      const entries = readMigrationJournal(PROJECT_DRIZZLE);
      expect(entries).not.toBeNull();
      if (!entries) {
        throw new Error("missing journal");
      }

      ensureDrizzleMigrationsTable(sqlite);
      runManualMigrations(sqlite, PROJECT_DRIZZLE, entries);

      const afterTotal = count(sqlite, "SELECT COUNT(*) AS c FROM posts");
      const afterExternal = count(
        sqlite,
        "SELECT COUNT(*) AS c FROM posts WHERE artist_id = 0"
      );
      expect(afterTotal).toBe(beforeTotal);
      expect(afterExternal).toBe(beforeExternal);
      expect(afterTotal).toBe(2011);
      expect(afterExternal).toBe(21);

      const externalByProvider = sqlite
        .prepare(
          `SELECT provider, COUNT(*) AS c FROM posts WHERE artist_id = 0 GROUP BY provider`
        )
        .all();
      expect(externalByProvider).toEqual([{ provider: "rule34", c: 21 }]);

      const trackedMatch = sqlite
        .prepare(
          `SELECT
             SUM(CASE WHEN p.provider = a.provider THEN 1 ELSE 0 END) AS match_artist,
             COUNT(*) AS tracked
           FROM posts p
           JOIN artists a ON a.id = p.artist_id
           WHERE p.artist_id != 0`
        )
        .get();
      expect(trackedMatch).toEqual({ match_artist: 1990, tracked: 1990 });

      const integrity = sqlite.pragma("integrity_check");
      expect(integrity).toEqual([{ integrity_check: "ok" }]);
      expect(sqlite.pragma("foreign_key_check")).toEqual([]);

      // FTS5 integrity-check command
      sqlite
        .prepare(`INSERT INTO posts_fts(posts_fts) VALUES('integrity-check')`)
        .run();

      const oldUnique = sqlite
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='index' AND name='posts_artist_id_post_id_unique'`
        )
        .get();
      const newUnique = sqlite
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='index' AND name='posts_artist_id_provider_post_id_unique'`
        )
        .get();
      expect(oldUnique).toBeUndefined();
      expect(newUnique).toEqual({
        name: "posts_artist_id_provider_post_id_unique",
      });
    }
  );
});
