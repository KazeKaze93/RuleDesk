import fs from "fs";
import path from "path";
import type Database from "better-sqlite3";
import log from "electron-log";

function logDebug(message: string): void {
  if (typeof log.debug === "function") {
    log.debug(message);
  }
}

export type MigrationJournalEntry = { tag: string };

/** Suffix appended to dbPath for the pre-migration VACUUM INTO snapshot. */
export const PRE_MIGRATION_SNAPSHOT_SUFFIX = ".pre-migration-snapshot.bin";

const STATEMENT_BREAKPOINT_RE = /-->\s*statement-breakpoint\s*/i;

const HAS_ALTER_ADD_COLUMN_RE =
  /ALTER\s+TABLE\s+[`"']?\w+[`"']?\s+ADD(?:\s+COLUMN)?\s+/i;

/**
 * ALTER TABLE … ADD [COLUMN] … — SQLite has no IF NOT EXISTS for ADD COLUMN.
 * Captures table + column for PRAGMA table_info gating.
 */
const ALTER_ADD_COLUMN_RE =
  /^\s*ALTER\s+TABLE\s+[`"']?(\w+)[`"']?\s+ADD(?:\s+COLUMN)?\s+[`"']?(\w+)[`"']?/i;

export function getPreMigrationSnapshotPath(dbPath: string): string {
  return `${dbPath}${PRE_MIGRATION_SNAPSHOT_SUFFIX}`;
}

/**
 * True when this is an upgrade of an existing migrated DB (at least one row in
 * __drizzle_migrations) and the journal still has unapplied tags.
 * Fresh install (empty journal table) → false → no snapshot.
 */
export function hasPendingMigrations(
  sqlite: InstanceType<typeof Database>,
  migrationEntries: readonly MigrationJournalEntry[]
): boolean {
  // boundary: better-sqlite3 raw row
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const countRow = sqlite
    .prepare("SELECT COUNT(*) AS count FROM __drizzle_migrations")
    .get() as { count: number } | undefined;
  if ((countRow?.count ?? 0) === 0) {
    return false;
  }

  for (const entry of migrationEntries) {
    const existing = sqlite
      .prepare("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
      .get(entry.tag);
    if (!existing) {
      return true;
    }
  }
  return false;
}

/**
 * Consistent online snapshot via VACUUM INTO (not a hot file copy).
 * Writes through a temp path then renames over any prior snapshot.
 */
export function createPreMigrationSnapshot(
  sqlite: InstanceType<typeof Database>,
  dbPath: string
): string {
  const snapshotPath = getPreMigrationSnapshotPath(dbPath);
  const tempPath = `${snapshotPath}.tmp`;

  if (fs.existsSync(tempPath)) {
    fs.rmSync(tempPath, { force: true });
  }

  sqlite.prepare("VACUUM INTO ?").run(tempPath);

  if (fs.existsSync(snapshotPath)) {
    fs.rmSync(snapshotPath, { force: true });
  }
  fs.renameSync(tempPath, snapshotPath);

  log.info(`[DB] Pre-migration snapshot created at ${snapshotPath}`);
  return snapshotPath;
}

export function deletePreMigrationSnapshot(snapshotPath: string): void {
  try {
    if (fs.existsSync(snapshotPath)) {
      fs.rmSync(snapshotPath, { force: true });
      log.info(`[DB] Pre-migration snapshot deleted: ${snapshotPath}`);
    }
  } catch (error) {
    log.warn(`[DB] Failed to delete pre-migration snapshot ${snapshotPath}:`, error);
  }
}

export function ensureDrizzleMigrationsTable(
  sqlite: InstanceType<typeof Database>
): void {
  // Units: __drizzle_migrations.created_at is written with Date.now() = milliseconds.
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at bigint
    );
  `);
}

export function readMigrationJournal(
  migrationsFolder: string
): MigrationJournalEntry[] | null {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  try {
    const journalContent = fs.readFileSync(journalPath, "utf-8");
    const journal: unknown = JSON.parse(journalContent);
    if (
      typeof journal !== "object" ||
      journal === null ||
      !("entries" in journal) ||
      !Array.isArray(journal.entries)
    ) {
      return null;
    }
    const entries: MigrationJournalEntry[] = [];
    for (const entry of journal.entries) {
      if (
        typeof entry === "object" &&
        entry !== null &&
        "tag" in entry &&
        typeof entry.tag === "string"
      ) {
        entries.push({ tag: entry.tag });
      }
    }
    return entries;
  } catch {
    return null;
  }
}

function stripLineComments(sqlChunk: string): string {
  return sqlChunk
    .split("\n")
    .map((line) => {
      const commentIdx = line.indexOf("--");
      if (commentIdx === -1) {
        return line;
      }
      return line.slice(0, commentIdx);
    })
    .join("\n");
}

/**
 * Split a migration file into executable statements.
 * Honors Drizzle `--> statement-breakpoint` markers.
 * Does not split on `;` inside `BEGIN`…`END` trigger/procedure bodies.
 */
export function splitMigrationStatements(migrationSQL: string): string[] {
  const normalized = migrationSQL.replace(/\r\n/g, "\n");
  const chunks = STATEMENT_BREAKPOINT_RE.test(normalized)
    ? normalized.split(STATEMENT_BREAKPOINT_RE)
    : [normalized];

  const statements: string[] = [];
  for (const chunk of chunks) {
    const withoutComments = stripLineComments(chunk);
    statements.push(...splitSqlStatementsRespectingBeginEnd(withoutComments));
  }
  return statements;
}

function splitSqlStatementsRespectingBeginEnd(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let beginDepth = 0;
  const tokens = sql.split(/(\bBEGIN\b|\bEND\b|;)/i);

  for (const token of tokens) {
    if (token.length === 0) {
      continue;
    }
    const upper = token.toUpperCase();
    if (upper === "BEGIN") {
      beginDepth += 1;
      current += token;
      continue;
    }
    if (upper === "END") {
      beginDepth = Math.max(0, beginDepth - 1);
      current += token;
      continue;
    }
    if (token === ";" && beginDepth === 0) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = "";
      continue;
    }
    current += token;
  }

  const trailing = current.trim();
  if (trailing.length > 0) {
    statements.push(trailing);
  }
  return statements;
}

function tableHasColumn(
  sqlite: InstanceType<typeof Database>,
  tableName: string,
  columnName: string
): boolean {
  // PRAGMA table_info cannot be parameterized for the table name; tableName is
  // taken only from our own ALTER regex on trusted migration SQL.
  // boundary: better-sqlite3 raw row
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const rows = sqlite.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;
  return rows.some((row) => row.name === columnName);
}

/**
 * Execute one statement. ALTER ADD COLUMN is gated by PRAGMA table_info —
 * existing columns are skipped (statement-level), never whole-file skip-on-error.
 */
export function executeMigrationStatement(
  sqlite: InstanceType<typeof Database>,
  statement: string
): void {
  const addColumnMatch = ALTER_ADD_COLUMN_RE.exec(statement);
  if (addColumnMatch) {
    const tableName = addColumnMatch[1];
    const columnName = addColumnMatch[2];
    if (tableHasColumn(sqlite, tableName, columnName)) {
      logDebug(
        `[DB] Skipping ALTER ADD COLUMN ${tableName}.${columnName} (already present)`
      );
      return;
    }
  }

  sqlite.exec(statement);
}

function markMigrationExecuted(
  sqlite: InstanceType<typeof Database>,
  tag: string
): void {
  sqlite
    .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
    .run(tag, Date.now());
}

function applySpecialMigration0000(
  sqlite: InstanceType<typeof Database>,
  migrationSQL: string
): void {
  const artistsTableExists = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='artists'"
    )
    .get();
  if (artistsTableExists) {
    logDebug("[DB] Migration 0000: artists exists, skipping");
  } else {
    for (const statement of splitMigrationStatements(migrationSQL)) {
      executeMigrationStatement(sqlite, statement);
    }
  }
  markMigrationExecuted(sqlite, "0000_blue_lorna_dane");
}

function applySpecialMigration0010(sqlite: InstanceType<typeof Database>): void {
  // 0010 SQL also CREATE TRIGGER ON posts_fts (virtual) which always fails.
  // Apply only the table + singleton seed. Triggers are never created;
  // 0032 only DROPs dead names. Table kept for downgrade safety (unused).
  // Units: invalidated_at = milliseconds via julianday epoch-ms formula.
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS fts5_cache_invalidation (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      invalidated_at INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
    );
  `);
  sqlite.exec(`
    INSERT OR IGNORE INTO fts5_cache_invalidation (id, invalidated_at)
    VALUES (1, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));
  `);
  markMigrationExecuted(sqlite, "0010_add_fts5_cache_invalidation");
}

