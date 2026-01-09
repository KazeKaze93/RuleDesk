import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/main/db/schema';
import path from 'path';

export function createMockDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  
  // Resolve path to the 'drizzle' folder in the project root
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  
  try {
    migrate(db, { migrationsFolder });
  } catch (e) {
    console.error('Migration failed in test environment. Path:', migrationsFolder);
    throw e;
  }

  return { db, sqlite };
}
