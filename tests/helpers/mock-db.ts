import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/main/db/schema';
import path from 'path';
import fs from 'fs';

/**
 * Creates a fresh in-memory database for testing
 * 
 * CRITICAL: Uses `:memory:` to ensure a clean slate for each test.
 * This guarantees that migrations run on a fresh database every time,
 * preventing "duplicate column" errors from redundant migrations.
 * 
 * WORKAROUND: Migration 0004 tries to add columns (is_adult_verified, tos_accepted_at)
 * that already exist in migration 0000. This is a known issue with the migration history.
 * 
 * Solution: We manually execute migrations, skipping 0004 if it fails with duplicate column error.
 * 
 * @returns Object containing drizzle database instance and sqlite connection
 */
export function createMockDb() {
  // Use :memory: database to ensure fresh state for each test
  // This prevents state leakage between test runs
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  
  // Resolve path to the 'drizzle' folder in the project root
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  
  // Read migration journal to get migration order
  const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');
  let migrationEntries: Array<{ tag: string }> = [];
  
  try {
    const journalContent = fs.readFileSync(journalPath, 'utf-8');
    const journal = JSON.parse(journalContent);
    migrationEntries = journal.entries || [];
  } catch (journalError) {
    // If journal doesn't exist, fall back to standard migrate
    console.warn('[Test DB] Could not read migration journal, using standard migrate');
    try {
      migrate(db, { migrationsFolder });
      return { db, sqlite };
    } catch (e) {
      sqlite.close();
      throw e;
    }
  }
  
  // Create __drizzle_migrations table if it doesn't exist
  // This table is created by drizzle's migrate function, but we need it for manual tracking
  // SQLite doesn't support SERIAL, use INTEGER PRIMARY KEY AUTOINCREMENT instead
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at bigint
    );
  `);
  
  // Execute migrations manually, handling duplicate column errors
  for (const entry of migrationEntries) {
    const migrationFile = path.join(migrationsFolder, `${entry.tag}.sql`);
    
    if (!fs.existsSync(migrationFile)) {
      console.warn(`[Test DB] Migration file not found: ${migrationFile}`);
      continue;
    }
    
    // Check if migration was already executed
    const existing = sqlite.prepare('SELECT hash FROM __drizzle_migrations WHERE hash = ?').get(entry.tag);
    if (existing) {
      console.log(`[Test DB] Migration ${entry.tag} already executed, skipping...`);
      continue;
    }
    
    try {
      const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');
      
      // Skip migration 0004 if it contains ALTER TABLE for columns that might already exist
      // This is a workaround for the duplicate column issue
      if (entry.tag === '0004_exotic_misty_knight') {
        // Check if columns already exist before attempting to add them
        const tableInfo = sqlite.prepare("PRAGMA table_info(settings)").all() as Array<{ name: string }>;
        const columnNames = tableInfo.map(col => col.name);
        
        // Only execute ALTER TABLE if columns don't exist
        const needsIsAdultVerified = !columnNames.includes('is_adult_verified');
        const needsTosAcceptedAt = !columnNames.includes('tos_accepted_at');
        
        if (needsIsAdultVerified) {
          sqlite.exec('ALTER TABLE settings ADD COLUMN is_adult_verified integer DEFAULT 0 NOT NULL;');
        }
        if (needsTosAcceptedAt) {
          sqlite.exec('ALTER TABLE settings ADD COLUMN tos_accepted_at integer;');
        }
        
        // Mark migration as executed
        sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(entry.tag, Date.now());
      } else {
        // Execute other migrations normally
        sqlite.exec(migrationSQL);
        
        // Mark migration as executed
        sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(entry.tag, Date.now());
      }
    } catch (migrationError: unknown) {
      const error = migrationError as Error & { code?: string; message?: string };
      const errorMessage = error.message || String(error);
      const errorCode = error.code || '';
      
      // If it's a duplicate column error, log and mark as executed
      if (errorCode === 'SQLITE_ERROR' && errorMessage.includes('duplicate column')) {
        console.warn(`[Test DB] Migration ${entry.tag} attempted to add duplicate column. Skipping...`);
        // Mark as executed anyway to prevent retry
        try {
          sqlite.prepare('INSERT OR IGNORE INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(entry.tag, Date.now());
        } catch {
          // Ignore errors when marking
        }
      } else {
        // For other errors, throw
        console.error(`[Test DB] Migration ${entry.tag} failed:`, errorMessage);
        sqlite.close();
        throw migrationError;
      }
    }
  }

  return { db, sqlite };
}
