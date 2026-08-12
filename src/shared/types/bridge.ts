/**
 * Renderer-facing IPC DTO extras defined on the preload contract.
 *
 * Source of truth remains `src/main/bridge.ts`. Type-only re-export so the
 * renderer never imports `main/` directly.
 */
export type { TrackedArtist, PlaylistWithStats } from "../../main/bridge";
