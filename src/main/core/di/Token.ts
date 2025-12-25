/**
 * Type-safe DI Token
 *
 * Provides compile-time and runtime type safety for dependency injection.
 * Each token is bound to a specific type, preventing type mismatches at runtime.
 *
 * Usage:
 * ```typescript
 * const DB_TOKEN = new Token<AppDatabase>('Database');
 * container.register(DB_TOKEN, dbInstance);
 * const db = container.resolve(DB_TOKEN); // Type: AppDatabase
 * ```
 *
 * @template T - The type this token represents (used for compile-time type checking)
 */
// @ts-expect-error - T is used for type inference at compile time, not runtime
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- T is used for type inference
export class Token<T> {
  /**
   * Unique identifier for the token (for debugging and logging)
   */
  public readonly id: string;

  /**
   * Optional description for better error messages
   */
  public readonly description?: string;

  /**
   * Create a new type-safe token
   *
   * @param id - Unique identifier (should match DI_KEYS for consistency)
   * @param description - Optional description for better error messages
   */
  constructor(id: string, description?: string) {
    this.id = id;
    this.description = description;
  }

  /**
   * String representation for logging
   */
  public toString(): string {
    return this.description ? `${this.id} (${this.description})` : this.id;
  }
}

