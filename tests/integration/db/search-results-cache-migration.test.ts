import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { settings, SETTINGS_ID } from "@/main/db/schema";

const SEARCH_RESULTS_CACHE_MIGRATION_TAG = "0035_add_search_results_cache";

describe("search_results_cache migration overlay", () => {
  let mockDb: ReturnType<typeof createMockDb> | undefined;

  afterEach(() => {
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch {
        // Ignore close errors in tests.
      }
    }
  });

  it("creates table + index on a populated pre-0035 database without dropping existing rows", () => {
    mockDb = createMockDb({
      omitMigrationTags: [SEARCH_RESULTS_CACHE_MIGRATION_TAG],
    });
    const { db, sqlite } = mockDb;

    db.insert(settings)
      .values({
        id: SETTINGS_ID,
        userId: "overlay-user",
        encryptedApiKey: "overlay-key",
        provider: "rule34",
        isSafeMode: false,
        isAdultConfirmed: true,
        isAdultVerified: true,
      })
      .run();

    const before = sqlite
      .prepare(
        `SELECT type, name, sql FROM sqlite_master
         WHERE name IN ('search_results_cache', 'search_results_cache_resolved_at_idx')
         ORDER BY name`
      )
      .all();
    expect(before).toEqual([]);

    const migrationSql = fs.readFileSync(
      path.resolve(process.cwd(), "drizzle", `${SEARCH_RESULTS_CACHE_MIGRATION_TAG}.sql`),
      "utf-8"
    );
    sqlite.exec(migrationSql);
    sqlite
      .prepare(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)"
      )
      .run(SEARCH_RESULTS_CACHE_MIGRATION_TAG, Date.now());

    const afterUnknown: unknown = sqlite
      .prepare(
        `SELECT type, name, sql FROM sqlite_master
         WHERE name IN ('search_results_cache', 'search_results_cache_resolved_at_idx')
         ORDER BY name`
      )
      .all();
    if (!Array.isArray(afterUnknown)) {
      throw new Error("sqlite_master query did not return an array");
    }

    const table = afterUnknown.find((row) => {
      return (
        typeof row === "object" &&
        row !== null &&
        "name" in row &&
        row.name === "search_results_cache"
      );
    });
    const index = afterUnknown.find((row) => {
      return (
        typeof row === "object" &&
        row !== null &&
        "name" in row &&
        row.name === "search_results_cache_resolved_at_idx"
      );
    });
    expect(table).toMatchObject({ type: "table" });
    expect(index).toMatchObject({ type: "index" });
    if (
      typeof table !== "object" ||
      table === null ||
      !("sql" in table) ||
      typeof table.sql !== "string"
    ) {
      throw new Error("search_results_cache sqlite_master sql missing");
    }
    expect(table.sql).toContain("cache_key");
    expect(table.sql).toContain("resolved_at");
    if (
      typeof index !== "object" ||
      index === null ||
      !("sql" in index) ||
      typeof index.sql !== "string"
    ) {
      throw new Error("search_results_cache index sql missing");
    }
    expect(index.sql).toContain("search_results_cache");

    const settingsRow = db
      .select({ userId: settings.userId })
      .from(settings)
      .all()[0];
    expect(settingsRow?.userId).toBe("overlay-user");
  });
});
