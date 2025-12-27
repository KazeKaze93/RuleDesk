/**
 * IPC Serialization Utilities
 * 
 * Converts database objects to IPC-safe format by recursively transforming Date objects to numbers.
 * Required for Electron 39+ IPC serialization compatibility (V8 Structured Clone Algorithm).
 * 
 * Performance: This function is synchronous and performs recursive object traversal.
 * For large datasets (1000+ records), consider batching or using Worker threads.
 * However, for typical IPC responses (50-100 records per request), this is acceptable.
 */

/**
 * Recursively converts Date objects to numbers (timestamps in milliseconds) for IPC serialization.
 * Handles objects, arrays, and nested structures.
 * 
 * Type-safe: Uses TypeScript's type system to ensure correct transformation.
 * 
 * @param data - Data to convert (object, array, or primitive)
 * @returns IPC-safe data with Date objects converted to numbers
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
  if (data instanceof Date) {
    return data.getTime() as any;
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data as any;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => toIpcSafe(item)) as any;
  }

  // Handle objects
  if (typeof data === "object") {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        // Convert Date to number, or recursively process nested structures
        result[key] = value instanceof Date ? value.getTime() : toIpcSafe(value);
      }
    }
    return result as any;
  }

  // Handle primitives (string, number, boolean, etc.)
  return data as any;
}

