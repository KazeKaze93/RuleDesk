/**
 * IPC Serialization Utilities
 * 
 * Converts database objects to IPC-safe format by recursively transforming Date objects to numbers.
 * Required for Electron 39+ IPC serialization compatibility (V8 Structured Clone Algorithm).
 * 
 * Performance: This function is synchronous and performs recursive object traversal.
 * For large datasets (1000+ records), consider batching or using Worker threads.
 * However, for typical IPC responses (50-100 records per request), this is acceptable.
 * 
 * Security: Uses proper type guards and runtime checks instead of `as any` to prevent
 * unexpected data types from being serialized through IPC.
 */

/**
 * Type guard to check if value is a Date object.
 */
function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * Type guard to check if value is a plain object (not array, not null).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !isDate(value)
  );
}

/**
 * Type guard to check if value is a serializable primitive.
 * IPC can only serialize: string, number, boolean, null, undefined.
 */
function isSerializablePrimitive(
  value: unknown
): value is string | number | boolean | null | undefined {
  const type = typeof value;
  return (
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    value === null ||
    value === undefined
  );
}

/**
 * Recursively converts Date objects to numbers (timestamps in milliseconds) for IPC serialization.
 * Handles objects, arrays, and nested structures with proper type guards and runtime checks.
 * 
 * Type-safe: Uses TypeScript's type system with proper type guards instead of `as any`.
 * Runtime-safe: Validates data types at runtime to prevent unexpected values from being serialized.
 * 
 * @param data - Data to convert (object, array, or primitive)
 * @returns IPC-safe data with Date objects converted to numbers
 * @throws {TypeError} If data contains non-serializable types (functions, symbols, etc.)
 * 
 * @example
 * ```typescript
 * const dbPost = { id: 1, publishedAt: new Date(), createdAt: new Date() };
 * const ipcPost = toIpcSafe(dbPost); // { id: 1, publishedAt: 1234567890, createdAt: 1234567890 }
 * 
 * const dbArtists = [{ id: 1, createdAt: new Date() }, { id: 2, createdAt: new Date() }];
 * const ipcArtists = toIpcSafe(dbArtists); // Array with Date converted to numbers
 * ```
 */
export function toIpcSafe<T>(data: T): T extends Date
  ? number
  : T extends (infer U)[]
  ? U extends Date
    ? number[]
    : ReturnType<typeof toIpcSafe<U>>[]
  : T extends object
  ? {
      [K in keyof T]: T[K] extends Date
        ? number
        : T[K] extends Date | null
        ? number | null
        : ReturnType<typeof toIpcSafe<T[K]>>
    }
  : T {
  // Handle Date objects
  if (isDate(data)) {
    return data.getTime() as ReturnType<typeof toIpcSafe<T>>;
  }

  // Handle null/undefined (already serializable)
  if (data === null || data === undefined) {
    return data as ReturnType<typeof toIpcSafe<T>>;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => toIpcSafe(item)) as ReturnType<
      typeof toIpcSafe<T>
    >;
  }

  // Handle plain objects
  if (isPlainObject(data)) {
    const result: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        // Convert Date to number, or recursively process nested structures
        result[key] = isDate(value) ? value.getTime() : toIpcSafe(value);
      }
    }
    return result as ReturnType<typeof toIpcSafe<T>>;
  }

  // Handle serializable primitives (string, number, boolean)
  if (isSerializablePrimitive(data)) {
    return data as ReturnType<typeof toIpcSafe<T>>;
  }

  // Reject non-serializable types (functions, symbols, BigInt, etc.)
  // This prevents unexpected data from being sent through IPC
  throw new TypeError(
    `Cannot serialize non-serializable type: ${typeof data}. ` +
      `IPC can only serialize: string, number, boolean, null, undefined, Date, arrays, and plain objects.`
  );
}



