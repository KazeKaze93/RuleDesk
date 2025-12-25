import log from "electron-log";

/**
 * Typed DI Container Keys
 *
 * Prevents typos and provides type safety for service registration/resolution.
 */
export const DI_KEYS = {
  DB: "Database",
  PROVIDER_FACTORY: "ProviderFactory",
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
 * Simple Dependency Injection Container (Singleton)
 *
 * Manages service instances throughout the Main Process lifecycle.
 * Provides centralized registration and resolution with validation.
 */
export class Container {
  private static instance: Container | null = null;
  private readonly services: Map<string, unknown> = new Map();
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
   * @param id - Unique identifier for the service
   * @param instance - Service instance to register
   * @throws {Error} If id is empty
   */
  public register<T>(id: string, instance: T): void {
    if (!id || id.trim().length === 0) {
      throw new Error("[Container] Service ID cannot be empty");
    }

    if (this.services.has(id)) {
      log.warn(
        `[Container] Service "${id}" is being overwritten. Potential issue?`
      );
    }

    this.services.set(id, instance);
    log.info(`[Container] Registered service: ${id}`);
  }

  /**
   * Resolve a service from the container
   *
   * @param id - Unique identifier of the service
   * @returns The requested service instance
   * @throws {Error} If service is not found, circular dependency detected, or type mismatch
   */
  public resolve<T>(id: string): T {
    // Check for circular dependencies
    if (this.resolutionStack.has(id)) {
      const cycle = Array.from(this.resolutionStack).concat(id).join(" -> ");
      const error = `[Container] Circular dependency detected: ${cycle}`;
      log.error(error);
      throw new Error(error);
    }

    if (!this.services.has(id)) {
      const error = `[Container] Service "${id}" not found. Did you forget to register it?`;
      log.error(error);
      throw new Error(error);
    }

    // Track resolution stack for cycle detection
    this.resolutionStack.add(id);
    try {
      const service = this.services.get(id);
      return service as T;
    } finally {
      // Remove from stack after resolution (allows same service to be resolved again)
      this.resolutionStack.delete(id);
    }
  }

  /**
   * Check if a service is registered
   *
   * @param id - Service identifier
   * @returns true if service exists, false otherwise
   */
  public has(id: string): boolean {
    return this.services.has(id);
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
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

// Export singleton instance for convenience
export const container = Container.getInstance();
