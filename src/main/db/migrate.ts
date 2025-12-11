import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { DbType } from "./db-service";

/**
 * Запускает миграции базы данных при старте приложения.
 * @param db - Инстанс Drizzle ORM
 */
export function runMigrations(db: DbType) {
  try {
    console.log("Migrations: Запуск миграций...");

    const migrationsFolder = "./drizzle";

    migrate(db, { migrationsFolder });

    console.log("Migrations: Успешно завершено.");
  } catch (error) {
    console.error("Migrations: КРИТИЧЕСКАЯ ОШИБКА МИГРАЦИЙ", error);
  }
}
