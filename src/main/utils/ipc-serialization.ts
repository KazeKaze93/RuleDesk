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

import type { IpcSafe } from "../../shared/types/ipc";

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

type ToIpcSafeResult<T> = T extends Date
  ? number
  : T extends (infer U)[]
    ? ToIpcSafeResult<U>[]
    : T extends object
      ? IpcSafe<T>
      : T;

/**
 * Recursively converts Date objects to numbers (timestamps in milliseconds) for IPC serialization.
 * Handles objects, arrays, and nested structures with proper type guards and runtime checks.
 *
 * @param data - Data to convert (object, array, or primitive)
 * @returns IPC-safe data with Date objects converted to numbers
 * @throws {TypeError} If data contains non-serializable types (functions, symbols, etc.)
 */
export function toIpcSafe<T>(data: T): ToIpcSafeResult<T> {
  // Handle Date objects
  if (isDate(data)) {
    // boundary: toIpcSafe Date → number branch of conditional return type
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- boundary: toIpcSafe
    return data.getTime() as ToIpcSafeResult<T>;
  }

  // Handle null/undefined (already serializable)
  if (data === null || data === undefined) {
    // boundary: toIpcSafe nullish passthrough
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- boundary: toIpcSafe
    return data as ToIpcSafeResult<T>;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    // boundary: toIpcSafe array map preserves ToIpcSafeResult element typing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- boundary: toIpcSafe
    return data.map((item) => toIpcSafe(item)) as ToIpcSafeResult<T>;
  }

  // Handle plain objects
  if (isPlainObject(data)) {
    const result: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        result[key] = isDate(value) ? value.getTime() : toIpcSafe(value);
      }
    }
    // boundary: toIpcSafe plain-object rebuild matches IpcSafe<T>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- boundary: toIpcSafe
    return result as ToIpcSafeResult<T>;
  }

  // Handle serializable primitives (string, number, boolean)
  if (isSerializablePrimitive(data)) {
    // boundary: toIpcSafe primitive passthrough
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- boundary: toIpcSafe
    return data as ToIpcSafeResult<T>;
  }

  // Reject non-serializable types (functions, symbols, BigInt, etc.)
  throw new TypeError(
    `Cannot serialize non-serializable type: ${typeof data}. ` +
      `IPC can only serialize: string, number, boolean, null, undefined, Date, arrays, and plain objects.`
  );
}
