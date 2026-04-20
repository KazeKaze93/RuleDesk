import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../db/schema";
import type { SyncService } from "../services/sync-service";

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface ServiceRegistry {
  db: AppDatabase;
  sync: SyncService;
}

const registry: Partial<ServiceRegistry> = {};

export function registerService<K extends keyof ServiceRegistry>(
  key: K,
  instance: ServiceRegistry[K]
): void {
  registry[key] = instance;
}

export function getService<K extends keyof ServiceRegistry>(
  key: K
): ServiceRegistry[K] {
  const svc = registry[key];
  if (!svc) {
    throw new Error(
      `[services] '${String(key)}' not initialized. Check main.ts bootstrap order.`
    );
  }
  return svc;
}

/** For tests only — reset state between test cases */
export function __resetServices(): void {
  (Object.keys(registry) as (keyof ServiceRegistry)[]).forEach((k) => {
    delete registry[k];
  });
}
