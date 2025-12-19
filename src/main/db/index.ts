import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import * as path from "path";
import { logger } from "../lib/logger";

export type DbType = BetterSQLite3Database<typeof schema>;

let db: DbType | null = null;
let dbInstance: Database.Database | null = null; // "Сырой" инстанс

function getMigrationsPath(): string {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return path.join(process.cwd(), "drizzle");
  }

  return path.join(process.resourcesPath, "drizzle");
}

export function initializeDatabase(dbPath: string): DbType {
  if (db) {
    return db;
  }

  try {
    // 1. Создаем raw connection
    dbInstance = new Database(dbPath, {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    });

    // 2. Оборачиваем в Drizzle
    db = drizzle(dbInstance, { schema });

    const migrationsPath = getMigrationsPath();
    logger.info(`Database: Migrations Path: ${migrationsPath}`);

    // 3. Накатываем миграции
    migrate(db, { migrationsFolder: migrationsPath });
    logger.info("Database: Migrations applied successfully.");

    return db;
  } catch (error) {
    logger.error("Database: FATAL ERROR", error);
    throw new Error(`Failed to initialize database: ${error}`);
  }
}

// Возвращает Drizzle-обертку (для обычных запросов)
export function getDatabase(): DbType {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return db;
}

// 🔥 НОВАЯ ФУНКЦИЯ: Возвращает raw better-sqlite3 (для backup/restore)
export function getRawDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return dbInstance;
}
