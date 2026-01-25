/**
 * Utility type to convert Drizzle schema types to IPC-safe format
 * 
 * Converts Date fields to numbers (timestamps in milliseconds) for Electron IPC serialization.
 * Required for Electron 39+ IPC serialization compatibility (V8 Structured Clone Algorithm).
 * 
 * This utility type can be reused for any Drizzle table schema to create IPC-safe types.
 * 
 * @example
 * ```typescript
 * import { playlists } from "../../main/db/schema";
 * import type { InferSelectModel } from "drizzle-orm";
 * type IpcPlaylist = IpcSafe<InferSelectModel<typeof playlists>>;
 * ```
 */
export type IpcSafe<T> = {
  [K in keyof T]: T[K] extends Date
    ? number
    : T[K] extends Date | null
    ? number | null
    : T[K];
};
