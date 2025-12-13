import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { DbType } from "./db-service";
import * as path from "path";
import { app } from "electron";
import { logger } from "../lib/logger";

export function runMigrations(db: DbType) {
  logger.info("Migrations: Инициализация...");

  // Определение пути к папке миграций
  // В Production (ASAR): process.resourcesPath/drizzle
  // В Development: <project_root>/drizzle (относительно dist/main/../../)
  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, "drizzle")
    : path.join(__dirname, "../../drizzle");

  logger.info(`Migrations: Путь к миграциям: ${migrationsFolder}`);

  try {
    migrate(db, { migrationsFolder });
    logger.info("Migrations: Успешно применены.");
  } catch (error) {
    logger.error("Migrations: FATAL ERROR", error);
    throw error; // Пробрасываем ошибку, чтобы остановить загрузку приложения
  }
}
