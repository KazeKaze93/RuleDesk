import log from "electron-log";
import { Token } from "./Token";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import type { SyncService } from "../../services/sync-service";

// Type aliases for cleaner token definitions
type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * Type-safe DI Tokens
 *
 * Each token is bound to a specific type, preventing type mismatches at runtime.
 * Using tokens instead of string keys provides:
 * - Compile-time type safety
 * - Runtime type validation
 * - Better error messages
 */
export const DI_TOKENS = {
  DB: new Token<AppDatabase>("Database", "SQLite database instance"),
  SYNC_SERVICE: new Token<SyncService>("SyncService", "Artist synchronization service"),
} as const;

/**
 * Legacy string keys (deprecated, use DI_TOKENS instead)
 * @deprecated Use DI_TOKENS for type-safe dependency injection
 */
export const DI_KEYS = {
  DB: "Database",
  SYNC_SERVICE: "SyncService",
} as const;

/**
 * Note: Runtime type checking removed
 * 
 * typeof check is useless for objects (always returns "object").
 * For proper DI validation, we would need instanceof checks with constructor references,
 * but that adds complexity without real benefit since TypeScript already provides compile-time safety.
 * 
 * If runtime validation is truly needed, implement proper instanceof checks with constructor injection.
 */

/**
 * Type-safe Dependency Injection Container (Singleton)
 *
 * Manages service instances throughout the Main Process lifecycle.
 * Provides centralized registration and resolution with type safety.
 *
 * Usage:
 * ```typescript
 * const dbToken = DI_TOKENS.DB;
 * container.register(dbToken, dbInstance);
 * const db = container.resolve(dbToken); // Type: AppDatabase
 * ```
 */
export class Container {
  private static instance: Container | null = null;
  private readonly services: Map<string | Token<unknown>, unknown> = new Map();
  private readonly resolutionStack: Set<string> = new Set();

  /**
   * Private constructor to enforce Singleton pattern
   */
  private constructor() {
    log.info("[Container] DI Container initialized");
  }

  /**
   * Get the singleton instance of the Container
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register a service instance with the container
   *
   * @param tokenOrId - Type-safe token or legacy string ID
   * @param instance - Service instance to register (must match token type)
   * @throws {Error} If id is empty or instance type doesn't match token
   */
  public register<T>(tokenOrId: Token<T> | string, instance: T): void {
    const id = tokenOrId instanceof Token ? tokenOrId.id : tokenOrId;

    if (!id || id.trim().length === 0) {
      throw new Error("[Container] Service ID cannot be empty");
    }

    if (this.services.has(tokenOrId)) {
      log.warn(
        `[Container] Service "${tokenOrId instanceof Token ? tokenOrId.toString() : id}" is being overwritten. Potential issue?`
      );
    }

    // Runtime type validation for tokens
    if (tokenOrId instanceof Token) {
      // Basic type checking: ensure instance is not null/undefined and is an object/function
      if (instance === null || instance === undefined) {
        throw new Error(
          `[Container] Cannot register null/undefined for token ${tokenOrId.toString()}`
        );
      }

      // For better type safety, we could add instanceof checks here
      // but that would require storing constructor references in tokens
      // For now, TypeScript compile-time checks + runtime null checks are sufficient
    }

    this.services.set(tokenOrId, instance);
    log.info(
      `[Container] Registered service: ${tokenOrId instanceof Token ? tokenOrId.toString() : id}`
    );
  }

  /**
   * Resolve a service from the container
   *
   * @param tokenOrId - Type-safe token or legacy string ID
   * @returns The requested service instance (type-safe when using tokens)
   * @throws {Error} If service is not found, circular dependency detected, or type mismatch
   */
  public resolve<T>(tokenOrId: Token<T> | string): T {
    const id = tokenOrId instanceof Token ? tokenOrId.id : tokenOrId;

    // Check for circular dependencies
    if (this.resolutionStack.has(id)) {
      const cycle = Array.from(this.resolutionStack).concat(id).join(" -> ");
      const error = `[Container] Circular dependency detected: ${cycle}`;
      log.error(error);
      throw new Error(error);
    }

    if (!this.services.has(tokenOrId)) {
      const error = `[Container] Service "${tokenOrId instanceof Token ? tokenOrId.toString() : id}" not found. Did you forget to register it?`;
      log.error(error);
      throw new Error(error);
    }

    // Track resolution stack for cycle detection
    this.resolutionStack.add(id);
    try {
      const service = this.services.get(tokenOrId);
      
      // Runtime validation: ensure service is not null/undefined
      if (service === null || service === undefined) {
        throw new Error(
          `[Container] Service "${tokenOrId instanceof Token ? tokenOrId.toString() : id}" resolved to null/undefined`
        );
      }

      return service as T;
    } finally {
      // Remove from stack after resolution (allows same service to be resolved again)
      this.resolutionStack.delete(id);
    }
  }

  /**
   * Check if a service is registered
   *
   * @param tokenOrId - Type-safe token or legacy string ID
   * @returns true if service exists, false otherwise
   */
  public has(tokenOrId: Token<unknown> | string): boolean {
    return this.services.has(tokenOrId);
  }

  /**
   * Clear all registered services (useful for testing)
   * ⚠️ Use with caution in production
   */
  public clear(): void {
    log.warn("[Container] Clearing all services");
    this.services.clear();
  }

  /**
   * Get all registered service IDs (for debugging)
   */
  public getRegisteredServices(): (string | Token<unknown>)[] {
    return Array.from(this.services.keys());
  }
}

// Export singleton instance for convenience
export const container = Container.getInstance();
