import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../../src/main/db/schema';
import path from 'path';

/**
 * Creates an in-memory SQLite database with migrations applied.
 * 
 * Each call creates a completely isolated database instance.
 * Useful for unit tests that need a clean database state.
 * 
 * @returns Object with `db` (Drizzle instance) and `sqlite` (better-sqlite3 instance)
 * 
 * @example
 * ```ts
 * const { db, sqlite } = createMockDb();
 * // Use db for queries
 * // sqlite.close() when done (optional, in-memory DB is destroyed on process exit)
 * ```
 */
export function createMockDb() {
  // 1. Создаем БД в памяти. 
  // Важно: каждый вызов создает абсолютно изолированную базу.
  const sqlite = new Database(':memory:');
  
  // 2. Подключаем Drizzle
  const db = drizzle(sqlite, { schema });

  // 3. Накатываем миграции
  // Нам нужно указать путь к папке drizzle относительно корня проекта или теста
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  
  try {
    migrate(db, { migrationsFolder });
  } catch (e) {
    console.error('CRITICAL: Migration failed in test environment.');
    console.error(`Looking for migrations in: ${migrationsFolder}`);
    throw e;
  }

  return { db, sqlite };
}