function applySpecialMigration0011(sqlite: InstanceType<typeof Database>): void {
  // 0011 SQL also CREATE TRIGGER ON posts_fts (virtual) which always fails.
  // Apply only the table + seed. Count triggers are never created.
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS fts5_count_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      count INTEGER NOT NULL DEFAULT 0
    );
  `);
  // boundary: better-sqlite3 raw row
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: better-sqlite3 raw row
  const countResult = sqlite
    .prepare("SELECT COUNT(*) as count FROM posts_fts")
    .get() as { count: number } | undefined;
  const count = countResult?.count ?? 0;
  sqlite.exec(`
    INSERT OR IGNORE INTO fts5_count_meta (id, count)
    VALUES (1, ${count});
  `);
  markMigrationExecuted(sqlite, "0011_add_fts5_count_meta");
}

function applyGenericMigration(
  sqlite: InstanceType<typeof Database>,
  tag: string,
  migrationSQL: string
): void {
  // Only statement-gate files that contain ALTER ADD COLUMN. Trigger bodies and
  // bulk scripts are safer as a single exec (BEGIN…END contains internal `;`).
  if (HAS_ALTER_ADD_COLUMN_RE.test(migrationSQL)) {
    for (const statement of splitMigrationStatements(migrationSQL)) {
      executeMigrationStatement(sqlite, statement);
    }
  } else {
    sqlite.exec(migrationSQL);
  }
  markMigrationExecuted(sqlite, tag);
}

/**
 * Apply a single migration file inside one better-sqlite3 transaction.
 * Any thrown error rolls back the whole file (including the journal insert).
 */
export function applyMigrationInTransaction(
  sqlite: InstanceType<typeof Database>,
  tag: string,
  migrationSQL: string
): void {
  const run = sqlite.transaction(() => {
    if (tag === "0000_blue_lorna_dane") {
      applySpecialMigration0000(sqlite, migrationSQL);
    } else if (tag === "0010_add_fts5_cache_invalidation") {
      applySpecialMigration0010(sqlite);
    } else if (tag === "0011_add_fts5_count_meta") {
      applySpecialMigration0011(sqlite);
    } else {
      applyGenericMigration(sqlite, tag, migrationSQL);
    }
  });
  run();
}

/**
 * Run all journal migrations that are not yet recorded in __drizzle_migrations.
 * Does not create/delete the pre-migration snapshot — caller owns that lifecycle.
 */
export function runManualMigrations(
  sqlite: InstanceType<typeof Database>,
  migrationsFolder: string,
  migrationEntries: readonly MigrationJournalEntry[]
): void {
  ensureDrizzleMigrationsTable(sqlite);

  for (const entry of migrationEntries) {
    const migrationFile = path.join(migrationsFolder, `${entry.tag}.sql`);

    if (!fs.existsSync(migrationFile)) {
      log.warn(`[DB] Migration file not found: ${migrationFile}`);
      continue;
    }

    const existing = sqlite
      .prepare("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
      .get(entry.tag);
    if (existing) {
      logDebug(`[DB] Migration ${entry.tag} already executed, skipping...`);
      continue;
    }

    const migrationSQL = fs.readFileSync(migrationFile, "utf-8");
    log.info(`[DB] Applying migration ${entry.tag}...`);
    applyMigrationInTransaction(sqlite, entry.tag, migrationSQL);
  }
}
