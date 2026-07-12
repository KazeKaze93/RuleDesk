import log from "electron-log";
import { Token } from "./Token";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import type { SyncService } from "../../services/sync-service";
import type { SyncScheduler } from "../../services/sync-scheduler";
import type { BackupService } from "../../services/backup-service";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/** Compile-time typed keys. Map uses token.id (stable across module reload). */
export const DI_TOKENS = {
  DB: new Token<AppDatabase>("Database", "SQLite database instance"),
  SYNC_SERVICE: new Token<SyncService>("SyncService", "Artist synchronization service"),
  SYNC_SCHEDULER: new Token<SyncScheduler>("SyncScheduler", "Periodic synchronization scheduler"),
  BACKUP_SERVICE: new Token<BackupService>("BackupService", "Backup automation service"),
} as const;

function resolveServiceId(tokenOrId: Token<unknown> | string): string {
  return tokenOrId instanceof Token ? tokenOrId.id : tokenOrId;
}

function labelOf(tokenOrId: Token<unknown> | string, id: string): string {
  return tokenOrId instanceof Token ? tokenOrId.toString() : id;
}

/** Typed instance registry (singleton). Stores instances — not factories. */
export class Container {
  private static instance: Container | null = null;
  private readonly services = new Map<string, unknown>();

  private constructor() {
    log.info("[Container] DI Container initialized");
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public register<T>(tokenOrId: Token<T> | string, instance: T): void {
    const id = resolveServiceId(tokenOrId);
    if (!id || id.trim().length === 0) {
      throw new Error("[Container] Service ID cannot be empty");
    }
    if (instance === null || instance === undefined) {
      throw new Error(
        `[Container] Cannot register null/undefined for ${labelOf(tokenOrId, id)}`
      );
    }
    if (this.services.has(id)) {
      log.warn(
        `[Container] Service "${labelOf(tokenOrId, id)}" is being overwritten. Potential issue?`
      );
    }
    this.services.set(id, instance);
    log.info(`[Container] Registered service: ${labelOf(tokenOrId, id)}`);
  }

  public resolve<T>(tokenOrId: Token<T> | string): T {
    const id = resolveServiceId(tokenOrId);
    if (!this.services.has(id)) {
      const error = `[Container] Service "${labelOf(tokenOrId, id)}" not found. Did you forget to register it?`;
      log.error(error);
      throw new Error(error);
    }
    const service = this.services.get(id);
    // boundary: DI registry erasure
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- boundary: DI registry erasure
    return service as T;
  }

  public has(tokenOrId: Token<unknown> | string): boolean {
    return this.services.has(resolveServiceId(tokenOrId));
  }

  public clear(): void {
    log.warn("[Container] Clearing all services");
    this.services.clear();
  }

  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

export const container = Container.getInstance();
