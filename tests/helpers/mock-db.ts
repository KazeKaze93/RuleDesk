import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/main/db/schema";
import path from "path";
import {
  ensureDrizzleMigrationsTable,
  readMigrationJournal,
  runManualMigrations,
} from "@/main/db/migration-runner";

/**
 * Creates a fresh in-memory database for testing via the production migration runner.
 *
 * @returns Object containing drizzle database instance and sqlite connection
 */
export function createMockDb(options?: {
  omitMigrationTags?: readonly string[];
}) {
  const omitMigrationTags = new Set(options?.omitMigrationTags ?? []);
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });

  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  const migrationEntries = readMigrationJournal(migrationsFolder);
  if (!migrationEntries) {
    sqlite.close();
    throw new Error("[Test DB] Could not read migration journal");
  }

  const filteredEntries = migrationEntries.filter(
    (entry) => !omitMigrationTags.has(entry.tag)
  );

  ensureDrizzleMigrationsTable(sqlite);
  runManualMigrations(sqlite, migrationsFolder, filteredEntries);

  return { db, sqlite };
}
